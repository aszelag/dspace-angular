import { Component, Input, OnInit } from '@angular/core';
import {
  DynamicFormControlModel,
  DynamicFormService,
  DynamicInputModel,
  DynamicTextAreaModel
} from '@ng-dynamic-forms/core';
import { Community } from '../../core/shared/community.model';
import { ComColFormComponent } from '../../shared/comcol/comcol-forms/comcol-form/comcol-form.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { CommunityDataService } from '../../core/data/community-data.service';
import { AuthService } from '../../core/auth/auth.service';
import { RequestService } from '../../core/data/request.service';
import { ObjectCacheService } from '../../core/cache/object-cache.service';
import { environment } from '../../../environments/environment';
import { FormModels } from 'src/app/shared/comcol/comcol-forms/comcol-form/FormModels';
import { LangConfig } from 'src/config/lang-config.interface';

/**
 * Form used for creating and editing communities
 */
@Component({
  selector: 'ds-community-form',
  styleUrls: ['../../shared/comcol/comcol-forms/comcol-form/comcol-form.component.scss'],
  templateUrl: '../../shared/comcol/comcol-forms/comcol-form/comcol-form.component.html'
})
export class CommunityFormComponent extends ComColFormComponent<Community> implements OnInit{
  /**
   * @type {Community} A new community when a community is being created, an existing Input community when a community is being edited
   */
  @Input() dso: Community = new Community();

  /**
   * @type {Community.type} This is a community-type form
   */
  type = Community.type;

  /**
   * The form models that represents the fields in the form
   */
  formModels: FormModels[] = [];

  // All of the languages
  languages: LangConfig[];

  ngOnInit(): void {
    this.languages = environment.languages.filter((MyLangConfig) => MyLangConfig.active === true);
    if(this.languages) {
      this.languages.forEach(
        (language: LangConfig) => {
          let fm: FormModels = {
            forms: [...this.createCommunityFormModels(language.code)],
            language: language.code
          }
          this.formModels.push(fm);
        }
      )
    }
    this.updateFieldTranslations();
  }

  createCommunityFormModels(lang: string): DynamicFormControlModel[] {
    return [
      new DynamicInputModel({
        id: 'title-' + lang,
        name: 'dc.title',
        required: true,
        validators: {
          required: null
        },
        errorMessages: {
          required: 'Please enter a name for this title'
        },
      }),
      new DynamicTextAreaModel({
        id: 'description-' + lang,
        name: 'dc.description',
        spellCheck: environment.form.spellCheck,
      }),
      new DynamicTextAreaModel({
        id: 'abstract-' + lang,
        name: 'dc.description.abstract',
        spellCheck: environment.form.spellCheck,
      }),
      new DynamicTextAreaModel({
        id: 'rights-' + lang,
        name: 'dc.rights',
        spellCheck: environment.form.spellCheck,
      }),
      new DynamicTextAreaModel({
        id: 'tableofcontents-' + lang,
        name: 'dc.description.tableofcontents',
        spellCheck: environment.form.spellCheck,
      }),
    ];
  }

  public constructor(protected formService: DynamicFormService,
                     protected translate: TranslateService,
                     protected notificationsService: NotificationsService,
                     protected authService: AuthService,
                     protected dsoService: CommunityDataService,
                     protected requestService: RequestService,
                     protected objectCache: ObjectCacheService) {
    super(formService, translate, notificationsService, authService, requestService, objectCache);
  }
}
