import { POOL_TASK } from './pool-task-object.resource-type';
import { TaskObject } from './task-object.model';

/**
 * A model class for a PoolTask.
 */
export class PoolTask extends TaskObject {
  static type = POOL_TASK;
}
