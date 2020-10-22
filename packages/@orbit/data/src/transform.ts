/* eslint-disable valid-jsdoc */
import { Orbit } from '@orbit/core';
import { Operation } from './operation';
import { OperationTerm } from './operation-term';
import { RequestOptions } from './request';

export type TransformBuilderFunc<O extends Operation, TB> = (
  TransformBuilder: TB
) => O | O[] | OperationTerm<O> | OperationTerm<O>[];

export type TransformOrOperations<O extends Operation, TB> =
  | Transform<O>
  | O
  | O[]
  | OperationTerm<O>
  | OperationTerm<O>[]
  | TransformBuilderFunc<O, TB>;

/**
 * A Transform represents a set of operations that can mutate a source.
 */
export interface Transform<O extends Operation = Operation> {
  id: string;
  operations: O[];
  options?: RequestOptions;
}

/**
 * A builder function for creating a Transform from its constituent parts.
 *
 * If a `Transform` is passed in with an `id` and `operations`, and no
 * replacement `id` or `options` are also passed in, then the `Transform`
 * will be returned unchanged.
 *
 * For all other cases, a new `Transform` object will be created and returned.
 *
 * Transforms will be assigned the specified `transformId` as `id`. If none
 * is specified, a UUID will be generated.
 */
export function buildTransform<O extends Operation, TB = unknown>(
  transformOrOperations: TransformOrOperations<O, TB>,
  transformOptions?: RequestOptions,
  transformId?: string,
  transformBuilder?: TB
): Transform<O> {
  if (typeof transformOrOperations === 'function') {
    const transformBuilderFn = transformOrOperations as TransformBuilderFunc<
      O,
      TB
    >;
    return buildTransform<O, TB>(
      transformBuilderFn(transformBuilder as TB),
      transformOptions,
      transformId
    );
  } else {
    let transform = transformOrOperations as Transform<O>;
    let operations: O[];
    let options: RequestOptions | undefined;

    if (isTransform(transform)) {
      if (transform.id && !transformOptions && !transformId) {
        return transform;
      }
      operations = transform.operations;
      options = transformOptions || transform.options;
    } else if (Array.isArray(transformOrOperations)) {
      operations = [];
      for (let transformOrOperation of transformOrOperations) {
        operations.push(toOperation<O>(transformOrOperation));
      }
      options = transformOptions;
    } else {
      operations = [toOperation<O>(transformOrOperations as O)];
      options = transformOptions;
    }

    let id: string = transformId || Orbit.uuid();

    return { operations, options, id };
  }
}

function toOperation<O extends Operation = Operation>(
  operation: O | OperationTerm<O>
): O {
  if (isOperationTerm(operation)) {
    return (operation as OperationTerm<O>).toOperation();
  } else {
    return operation;
  }
}

function isOperationTerm<O extends Operation = Operation>(
  operation: O | OperationTerm<O>
): operation is OperationTerm<O> {
  return typeof (operation as OperationTerm<O>).toOperation === 'function';
}

function isTransform<O extends Operation = Operation>(
  transform: TransformOrOperations<O, unknown>
): transform is Transform<O> {
  return Array.isArray((transform as Transform<O>).operations);
}
