import { Source } from '../src/source';
import { buildTransform, Transform } from '../src/transform';
import { FakeBucket } from './support/fake-bucket';
import {
  RecordQueryBuilder,
  RecordTransformBuilder
} from './support/record-data';

const { module, test } = QUnit;

module('Source', function (hooks) {
  let source: any;

  class MySource extends Source<RecordQueryBuilder, RecordTransformBuilder> {}

  test('it can be instantiated', function (assert) {
    source = new MySource();
    assert.ok(source);
    assert.ok(source.transformLog, 'has a transform log');
  });

  test('creates a `transformLog`, `requestQueue`, and `syncQueue`, and assigns each the same bucket as the Source', function (assert) {
    assert.expect(8);
    const bucket = new FakeBucket();
    source = new MySource({ name: 'src1', bucket });
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

  test('overrides default requestQueue settings with injected requestQueueSettings', async function (assert) {
    assert.expect(3);

    const defaultBucket = new FakeBucket();
    const requestQueueBucket = new FakeBucket();

    const requestQueueSettings = {
      name: 'my-request-queue',
      autoProcess: false,
      bucket: requestQueueBucket
    };

    source = new MySource({
      name: 'src1',
      bucket: defaultBucket,
      requestQueueSettings
    });

    await source.activated;

    assert.equal(
      source.requestQueue.name,
      'my-request-queue',
      'requestQueue has been assigned overridden name'
    );
    assert.equal(
      source.requestQueue.autoProcess,
      false,
      'requestQueue has been assigned overridden autoProcess'
    );
    assert.equal(
      source.requestQueue.bucket,
      requestQueueBucket,
      'requestQueue has been assigned overridden bucket'
    );
  });

  test('overrides default syncQueue settings with injected syncQueueSettings', async function (assert) {
    assert.expect(3);

    const defaultBucket = new FakeBucket();
    const syncQueueBucket = new FakeBucket();

    const syncQueueSettings = {
      name: 'my-sync-queue',
      autoProcess: false,
      bucket: syncQueueBucket
    };

    source = new MySource({
      name: 'src1',
      bucket: defaultBucket,
      syncQueueSettings
    });

    await source.activated;

    assert.equal(
      source.syncQueue.name,
      'my-sync-queue',
      'syncQueue has been assigned overridden name'
    );
    assert.equal(
      source.syncQueue.autoProcess,
      false,
      'syncQueue has been assigned overridden autoProcess'
    );
    assert.equal(
      source.syncQueue.bucket,
      syncQueueBucket,
      'syncQueue has been assigned overridden bucket'
    );
  });

  test('disables queue activation by default until source activation', async function (assert) {
    assert.expect(4);

    const bucket = new FakeBucket();
    const op1 = { op: 'add', path: ['planets', '1'], value: 'Mercury' };
    const op2 = { op: 'add', path: ['planets', '2'], value: 'Venus' };
    await bucket.setItem('src1-sync', [
      {
        type: 'transform',
        data: op1
      }
    ]);
    await bucket.setItem('src1-requests', [
      {
        type: 'transform',
        data: op2
      }
    ]);

    source = new MySource({
      name: 'src1',
      bucket,
      autoActivate: false
    });

    let i = 0;
    source.perform = async function (task: any) {
      i++;
      if (i === 1) {
        assert.strictEqual(task.data, op1, 'op1 - first task in sync queue');
      } else if (i === 2) {
        assert.strictEqual(task.data, op2, 'op2 - first task in request queue');
      }
    };

    await source.syncQueue.reified;
    await source.requestQueue.reified;

    assert.equal(source.syncQueue.length, 1, 'syncQueue has one task');
    assert.equal(source.requestQueue.length, 1, 'requestQueue has one task');

    await source.activate();
  });

  test('it can be instantiated with a `queryBuilder` and/or `transformBuilder`', function (assert) {
    const queryBuilder = new RecordQueryBuilder();
    const transformBuilder = new RecordTransformBuilder();
    source = new MySource({ queryBuilder, transformBuilder });
    assert.strictEqual(
      queryBuilder,
      source.queryBuilder,
      'queryBuilder remains the same'
    );
    assert.strictEqual(
      transformBuilder,
      source.transformBuilder,
      'transformBuilder remains the same'
    );
  });

  test('#transformed should trigger `transform` event BEFORE resolving', async function (assert) {
    assert.expect(3);

    source = new MySource();
    let order = 0;
    const appliedTransform = buildTransform({ op: 'addRecord' });

    source.on('transform', (transform: Transform) => {
      assert.equal(
        ++order,
        1,
        '`transform` event triggered after action performed successfully'
      );
      assert.strictEqual(
        transform,
        appliedTransform,
        'applied transform matches'
      );
    });

    await source.transformed([appliedTransform]);

    assert.equal(++order, 2, 'transformed promise resolved last');
  });

  test('#transformLog contains transforms applied', async function (assert) {
    assert.expect(2);

    source = new MySource();
    const appliedTransform = buildTransform({ op: 'addRecord' });

    assert.ok(!source.transformLog.contains(appliedTransform.id));

    await source.transformed([appliedTransform]);

    assert.ok(source.transformLog.contains(appliedTransform.id));
  });

  test('autoActivate', async function (assert) {
    assert.expect(2);

    source = new MySource({ autoActivate: false });

    assert.throws(() => {
      source.activated;
    });

    source.activate();

    await source.activated;
    assert.ok(true);
  });
});
