import Orbit from 'orbit/core';
import clone from 'orbit/lib/clone';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var RestStore = function(options) {
  Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

  options = options || {};
  this.remoteIdField = options['remoteIdField'] || 'id';
  this.namespace = options['namespace'];
  this.headers = options['headers'];

  this.idField = Orbit.idField;

  this._localCache = {};
  this._remoteIdMap = {};

  Transformable.extend(this);
  Requestable.extend(this, ['findRecord', 'createRecord', 'updateRecord', 'patchRecord', 'deleteRecord']);
};

RestStore.prototype = {
  constructor: RestStore,

  retrieve: function(type, id) {
    var dataForType = this._localCache[type];
    if (id && typeof id === 'object') id = id[this.idField];
    if (dataForType) return dataForType[id];
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(action, type, data) {
    var _this = this,
        id = data[this.idField];

    if (action === 'add') {
      if (id) {
        var recordInCache = _this.retrieve(type, id);
        if (recordInCache) {
          throw new Orbit.AlreadyExistsException(type, data);
        }
      }

      return this._ajax(this._buildURL(type), 'POST', {data: this._serialize(type, data)}).then(
        function(raw) {
          return _this._addToCache(type, _this._deserialize(type, raw), id);
        }
      );

    } else {
      var remoteId = this._lookupRemoteId(type, data);

      if (!remoteId) throw new Orbit.NotFoundException(type, data);

      if (action === 'replace') {
        return this._ajax(this._buildURL(type, remoteId), 'PUT', {data: this._serialize(type, data)}).then(
          function(raw) {
            return _this._addToCache(type, _this._deserialize(type, raw), id);
          }
        );

      } else if (action === 'patch') {
        // no need to transmit remote id along with a patched record
        delete data[this.remoteIdField];

        return this._ajax(this._buildURL(type, remoteId), 'PATCH', {data: this._serialize(type, data)}).then(
          function(raw) {
            return _this._addToCache(type, _this._deserialize(type, raw), id);
          }
        );

      } else if (action === 'remove') {
        return this._ajax(this._buildURL(type, remoteId), 'DELETE').then(
          function() {
            var record = _this.retrieve(type, id);
            if (!record) {
              record = {};
              _this._addToCache(type, record, id);
            }
            record.deleted = true;
            Orbit.incrementVersion(record);

            return record;
          }
        );

      }
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _findRecord: function(type, id) {
    if (id && (typeof id === 'number' || typeof id === 'string')) {
      var remoteId = this._lookupRemoteId(type, id);
      if (!remoteId) throw new Orbit.NotFoundException(type, id);
      return this._findOne(type, remoteId);

    } else if (id && (typeof id === 'object' && id[this.remoteIdField])) {
      return this._findOne(type, id[this.remoteIdField]);

    } else {
      return this._findQuery(type, id);
    }
  },

  _createRecord: function(type, data) {
    return this.transform('add', type, data);
  },

  _updateRecord: function(type, data) {
    return this.transform('replace', type, data);
  },

  _patchRecord: function(type, data) {
    return this.transform('patch', type, data);
  },

  _deleteRecord: function(type, data) {
    return this.transform('remove', type, data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _findOne: function(type, remoteId) {
    var _this = this;
    return this._ajax(this._buildURL(type, remoteId), 'GET').then(
      function(raw) {
        var record = _this._deserialize(type, raw);
        _this._recordFound(type, record);
        return record;
      }
    );
  },

  _findQuery: function(type, query) {
    var _this = this;

    return this._ajax(this._buildURL(type), 'GET', {data: query}).then(
      function(raw) {
        var eachRaw,
            record,
            records = [];

        raw.forEach(function(eachRaw) {
          record = _this._deserialize(type, eachRaw);
          _this._recordFound(type, record);
          records.push(record);
        });

        return records;
      }
    );
  },

  _recordFound: function(type, record) {
    var remoteId = record[this.remoteIdField],
        id = this._remoteToLocalId(type, remoteId),
        newRecord = !id;

    if (newRecord) {
      id = record[this.idField] = Orbit.generateId();
    }
    this._addToCache(type, record, id);

    this.didTransform.call(this, (newRecord ? 'add' : 'replace'), type, record);
  },

  _remoteToLocalId: function(type, remoteId) {
    var dataForType = this._remoteIdMap[type];
    if (dataForType) return dataForType[remoteId];
  },

  _lookupRemoteId: function(type, data) {
    var remoteId = data[this.remoteIdField];
    if (!remoteId) {
      var record = this.retrieve(type, data);
      if (record) {
        remoteId = record[this.remoteIdField];
      }
    }
    return remoteId;
  },

  _addToCache: function(type, record, id) {
    if (id === undefined) {
      id = Orbit.generateId();
    }
    record[this.idField] = id;

    Orbit.incrementVersion(record);

    var dataForType = this._localCache[type];
    if (dataForType) {
      var recordInCache = dataForType[id];
      if (recordInCache && recordInCache.deleted) {
        recordInCache[this.remoteIdField] = record[this.remoteIdField];
      }
    } else {
      dataForType = this._localCache[type] = {};
    }
    dataForType[id] = record;

    // Update remote id map
    var remoteId = record[this.remoteIdField];
    if (remoteId) {
      var mapForType = this._remoteIdMap[type];
      if (!mapForType) mapForType = this._remoteIdMap[type] = {};
      mapForType[remoteId] = record[this.idField];
    }

    return record;
  },

  _ajax: function(url, method, hash) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      hash = hash || {};
      hash.url = url;
      hash.type = method;
      hash.dataType = 'json';
      hash.context = _this;

      console.log('ajax start', method);

      if (hash.data && method !== 'GET') {
        hash.contentType = 'application/json; charset=utf-8';
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.headers !== undefined) {
        var headers = _this.headers;
        hash.beforeSend = function (xhr) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        };
      }

      hash.success = function(json) {
        console.log('ajax success', method, json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
        console.log('ajax error', method, jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  _buildURL: function(type, remoteId) {
    var host = this.host,
        namespace = this.namespace,
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this._pathForType(type));
    if (remoteId) { url.push(remoteId); }

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  _pathForType: function(type) {
    return this._pluralize(type);
  },

  _pluralize: function(name) {
    // TODO - allow for pluggable inflector
    return name + 's';
  },

  _serialize: function(type, data) {
    var serialized = clone(data);
    delete serialized[this.idField];
    delete serialized[Orbit.versionField];
    return serialized;
  },

  _deserialize: function(type, data) {
    return data;
  }
};

export default RestStore;