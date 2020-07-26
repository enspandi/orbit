import Orbit, { Record, Schema, KeyMap } from '@orbit/data';
import { Dict } from '@orbit/utils';
import { Resource } from '../resources';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';
import { SerializerForFn } from '@orbit/serializers';

const { assert } = Orbit;

export interface JSONAPIResourceIdentityDeserializationOptions {
  primaryRecord?: Record;
  includeKeys?: boolean;
}

export interface JSONAPIResourceIdentitySerializerSettings {
  serializerFor?: SerializerForFn;
  deserializationOptions?: JSONAPIResourceIdentityDeserializationOptions;
  schema: Schema;
  keyMap?: KeyMap;
  getResourceKey?: (recordType: string) => string;
}

export class JSONAPIResourceIdentitySerializer extends JSONAPIBaseSerializer<
  Record,
  Resource,
  unknown,
  JSONAPIResourceIdentityDeserializationOptions
> {
  protected _resourceKeys: Dict<string>;
  protected _getCustomResourceKey?: (recordType: string) => string;

  getResourceKey(type: string): string {
    let key = this._resourceKeys[type];
    if (key === undefined) {
      if (this._getCustomResourceKey) {
        key = this._getCustomResourceKey(type);
      }

      if (key === undefined) {
        const model = this.schema.getModel(type);
        if (model?.keys) {
          let availableKeys = Object.keys(model.keys);
          if (availableKeys.length === 1) {
            key = availableKeys[0];
          }
        }
        if (key === undefined) {
          key = 'id';
        }
      }

      assert(
        "JSONAPIResourceIdentitySerializer requires a keyMap to support resource keys other than 'id'",
        key === 'id' || this.keyMap !== undefined
      );

      this._resourceKeys[type] = key;
    }
    return key;
  }

  constructor(settings: JSONAPIResourceIdentitySerializerSettings) {
    const {
      serializerFor,
      deserializationOptions,
      schema,
      keyMap,
      getResourceKey
    } = settings;
    super({
      serializerFor,
      deserializationOptions,
      schema,
      keyMap
    });
    this._resourceKeys = {};
    this._getCustomResourceKey = getResourceKey;
  }

  serialize(recordIdentity: Record): Resource {
    const { type, id } = recordIdentity;
    const resourceKey = this.getResourceKey(type);
    const resourceType = this.typeSerializer.serialize(type);
    const resourceId =
      resourceKey === 'id' ? id : this.keyMap.idToKey(type, resourceKey, id);

    const resource: Resource = {
      type: resourceType
    };

    if (resourceId !== undefined) {
      resource.id = resourceId;
    }

    return resource;
  }

  deserialize(
    resource: Resource,
    customOptions?: JSONAPIResourceIdentityDeserializationOptions
  ): Record {
    const options = this.buildDeserializationOptions(customOptions);
    const type = this.typeSerializer.deserialize(resource.type);
    const resourceKey = this.getResourceKey(type);

    if (resourceKey === 'id') {
      return { type: type, id: resource.id };
    } else {
      const primaryRecord = options?.primaryRecord;
      let id: string;
      let keys: Dict<string>;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          options.primaryRecord?.id ||
          this.keyMap?.idFromKeys(type, keys) ||
          this.schema.generateId(type);
      } else {
        id =
          (primaryRecord && primaryRecord.id) || this.schema.generateId(type);
      }

      const record: Record = { type, id };

      if (keys && this.keyMap) {
        if (options.includeKeys) {
          record.keys = keys;
          this.keyMap.pushRecord(record);
        } else {
          this.keyMap.pushRecord({
            type,
            id,
            keys
          });
        }
      }

      return record;
    }
  }
}