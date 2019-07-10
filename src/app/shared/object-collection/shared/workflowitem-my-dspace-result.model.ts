import { Workflowitem } from '../../../core/submission/models/workflowitem.model';
import { SearchResult } from '../../search/search-result.model';
import { MyDSpaceConfigurationValueType } from '../../../+my-dspace-page/my-dspace-configuration-value-type';
import { searchResultFor } from '../../search/search-result-element-decorator';

/**
 * Represents a search result object of a Workflowitem object
 */
@searchResultFor(Workflowitem, MyDSpaceConfigurationValueType.Workspace)
export class WorkflowitemMyDSpaceResult extends SearchResult<Workflowitem> {
}
