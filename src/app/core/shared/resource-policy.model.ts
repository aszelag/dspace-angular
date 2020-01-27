import { ActionType } from '../cache/models/action-type.model';
import { CacheableObject } from '../cache/object-cache.reducer';
import { HALLink } from './hal-link.model';
import { RESOURCE_POLICY } from './resource-policy.resource-type';

/**
 * Model class for a Resource Policy
 */
export class ResourcePolicy implements CacheableObject {
  static type = RESOURCE_POLICY;

  /**
   * The action that is allowed by this Resource Policy
   */
  action: ActionType;

  /**
   * The name for this Resource Policy
   */
  name: string;

  /**
   * The uuid of the Group this Resource Policy applies to
   */
  groupUUID: string;

  /**
   * The link to the rest endpoint where this Resource Policy can be found
   */
  self: string;

  /**
   * The universally unique identifier for this Resource Policy
   */
  uuid: string;

  _links: {
    self: HALLink,
  }
}
