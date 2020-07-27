import { Record, RecordIdentity, RecordInitializer } from './record';
import {
  AddRecordTerm,
  UpdateRecordTerm,
  RemoveRecordTerm,
  ReplaceKeyTerm,
  ReplaceAttributeTerm,
  AddToRelatedRecordsTerm,
  ReplaceRelatedRecordTerm,
  ReplaceRelatedRecordsTerm,
  RemoveFromRelatedRecordsTerm
} from './operation-term';

export interface TransformBuilderSettings {
  recordInitializer?: RecordInitializer;
}

export class TransformBuilder {
  private _recordInitializer: RecordInitializer;

  constructor(settings: TransformBuilderSettings = {}) {
    this._recordInitializer = settings.recordInitializer;
  }

  get recordInitializer(): RecordInitializer {
    return this._recordInitializer;
  }

  /**
   * Instantiate a new `addRecord` operation.
   */
  addRecord(record: Record): AddRecordTerm {
    if (this._recordInitializer) {
      this._recordInitializer.initializeRecord(record);
    }

    return new AddRecordTerm(record);
  }

  /**
   * Instantiate a new `updateRecord` operation.
   */
  updateRecord(record: Record): UpdateRecordTerm {
    return new UpdateRecordTerm(record);
  }

  /**
   * Instantiate a new `removeRecord` operation.
   */
  removeRecord(record: RecordIdentity): RemoveRecordTerm {
    return new RemoveRecordTerm(record);
  }

  /**
   * Instantiate a new `replaceKey` operation.
   */
  replaceKey(
    record: RecordIdentity,
    key: string,
    value: string
  ): ReplaceKeyTerm {
    return new ReplaceKeyTerm(record, key, value);
  }

  /**
   * Instantiate a new `replaceAttribute` operation.
   */
  replaceAttribute(
    record: RecordIdentity,
    attribute: string,
    value: unknown
  ): ReplaceAttributeTerm {
    return new ReplaceAttributeTerm(record, attribute, value);
  }

  /**
   * Instantiate a new `addToRelatedRecords` operation.
   */
  addToRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): AddToRelatedRecordsTerm {
    return new AddToRelatedRecordsTerm(record, relationship, relatedRecord);
  }

  /**
   * Instantiate a new `removeFromRelatedRecords` operation.
   */
  removeFromRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity
  ): RemoveFromRelatedRecordsTerm {
    return new RemoveFromRelatedRecordsTerm(
      record,
      relationship,
      relatedRecord
    );
  }

  /**
   * Instantiate a new `replaceRelatedRecords` operation.
   */
  replaceRelatedRecords(
    record: RecordIdentity,
    relationship: string,
    relatedRecords: RecordIdentity[]
  ): ReplaceRelatedRecordsTerm {
    return new ReplaceRelatedRecordsTerm(record, relationship, relatedRecords);
  }

  /**
   * Instantiate a new `replaceRelatedRecord` operation.
   */
  replaceRelatedRecord(
    record: RecordIdentity,
    relationship: string,
    relatedRecord: RecordIdentity | null
  ): ReplaceRelatedRecordTerm {
    return new ReplaceRelatedRecordTerm(record, relationship, relatedRecord);
  }
}
