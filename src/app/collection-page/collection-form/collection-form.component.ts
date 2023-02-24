import { Component, Input, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {
  DynamicFormOptionConfig,
  DynamicFormService,
  DynamicSelectModel
} from '@ng-dynamic-forms/core';

import { Collection } from '../../core/shared/collection.model';
import { ComColFormComponent } from '../../shared/comcol/comcol-forms/comcol-form/comcol-form.component';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { CommunityDataService } from '../../core/data/community-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { RequestService } from '../../core/data/request.service';
import { ObjectCacheService } from '../../core/cache/object-cache.service';
import { EntityTypeDataService } from '../../core/data/entity-type-data.service';
import { ItemType } from '../../core/shared/item-relationships/item-type.model';
import { MetadataValue } from '../../core/shared/metadata.models';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteListPayload } from '../../core/shared/operators';
import { collectionFormEntityTypeSelectionConfig, collectionFormModels, createCollectionFormModels, } from './collection-form.models';
import { NONE_ENTITY_TYPE } from '../../core/shared/item-relationships/item-type.resource-type';
import { LangConfig } from 'src/config/lang-config.interface';
import { FormModels } from 'src/app/shared/comcol/comcol-forms/comcol-form/FormModels';
import { environment } from 'src/environments/environment';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';

/**
 * Form used for creating and editing collections
 */
@Component({
  selector: 'ds-collection-form',
  styleUrls: ['../../shared/comcol/comcol-forms/comcol-form/comcol-form.component.scss'],
  templateUrl: '../../shared/comcol/comcol-forms/comcol-form/comcol-form.component.html'
})
export class CollectionFormComponent extends ComColFormComponent<Collection> implements OnInit {
  /**
   * @type {Collection} A new collection when a collection is being created, an existing Input collection when a collection is being edited
   */
  @Input() dso: Collection = new Collection();

  /**
   * @type {Collection.type} This is a collection-type form
   */
  type = Collection.type;

  /**
   * The dynamic form field used for entity type selection
   * @type {DynamicSelectModel<string>}
   */
  entityTypeSelection: DynamicSelectModel<string> = new DynamicSelectModel(collectionFormEntityTypeSelectionConfig);

  public constructor(protected formService: DynamicFormService,
                     protected translate: TranslateService,
                     protected notificationsService: NotificationsService,
                     protected authService: AuthService,
                     protected dsoService: CommunityDataService,
                     protected requestService: RequestService,
                     protected objectCache: ObjectCacheService,
                     protected configService: ConfigurationDataService,
                     protected entityTypeService: EntityTypeDataService) {
    super(formService, translate, notificationsService, authService, requestService, configService, objectCache);
  }

  ngOnInit() {
    this.languages = environment.languages.filter((MyLangConfig) => MyLangConfig.active === true);
    const defaultLanguage$ = this.configService.findByPropertyName('default.locale').pipe(
      getFirstCompletedRemoteData()
    );
    defaultLanguage$.subscribe(data => {
      this.defaultLanguage = data.payload.values[0];
      this.currentLanguage = this.defaultLanguage;
    });
    
    let currentRelationshipValue: MetadataValue[];
    if (this.dso && this.dso.metadata) {
      currentRelationshipValue = this.dso.metadata['dspace.entity.type'];
    }

    const entities$: Observable<ItemType[]> = this.entityTypeService.findAll({ elementsPerPage: 100, currentPage: 1 }).pipe(
      getFirstSucceededRemoteListPayload()
    );

    // retrieve all entity types to populate the dropdowns selection
    entities$.subscribe((entityTypes: ItemType[]) => {

        entityTypes
          .filter((type: ItemType) => type.label !== NONE_ENTITY_TYPE)
          .forEach((type: ItemType, index: number) => {
          this.entityTypeSelection.add({
            disabled: false,
            label: type.label,
            value: type.label
          } as DynamicFormOptionConfig<string>);
          if (currentRelationshipValue && currentRelationshipValue.length > 0 && currentRelationshipValue[0].value === type.label) {
            this.entityTypeSelection.select(index);
            this.entityTypeSelection.disabled = true;
          }
        });

        if(this.languages) {
          this.languages.forEach(
            (language: LangConfig) => {
              let fm: FormModels = {
                forms: [...createCollectionFormModels(language.code), this.entityTypeSelection],
                language: language.code
              }
              this.formModels.push(fm);
            }
          )
        }

        super.ngOnInit();
    });
  }
}
