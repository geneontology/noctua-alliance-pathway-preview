import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';


import {
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  NoctuaActivityEntityService,
  CamService,
  Evidence,
  Entity,
  noctuaFormConfig,
  NoctuaUserService,
  ActivityType,
  Predicate,
  BbopGraphService,
  AnnotationActivity
} from '@geneontology/noctua-form-base';

import {
  Cam,
  Activity,
  ActivityNode,
  ShapeDefinition
} from '@geneontology/noctua-form-base';

import { EditorCategory } from '@noctua.editor/models/editor-category';
import { find } from 'lodash';
import { InlineEditorService } from '@noctua.editor/inline-editor/inline-editor.service';
import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { noctuaAnimations } from '@noctua/animations';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form/services/dialog.service';
import { SettingsOptions } from '@noctua.common/models/graph-settings';

@Component({
  selector: 'noc-annotation-node',
  templateUrl: './annotation-node.component.html',
  styleUrls: ['./annotation-node.component.scss'],
  animations: noctuaAnimations
})
export class AnnotationNodeComponent implements OnInit, OnDestroy {
  EditorCategory = EditorCategory;
  ActivityType = ActivityType;
  activityTypeOptions = noctuaFormConfig.activityType.options;


  @Input('cam')
  cam: Cam;

  @Input('annotationActivity')
  annotationActivity: AnnotationActivity;

  @Input('options')
  options: any = {};

  optionsDisplay: any = {}

  currentMenuEvent: any = {};

  evidenceSettings: SettingsOptions = new SettingsOptions();

  private unsubscribeAll: Subject<any>;

  constructor(
    public camService: CamService,
    private bbopGraphService: BbopGraphService,
    private confirmDialogService: NoctuaConfirmDialogService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaActivityEntityService: NoctuaActivityEntityService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    private inlineEditorService: InlineEditorService) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

    this.optionsDisplay = { ...this.options, hideHeader: true };
    this.evidenceSettings.showGroup = false;
    this.evidenceSettings.showContributor = false;

  }

  editEntity(entity: ActivityNode) {

    const data = {
      cam: this.cam,
      activity: this.annotationActivity.activity,
      entity: entity,
      category: EditorCategory.all,
      evidenceIndex: 0,
      insertEntity: true
    };

    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = this.annotationActivity.activity;
    this.noctuaActivityEntityService.initializeForm(this.annotationActivity.activity, entity);
    this.inlineEditorService.open(this.currentMenuEvent.target, { data });
  }

  toggleExpand(activity: Activity) {
    activity.expanded = !activity.expanded;
  }

  displayCamErrors() {
    const errors = this.cam.getViolationDisplayErrors();
    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }

  displayActivityErrors(activity: Activity) {
    const errors = activity.getViolationDisplayErrors();
    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }


  addEvidence(entity: ActivityNode) {
    const self = this;

    entity.predicate.addEvidence();
    const data = {
      cam: this.cam,
      activity: this.annotationActivity.activity,
      entity: entity,
      category: EditorCategory.evidenceAll,
      evidenceIndex: entity.predicate.evidence.length - 1
    };

    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = this.annotationActivity.activity;
    this.noctuaActivityEntityService.initializeForm(this.annotationActivity.activity, entity);
    this.inlineEditorService.open(this.currentMenuEvent.target, { data });

    self.noctuaActivityFormService.initializeForm();
  }


  removeEvidence(entity: ActivityNode, index: number) {
    const self = this;

    entity.predicate.removeEvidence(index);
    self.noctuaActivityFormService.initializeForm();
  }

  toggleIsComplement() {

  }

  openSearchDatabaseDialog(entity: ActivityNode) {
    const self = this;
    const gpNode = this.noctuaActivityFormService.activity.gpNode;

    if (gpNode) {
      const data = {
        readonly: false,
        gpNode: gpNode.term,
        aspect: entity.aspect,
        entity: entity,
        params: {
          term: '',
          evidence: ''
        }
      };

      const success = function (selected) {
        if (selected.term) {
          entity.term = new Entity(selected.term.term.id, selected.term.term.label);

          if (selected.evidences && selected.evidences.length > 0) {
            entity.predicate.setEvidence(selected.evidences);
          }
          self.noctuaActivityFormService.initializeForm();
        }
      };

      self.noctuaFormDialogService.openSearchDatabaseDialog(data, success);
    } else {
      // const error = new ActivityError(ErrorLevel.error, ErrorType.general,  "Please enter a gene product", meta)
      //errors.push(error);
      // self.dialogService.openActivityErrorsDialog(ev, entity, errors)
    }
  }


  insertEntity(entity: ActivityNode, predExpr: ShapeDefinition.PredicateExpression) {
    const insertedNode = this.noctuaFormConfigService.insertActivityNodeShex(this.annotationActivity.activity, entity, predExpr);

    //  this.noctuaActivityFormService.initializeForm();

    const data = {
      cam: this.cam,
      activity: this.annotationActivity.activity,
      entity: insertedNode,
      category: EditorCategory.all,
      evidenceIndex: 0,
      insertEntity: true
    };

    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = this.annotationActivity.activity;
    this.noctuaActivityEntityService.initializeForm(this.annotationActivity.activity, insertedNode);
    this.inlineEditorService.open(this.currentMenuEvent.target, { data });
  }

  addRootTerm(entity: ActivityNode) {
    const self = this;

    const term = find(noctuaFormConfig.rootNode, (rootNode) => {
      return rootNode.aspect === entity.aspect;
    });

    if (term) {
      entity.term = new Entity(term.id, term.label);
      self.noctuaActivityFormService.initializeForm();

      const evidence = new Evidence();
      evidence.setEvidence(new Entity(
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.id,
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.label));
      evidence.reference = noctuaFormConfig.evidenceAutoPopulate.nd.reference;
      entity.predicate.setEvidence([evidence]);
      self.noctuaActivityFormService.initializeForm();
    }
  }

  clearValues(entity: ActivityNode) {
    const self = this;

    entity.clearValues();
    self.noctuaActivityFormService.initializeForm();
  }

  openSelectEvidenceDialog(entity: ActivityNode) {
    const self = this;
    const evidences: Evidence[] = this.camService.getUniqueEvidence(self.noctuaActivityFormService.activity);
    const success = (selected) => {
      if (selected.evidences && selected.evidences.length > 0) {
        entity.predicate.setEvidence(selected.evidences);
        self.noctuaActivityFormService.initializeForm();
      }
    };

    self.noctuaFormDialogService.openSelectEvidenceDialog(evidences, success);
  }

  openCommentsForm(entity: ActivityNode) {
    const self = this;

    const success = (comments) => {
      if (comments) {
        this.bbopGraphService.savePredicateComments(self.cam, entity.predicate, comments);
      }
    };
    self.noctuaFormDialogService.openCommentsDialog(entity.predicate, success)
  }

  updateCurrentMenuEvent(event) {
    this.currentMenuEvent = event;
  }

  deleteAnnotation() {
    const self = this;

    const success = () => {
      this.camService.deleteActivity(this.annotationActivity.activity).then(() => {
        self.noctuaFormDialogService.openInfoToast('Annotation successfully deleted.', 'OK');
        this.camService.onSelectedActivityChanged.next(null);
        this.camService.getCam(this.cam.id);

      });
    };

    if (!self.noctuaUserService.user) {
      this.confirmDialogService.openConfirmDialog('Not Logged In',
        'Please log in to continue.',
        null);
    } else {
      this.confirmDialogService.openConfirmDialog('Confirm Delete?',
        'You are about to delete an annotation.',
        success);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  cleanId(dirtyId: string) {
    return NoctuaUtils.cleanID(dirtyId);
  }
}

