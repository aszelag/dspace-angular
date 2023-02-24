import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicFormService, DynamicInputModel } from '@ng-dynamic-forms/core';
import { TranslateService } from '@ngx-translate/core';
import { FileUploader } from 'ng2-file-upload';
import { BehaviorSubject, combineLatest as observableCombineLatest, Subscription } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ObjectCacheService } from '../../../../core/cache/object-cache.service';
import { ComColDataService } from '../../../../core/data/comcol-data.service';
import { RemoteData } from '../../../../core/data/remote-data';
import { RequestService } from '../../../../core/data/request.service';
import { RestRequestMethod } from '../../../../core/data/rest-request-method';
import { Bitstream } from '../../../../core/shared/bitstream.model';
import { Collection } from '../../../../core/shared/collection.model';
import { Community } from '../../../../core/shared/community.model';
import { MetadataMap, MetadataValue } from '../../../../core/shared/metadata.models';
import { ResourceType } from '../../../../core/shared/resource-type';
import { hasValue, isNotEmpty } from '../../../empty.util';
import { NotificationsService } from '../../../notifications/notifications.service';
import { UploaderOptions } from '../../../upload/uploader/uploader-options.model';
import { UploaderComponent } from '../../../upload/uploader/uploader.component';
import { Operation } from 'fast-json-patch';
import { NoContent } from '../../../../core/shared/NoContent.model';
import { getFirstCompletedRemoteData } from '../../../../core/shared/operators';
import { LangConfig } from 'src/config/lang-config.interface';
import { FormModels } from './FormModels';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';


/**
 * A form for creating and editing Communities or Collections
 */
@Component({
  selector: 'ds-comcol-form',
  styleUrls: ['./comcol-form.component.scss'],
  templateUrl: './comcol-form.component.html'
})
export class ComColFormComponent<T extends Collection | Community> implements OnInit, OnDestroy {

  /**
   * The logo uploader component
   */
  @ViewChild(UploaderComponent) uploaderComponent: UploaderComponent;

  /**
   * DSpaceObject that the form represents
   */
  @Input() dso: T;

  /**
   * Type of DSpaceObject that the form represents
   */
  type: ResourceType;

  /**
   * @type {string} Key prefix used to generate form labels
   */
  LABEL_KEY_PREFIX = '.form.';

  /**
   * @type {string} Key prefix used to generate form error messages
   */
  ERROR_KEY_PREFIX = '.form.errors.';

  /**
   * The current page outlet string
   */
  defaultLanguage: string;

  /**
   * The current page outlet string
   */
  currentLanguage: string;

  // All of the languages
  languages: LangConfig[];

  /**
   * The form models that represents the fields in the form
   */
  formModels: FormModels[] = [];

  /**
   * The forms group of this form
   */
  formGroups: FormGroup[] = [];

  /**
   * The uploader configuration options
   * @type {UploaderOptions}
   */
  uploadFilesOptions: UploaderOptions = Object.assign(new UploaderOptions(), {
    autoUpload: false
  });

  /**
   * Emits DSO and Uploader when the form is submitted
   */
  @Output() submitForm: EventEmitter<{
    dso: T,
    uploader: FileUploader,
    deleteLogo: boolean,
    operations: Operation[],
  }> = new EventEmitter();

  /**
   * Event emitted on back
   */
  @Output() back: EventEmitter<any> = new EventEmitter();

  /**
   * Fires an event when the logo has finished uploading (with or without errors) or was removed
   */
  @Output() finish: EventEmitter<any> = new EventEmitter();

  /**
   * Observable keeping track whether or not the uploader has finished initializing
   * Used to start rendering the uploader component
   */
  initializedUploaderOptions = new BehaviorSubject(false);

  /**
   * Is the logo marked to be deleted?
   */
  markLogoForDeletion = false;

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   * @type {Array}
   */
  protected subs: Subscription[] = [];

  /**
   * The service used to fetch from or send data to
   */
  protected dsoService: ComColDataService<Community | Collection>;

  public constructor(protected formService: DynamicFormService,
                     protected translate: TranslateService,
                     protected notificationsService: NotificationsService,
                     protected authService: AuthService,
                     protected requestService: RequestService,
                     protected configService: ConfigurationDataService,
                     protected objectCache: ObjectCacheService) {
  }

  ngOnInit(): void {
    this.formModels.forEach(
      (fm: FormModels) => {
        fm.forms.forEach(
          (fieldModel: DynamicInputModel) => {
            fieldModel.value = this.dso.firstMetadataValue(fieldModel.name);
          }
        )
      }
    )

    this.formModels.forEach(
      (fm: FormModels) => {
        let fg = this.formService.createFormGroup(fm.forms);
        this.formGroups.push(fg);
      }
    )

    this.updateFieldTranslations();
    this.translate.onLangChange
      .subscribe(() => {
        this.updateFieldTranslations();
      });

    if (hasValue(this.dso.id)) {
      this.subs.push(
        observableCombineLatest([
          this.dsoService.getLogoEndpoint(this.dso.id),
          this.dso.logo
        ]).subscribe(([href, logoRD]: [string, RemoteData<Bitstream>]) => {
          this.uploadFilesOptions.url = href;
          this.uploadFilesOptions.authToken = this.authService.buildAuthHeader();
          // If the object already contains a logo, send out a PUT request instead of POST for setting a new logo
          if (hasValue(logoRD.payload)) {
            this.uploadFilesOptions.method = RestRequestMethod.PUT;
          }
          this.initializedUploaderOptions.next(true);
        })
      );
    } else {
      // Set a placeholder URL to not break the uploader component. This will be replaced once the object is created.
      this.uploadFilesOptions.url = 'placeholder';
      this.uploadFilesOptions.authToken = this.authService.buildAuthHeader();
      this.initializedUploaderOptions.next(true);
    }
  }

  /**
   * Checks which new fields were added and sends the updated version of the DSO to the parent component
   */
  onSubmit() {
    if (this.markLogoForDeletion && hasValue(this.dso.id) && hasValue(this.dso._links.logo)) {
      this.dsoService.deleteLogo(this.dso).pipe(
        getFirstCompletedRemoteData()
      ).subscribe((response: RemoteData<NoContent>) => {
        if (response.hasSucceeded) {
          this.notificationsService.success(
            this.translate.get(this.type.value + '.edit.logo.notifications.delete.success.title'),
            this.translate.get(this.type.value + '.edit.logo.notifications.delete.success.content')
          );
        } else {
          this.notificationsService.error(
            this.translate.get(this.type.value + '.edit.logo.notifications.delete.error.title'),
            response.errorMessage
          );
        }
        this.dso.logo = undefined;
        this.uploadFilesOptions.method = RestRequestMethod.POST;
        this.finish.emit();
      });
    }

    const formMetadata = {}  as MetadataMap;
    this.formModels.forEach(
      (fm: FormModels) => {
        let lang = fm.language;
        fm.forms.forEach(
          (fieldModel: DynamicInputModel) => {
            const value: MetadataValue = {
              value: fieldModel.value as string,
              language: lang
            } as any;
            if (formMetadata.hasOwnProperty(fieldModel.name)) {
              formMetadata[fieldModel.name].push(value);
            } else {
              formMetadata[fieldModel.name] = [value];
            }
          }
        )
      }
    )

    const updatedDSO = Object.assign({}, this.dso, {
      metadata: {
        ...this.dso.metadata,
        ...formMetadata
      },
      type: Community.type
    });

    const operations: Operation[] = [];
    this.formModels.forEach(
      (fm: FormModels) => {
        let lang = fm.language;
        fm.forms.forEach(
          (fieldModel: DynamicInputModel) => {
            if (fieldModel.value !== this.dso.firstMetadataValue(fieldModel.name)) {
              operations.push({
                op: 'replace',
                path: `/metadata/${fieldModel.name}`,
                value: {
                  value: fieldModel.value,
                  language: lang,
                },
              });
            }
          }
        )
      }
    )

    this.submitForm.emit({
      dso: updatedDSO,
      uploader: hasValue(this.uploaderComponent) ? this.uploaderComponent.uploader : undefined,
      deleteLogo: this.markLogoForDeletion,
      operations: operations,
    });
  }

  /**
   * Used the update translations of errors and labels on init and on language change
   */
  public updateFieldTranslations() {
    this.formModels.forEach(
      (fm: FormModels) => {
        let lang = fm.language;
        fm.forms.forEach(
          (fieldModel: DynamicInputModel) => {
            fieldModel.label = this.translate.instant(this.type.value + this.LABEL_KEY_PREFIX + fieldModel.id.split('-')[0]);
            if(this.defaultLanguage !== this.currentLanguage && lang === this.defaultLanguage){
              let deafult;
              this.translate.get('collection.edit.tabs.default.language.head').subscribe (data => deafult = data);
              fieldModel.label = deafult + " " + this.getLanguageLabel(this.defaultLanguage) + " " + fieldModel.label;
            }
            if (isNotEmpty(fieldModel.validators)) {
              fieldModel.errorMessages = {};
              Object.keys(fieldModel.validators).forEach((key) => {
                fieldModel.errorMessages[key] = this.translate.instant(this.type.value + this.ERROR_KEY_PREFIX + fieldModel.id.split('-')[0] + '.' + key);
              });
            }
          }
        )
      }
    )
  }

  /**
   * Get language label
   */
  private getLanguageLabel(language: string): string {
    const languageLabel: LangConfig = this.languages.find((lang: LangConfig) => lang.code === language);
    if(languageLabel) {
      return languageLabel.label;
    }
    return null;
  }

  /**
   * Mark the logo to be deleted
   * Send out a delete request to remove the logo from the community/collection and display notifications
   */
  deleteLogo() {
    this.markLogoForDeletion = true;
  }

  /**
   * Undo marking the logo to be deleted
   */
  undoDeleteLogo() {
    this.markLogoForDeletion = false;
  }

  /**
   * Refresh the object's cache to ensure the latest version
   */
  private refreshCache() {
    this.requestService.removeByHrefSubstring(this.dso._links.self.href);
    this.objectCache.remove(this.dso._links.self.href);
  }

  /**
   * The request was successful, display a success notification
   */
  public onCompleteItem() {
    if (hasValue(this.dso.id)) {
      this.refreshCache();
    }
    this.notificationsService.success(null, this.translate.get(this.type.value + '.edit.logo.notifications.add.success'));
    this.finish.emit();
  }

  /**
   * The request was unsuccessful, display an error notification
   */
  public onUploadError() {
    this.notificationsService.error(null, this.translate.get(this.type.value + '.edit.logo.notifications.add.error'));
    this.finish.emit();
  }

  createDefaultLanguageLabel(): string{
    const defaultLang: LangConfig = this.languages.find( language => language.code === this.defaultLanguage);
    if(defaultLang) {
      return defaultLang.label;
    }
    return null;
  }

  /**
   * Unsubscribe from open subscriptions
   */
  ngOnDestroy(): void {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }
}
