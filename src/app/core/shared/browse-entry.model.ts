import { ListableObject } from '../../shared/object-collection/shared/listable-object.model';
import { TypedObject } from '../cache/object-cache.reducer';
import { excludeFromEquals } from '../utilities/equals.decorators';
import { BROWSE_ENTRY } from './browse-entry.resource-type';
import { GenericConstructor } from './generic-constructor';
import { HALLink } from './hal-link.model';

/**
 * Class object representing a browse entry
 * This class is not normalized because browse entries do not have self links
 */
export class BrowseEntry extends ListableObject implements TypedObject {
  static type = BROWSE_ENTRY;

  /**
   * The authority string of this browse entry
   */
  authority: string;

  /**
   * The value of this browse entry
   */
  value: string;

  /**
   * The language of the value of this browse entry
   */
  language: string;

  /**
   * The count of this browse entry
   */
  @excludeFromEquals
  count: number;

  _links: {
    self: HALLink;
    entries: HALLink;
  };

  /**
   * Method that returns as which type of object this object should be rendered
   */
  getRenderTypes(): Array<string | GenericConstructor<ListableObject>> {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}
