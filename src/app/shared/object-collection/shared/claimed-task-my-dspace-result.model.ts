import { ClaimedTask } from '../../../core/tasks/models/claimed-task-object.model';
import { SearchResult } from '../../search/search-result.model';
import { MyDSpaceConfigurationValueType } from '../../../+my-dspace-page/my-dspace-configuration-value-type';
import { searchResultFor } from '../../search/search-result-element-decorator';

/**
 * Represents a search result object of a ClaimedTask object
 */
@searchResultFor(ClaimedTask, MyDSpaceConfigurationValueType.Workflow)
export class ClaimedTaskMyDSpaceResult extends SearchResult<ClaimedTask> {
}
