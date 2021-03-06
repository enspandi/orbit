import { KeyMap, Record, RecordNotFoundException, Schema } from '@orbit/data';
import { ExampleAsyncRecordCache } from './support/example-async-record-cache';
import { arrayMembershipMatches } from './support/matchers';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('AsyncRecordCache - query', function (hooks) {
  let schema: Schema, keyMap: KeyMap;

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new KeyMap();
  });

  test('#query can retrieve an individual record', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    await cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      await cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test('#query can retrieve multiple expressions', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    await cache.patch((t) => [t.addRecord(jupiter), t.addRecord(earth)]);

    assert.deepEqual(
      await cache.query((q) => [
        q.findRecord({ type: 'planet', id: 'jupiter' }),
        q.findRecord({ type: 'planet', id: 'earth' })
      ]),
      [jupiter, earth]
    );
  });

  test('#query can find records by type', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) => q.findRecords('planet'))) as Record[],
      [jupiter, earth, venus, mercury]
    );
  });

  test('#query can find records by identities', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords([
          { type: 'planet', id: 'jupiter' },
          { type: 'planet', id: 'venus' },
          { type: 'planet', id: 'FAKE' }
        ])
      )) as Record[],
      [jupiter, venus]
    );
  });

  test('#query can perform a simple attribute filter by value equality', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
      )) as Record[],
      [jupiter]
    );
  });

  test('#query can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'gt' })
      )) as Record[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'gte' })
      )) as Record[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'lt' })
      )) as Record[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ attribute: 'sequence', value: 2, op: 'lte' })
      )) as Record[],
      [venus, mercury]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'sequence', value: 2, op: 'gte' },
            { attribute: 'sequence', value: 4, op: 'lt' }
          )
      )) as Record[],
      [venus, earth]
    );
  });

  test('#query can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      )) as Record[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      )) as Record[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('planet').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      )) as Record[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      )) as Record[],
      [earth, mars]
    );
  });

  test('#query can perform relatedRecord filters', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: { planet: { data: null } }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: null })
      )) as Record[],
      [titan]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: earth })
      )) as Record[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: jupiter })
      )) as Record[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: mercury })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('moon')
          .filter({ relation: 'planet', record: [earth, mars] })
      )) as Record[],
      [theMoon, phobos, deimos]
    );
  });

  test('#query can perform a complex attribute filter by value', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      )) as Record[],
      [earth, venus]
    );
  });

  test('#query can perform a filter on attributes, even when a particular record has none', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      )) as Record[],
      [earth, venus]
    );
  });

  test('#query can sort by an attribute', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query can sort by an attribute, even when a particular record has none', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query can filter and sort by attributes', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query can sort by an attribute in descending order', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) => q.findRecords('planet').sort('-name')),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query can sort by according to multiple criteria', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRecords('planet').sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRecord - finds record', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    await cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      await cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test("#query - findRecord - throws RecordNotFoundException if record doesn't exist", async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    try {
      await cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' }));
    } catch (e) {
      assert.ok(e instanceof RecordNotFoundException);
    }
  });

  test('#query - findRecords - finds matching records', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: [{ type: 'planet', id: 'jupiter' }] } }
    };

    await cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(await cache.query((q) => q.findRecords('planet')), [
      jupiter
    ]);
  });

  test('#query - page - can paginate records by offset and limit', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const earth = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' }
    };

    const venus = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' }
    };

    const mars = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' }
    };

    await cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      await cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      await cache.query((q) =>
        q.findRecords('planet').sort('name').page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      await cache.query((q) =>
        q.findRecords('planet').sort('name').page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#query - findRelatedRecords', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    await cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      [callisto]
    );
  });

  test('#query - findRelatedRecords - returns empty array if there are no related records', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    await cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      []
    );
  });

  test("#query - findRelatedRecords - throws RecordNotFoundException if primary record doesn't exist", async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    try {
      await cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      );
    } catch (e) {
      assert.ok(e instanceof RecordNotFoundException);
    }
  });

  test('#query - findRelatedRecord', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    await cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      jupiter
    );
  });

  test('#query - findRelatedRecord - return null if no related record is found', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' }
    };

    await cache.patch((t) => [t.addRecord(callisto)]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      null
    );
  });

  test("#query - findRelatedRecord - throws RecordNotFoundException if primary record doesn't exist", async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    try {
      await cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      );
    } catch (e) {
      assert.ok(e instanceof RecordNotFoundException);
    }
  });

  test('#query - findRelatedRecords can perform a simple attribute filter by value equality', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'name', value: 'Jupiter' })
      )) as Record[],
      [jupiter]
    );
  });

  test('#query - findRelatedRecords - can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gt' })
      )) as Record[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gte' })
      )) as Record[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lt' })
      )) as Record[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lte' })
      )) as Record[],
      [venus, mercury]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      )) as Record[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      )) as Record[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      )) as Record[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      )) as Record[],
      [earth, mars]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecord filters', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' },
            { type: 'moon', id: 'moon' },
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' },
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: {
        planet: { data: { type: 'planet', id: 'earth' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {
        planet: { data: null },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: null })
      )) as Record[],
      [titan]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(earth, 'moons')
          .filter({ relation: 'planet', record: earth })
      )) as Record[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(jupiter, 'moons')
          .filter({ relation: 'planet', record: jupiter })
      )) as Record[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(mercury, 'moons')
          .filter({ relation: 'planet', record: mercury })
      )) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: [earth, mars] })
      )) as Record[],
      [theMoon, phobos, deimos]
    );
  });

  test('#query - findRelatedRecords - can perform a complex attribute filter by value', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      )) as Record[],
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can perform a filter on attributes, even when a particular record has none', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      (await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      )) as Record[],
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute, even when a particular record has none', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query - findRelatedRecords - can filter and sort by attributes', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute in descending order', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('-name')
      ),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query - findRelatedRecords - can sort by according to multiple criteria', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - page - can paginate records by offset and limit', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mars' }
          ]
        }
      }
    };

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const earth = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const venus = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const mars = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    await cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      await cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      await cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#liveQuery', async function (assert) {
    let cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const jupiter2 = {
      ...jupiter,
      attributes: { name: 'Jupiter 2' }
    };

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    const jupiterWithCallisto = {
      ...jupiter2,
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const livePlanet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );
    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));
    const livePlanetMoons = cache.liveQuery((q) =>
      q.findRelatedRecords(jupiter, 'moons')
    );
    const liveMoonPlanet = cache.liveQuery((q) =>
      q.findRelatedRecord(callisto, 'planet')
    );

    interface Deferred {
      promise?: Promise<any>;
      resolve?: () => void;
      reject?: (message: string) => void;
    }
    function defer(): Deferred {
      let defer: Deferred = {};
      defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = (message) => reject(new Error(message));
      });
      return defer;
    }

    let jupiterAdded = defer();
    let jupiterUpdated = defer();
    let callistoAdded = defer();
    let jupiterRemoved = defer();

    function next() {
      if (n === 1 && i === 1 && j === 0 && k === 0) {
        jupiterAdded.resolve?.();
      }
      if (n === 2 && i === 2 && j === 0 && k === 0) {
        jupiterUpdated.resolve?.();
      }
      if (n === 3 && i === 3 && j === 1 && k === 1) {
        callistoAdded.resolve?.();
      }
      if (n === 4 && i === 4 && j === 2 && k === 2) {
        jupiterRemoved.resolve?.();
      }
    }

    let n = 0;
    let livePlanetUnsubscribe = livePlanet.subscribe((update) => {
      update
        .query()
        .then((result) => {
          n++;
          if (n === 1) {
            assert.deepEqual(result, jupiter, 'findRecord jupiter');
          } else if (n === 2) {
            assert.deepEqual(result, jupiter2, 'findRecord jupiter2');
          } else if (n === 3) {
            assert.deepEqual(
              result,
              jupiterWithCallisto,
              'findRecord jupiterWithCallisto'
            );
          } else {
            assert.ok(false, 'findRecord should not execute');
          }
          next();
        })
        .catch((error) => {
          n++;
          if (n === 4) {
            assert.ok(
              error instanceof RecordNotFoundException,
              'findRecord not found'
            );
          } else {
            assert.ok(false, 'findRecord should not throw error');
          }
          next();
        });
    });

    let i = 0;
    let livePlanetsUnsubscribe = livePlanets.subscribe((update) => {
      update
        .query()
        .then((result) => {
          i++;
          if (i === 1) {
            assert.deepEqual(result, [jupiter], 'findRecords [jupiter]');
          } else if (i === 2) {
            assert.deepEqual(result, [jupiter2], 'findRecords [jupiter2]');
          } else if (i === 3) {
            assert.deepEqual(
              result,
              [jupiterWithCallisto],
              'findRecords [jupiterWithCallisto]'
            );
          } else if (i === 4) {
            assert.deepEqual(result, [], 'findRecords []');
          } else {
            assert.ok(false, 'findRecords should not execute');
          }
          next();
        })
        .catch(() => {
          assert.ok(false, 'findRecords should not throw error');
        });
    });

    let j = 0;
    let livePlanetMoonsUnsubscribe = livePlanetMoons.subscribe((update) => {
      update
        .query()
        .then((result) => {
          j++;
          if (j === 1) {
            assert.deepEqual(
              result,
              [callisto],
              'findRelatedRecords jupiter.moons => [callisto]'
            );
          } else {
            assert.ok(false, 'findRelatedRecords should not execute');
          }
          next();
        })
        .catch((error) => {
          j++;
          if (j === 2) {
            assert.ok(
              error instanceof RecordNotFoundException,
              'findRelatedRecords not found'
            );
          } else {
            assert.ok(false, 'findRelatedRecords should not throw error');
          }
          next();
        });
    });

    let k = 0;
    let liveMoonPlanetUnsubscribe = liveMoonPlanet.subscribe((update) => {
      update
        .query()
        .then((result) => {
          k++;
          if (k === 1) {
            assert.deepEqual(
              result,
              jupiterWithCallisto,
              'findRelatedRecord callisto.planet => jupiter'
            );
          } else if (k === 2) {
            assert.deepEqual(
              result,
              null,
              'findRelatedRecord callisto.planet => null'
            );
          } else {
            assert.ok(false, 'findRelatedRecord should not execute');
          }
          next();
        })
        .catch(() => {
          assert.ok(false, 'findRelatedRecord should not throw error');
        });
    });

    setTimeout(() => {
      jupiterAdded.reject?.('reject jupiterAdded');
      jupiterUpdated.reject?.('reject jupiterUpdated');
      callistoAdded.reject?.('reject callistoAdded');
      jupiterRemoved.reject?.('reject jupiterRemoved');
    }, 500);

    await cache.patch((t) => t.addRecord(jupiter));
    await jupiterAdded.promise;

    await cache.patch((t) => t.updateRecord(jupiter2));
    await jupiterUpdated.promise;

    await cache.patch((t) => t.addRecord(callisto));
    await callistoAdded.promise;

    await cache.patch((t) => t.removeRecord(jupiter));
    await jupiterRemoved.promise;

    assert.expect(16);
    assert.equal(n, 4, 'findRecord should run 4 times');
    assert.equal(i, 4, 'findRecords should run 4 times');
    assert.equal(j, 2, 'findRelatedRecords should run 2 times');
    assert.equal(k, 2, 'findRelatedRecord should run 2 times');

    livePlanetUnsubscribe();
    livePlanetsUnsubscribe();
    livePlanetMoonsUnsubscribe();
    liveMoonPlanetUnsubscribe();

    await cache.patch((t) =>
      t.addRecord({
        type: 'planet',
        id: 'mercury',
        attributes: {
          name: 'Mercury'
        }
      })
    );
  });

  test('#liveQuery findRecords (debounce)', async function (assert) {
    let cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const planets: Record[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe(async (update) => {
      const result = await update.query();
      assert.deepEqual(result, planets);
      assert.equal(i, 3);
      done();
    });

    cache.patch((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(2);
  });

  test('#liveQuery findRecords (no debounce)', async function (assert) {
    let cache = new ExampleAsyncRecordCache({
      schema,
      keyMap,
      debounceLiveQueries: false
    });

    const planets: Record[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe(async (update) => {
      const result = (await update.query()) as Record[];
      assert.equal(result.length, i);

      if (i === 3) {
        done();
      }
    });

    cache.patch((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(3);
  });

  test('#liveQuery can apply attribute filters', async function (assert) {
    const cache = new ExampleAsyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    const livePlanets = cache.liveQuery((q) =>
      q
        .findRecords('planet')
        .filter(
          { attribute: 'sequence', value: 2, op: 'gte' },
          { attribute: 'sequence', value: 4, op: 'lt' }
        )
    );

    const done = assert.async();
    livePlanets.subscribe(async (update) => {
      const result = (await update.query()) as Record[];
      arrayMembershipMatches(assert, result, [venus, earth]);
      done();
    });

    // liveQuery results are initially empty
    arrayMembershipMatches(assert, (await livePlanets.query()) as Record[], []);

    // adding records should update liveQuery results
    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
  });
});
