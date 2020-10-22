import { RecordSource } from '../src/record-source';
import { RecordSchema } from '../src/record-schema';
import { buildTransform, Transform } from '@orbit/data';
import { RecordTransformBuilder } from '../src/record-transform-builder';
import { RecordQueryBuilder } from '../src/record-query-builder';
import { FakeBucket } from './support/fake-bucket';

const { module, test } = QUnit;

module('Source', function (hooks) {
  let source: any;
  let schema: RecordSchema;

  class MySource extends RecordSource {}

  hooks.beforeEach(function () {
    schema = new RecordSchema();
  });

  test('it can be instantiated', function (assert) {
    source = new MySource();
    assert.ok(source);
    assert.ok(source.transformLog, 'has a transform log');
  });

  test('it can be assigned a schema, which will be observed for upgrades by default', async function (assert) {
    assert.expect(2);

    class MyDynamicSource extends RecordSource {
      async upgrade() {
        assert.ok(true, 'upgrade called');
      }
    }

    source = new MyDynamicSource({ schema });

    schema.upgrade({});

    assert.ok(true, 'after upgrade');
  });

  test('it will not be auto-upgraded if autoUpgrade: false option is specified', function (assert) {
    assert.expect(1);

    class MyDynamicSource extends RecordSource {
      async upgrade(): Promise<void> {
        assert.ok(false, 'upgrade should not be called');
      }
    }

    source = new MyDynamicSource({ schema, autoUpgrade: false });
    schema.upgrade({});
    assert.ok(true, 'after upgrade');
  });

  test('creates a `transformLog`, `requestQueue`, and `syncQueue`, and assigns each the same bucket as the Source', function (assert) {
    assert.expect(8);
    const bucket = new FakeBucket();
    source = new MySource({ name: 'src1', schema, bucket });
    assert.equal(source.name, 'src1', 'source has been assigned name');
    assert.equal(
      source.transformLog.name,
      'src1-log',
      'transformLog has been assigned name'
    );
    assert.equal(
      source.requestQueue.name,
      'src1-requests',
      'requestQueue has been assigned name'
    );
    assert.equal(
      source.syncQueue.name,
      'src1-sync',
      'syncQueue has been assigned name'
    );
    assert.strictEqual(
      source.bucket,
      bucket,
      'source has been assigned bucket'
    );
    assert.strictEqual(
      source.transformLog.bucket,
      bucket,
      'transformLog has been assigned bucket'
    );
    assert.strictEqual(
      source.requestQueue.bucket,
      bucket,
      'requestQueue has been assigned bucket'
    );
    assert.strictEqual(
      source.syncQueue.bucket,
      bucket,
      'syncQueue has been assigned bucket'
    );
  });
});
