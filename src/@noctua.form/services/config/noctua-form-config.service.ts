import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { noctuaFormConfig } from './../../noctua-form-config';
import * as ModelDefinition from './../../data/config/model-definition';
import * as ShapeDescription from './../../data/config/shape-definition';

import { Activity, ActivityType } from './../../models/activity/activity';
import { find, filter, each } from 'lodash';

import * as ShapeUtils from './../../data/config/shape-utils';
import { NoctuaUserService } from '../user.service';
import { BehaviorSubject } from 'rxjs';
import { ActivityNode, GoCategory } from './../../models/activity/activity-node';
import { Entity, RootTypes } from './../../models/activity/entity';
import { Evidence } from './../../models/activity/evidence';
import { Predicate } from './../../models/activity/predicate';
import { DataUtils } from '../../data/config/data-utils';
import shexJson from './../../data/shapes.json';
import gpToTermJson from './../../data/gp-to-term.json';
import { AnnotationActivity, AnnotationEdgeConfig } from './../../models/activity/annotation-activity';

@Injectable({
  providedIn: 'root'
})
export class NoctuaFormConfigService {

  globalUrl: any = {};
  loginUrl: string;
  logoutUrl: string;
  noctuaUrl: string;
  homeUrl: string;
  onSetupReady: BehaviorSubject<any>;
  termLookupTable
  shapePredicates: string[];

  constructor(private noctuaUserService: NoctuaUserService) {
    this.onSetupReady = new BehaviorSubject(null);
    this.termLookupTable = DataUtils.genTermLookupTable();
    this.shapePredicates = DataUtils.getPredicates(shexJson.goshapes, null, null, false);
  }

  get edges() {
    return noctuaFormConfig.edge;
  }

  get modelState() {
    const options = [
      noctuaFormConfig.modelState.options.development,
      noctuaFormConfig.modelState.options.production,
      noctuaFormConfig.modelState.options.review,
      noctuaFormConfig.modelState.options.closed,
      noctuaFormConfig.modelState.options.delete,
      noctuaFormConfig.modelState.options.internal_test
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get graphLayoutDetail() {
    const options = [
      noctuaFormConfig.graphLayoutDetail.options.detailed,
      noctuaFormConfig.graphLayoutDetail.options.simple,
      noctuaFormConfig.graphLayoutDetail.options.preview
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  findModelState(name) {
    const self = this;

    return find(self.modelState.options, (modelState) => {
      return modelState.name === name;
    });
  }

  get evidenceDBs() {
    const options = [
      noctuaFormConfig.evidenceDB.options.pmid,
      noctuaFormConfig.evidenceDB.options.doi,
      noctuaFormConfig.evidenceDB.options.goRef,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityType() {
    const options = [
      noctuaFormConfig.activityType.options.default,
      noctuaFormConfig.activityType.options.bpOnly,
      noctuaFormConfig.activityType.options.ccOnly,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activitySortField() {
    const options = [
      noctuaFormConfig.activitySortField.options.gp,
      noctuaFormConfig.activitySortField.options.date
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get bpOnlyEdges() {
    const options = [
      noctuaFormConfig.edge.causallyUpstreamOfOrWithin,
      noctuaFormConfig.edge.causallyUpstreamOf,
      noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect,
      noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect,
      noctuaFormConfig.edge.causallyUpstreamOfOrWithinPositiveEffect,
      noctuaFormConfig.edge.causallyUpstreamOfOrWithinNegativeEffect,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get ccOnlyEdges() {
    const options = [
      noctuaFormConfig.edge.partOf,
      noctuaFormConfig.edge.locatedIn,
      noctuaFormConfig.edge.isActiveIn,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get graphDisplayDefaultEdges() {
    const options = [
      noctuaFormConfig.edge.enabledBy,
      noctuaFormConfig.edge.partOf,
      noctuaFormConfig.edge.occursIn,
      noctuaFormConfig.edge.hasInput
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get effectDirection() {
    const options = [
      noctuaFormConfig.effectDirection.positive,
      noctuaFormConfig.effectDirection.negative
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get findReplaceCategories() {
    const options = [
      noctuaFormConfig.findReplaceCategory.options.term,
      noctuaFormConfig.findReplaceCategory.options.gp,
      noctuaFormConfig.findReplaceCategory.options.reference,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get directness() {
    const options = [
      noctuaFormConfig.directness.direct,
      noctuaFormConfig.directness.indirect,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityRelationship() {
    const options = [
      noctuaFormConfig.activityRelationship.regulation,
      noctuaFormConfig.activityRelationship.constitutivelyUpstream,
      noctuaFormConfig.activityRelationship.providesInputFor,
      noctuaFormConfig.activityRelationship.removesInputFor,
      noctuaFormConfig.activityRelationship.undetermined
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get activityMoleculeRelationship() {
    const options = [
      noctuaFormConfig.activityMoleculeRelationship.product,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get moleculeActivityRelationship() {
    const options = [
      noctuaFormConfig.moleculeActivityRelationship.regulates,
      noctuaFormConfig.moleculeActivityRelationship.substrate,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  setupUrls() {
    const self = this;
    const baristaToken = self.noctuaUserService.baristaToken;

    const url = new URL(window.location.href);
    url.searchParams.delete('barista_token');

    const returnUrl = url.href;
    const baristaParams = { 'barista_token': baristaToken };
    const returnUrlParams = { 'return': returnUrl };

    this.loginUrl = environment.globalBaristaLocation + '/login?' +
      self._parameterize(Object.assign({}, returnUrlParams));
    this.logoutUrl = environment.globalBaristaLocation + '/logout?' +
      self._parameterize(Object.assign({}, baristaParams, returnUrlParams));
    this.noctuaUrl = environment.noctuaUrl + '?' + (baristaToken ? self._parameterize(Object.assign({}, baristaParams)) : '');
    this.homeUrl = window.location.href;
  }

  setUniversalUrls() {
    const self = this;
    self.globalUrl = {};
    let params = new HttpParams();

    if (self.noctuaUserService.baristaToken) {
      params = params.append('barista_token', self.noctuaUserService.baristaToken);
    }

    const paramsString = params.toString();
    self.globalUrl.goUrl = 'http://www.geneontology.org/';
    self.globalUrl.noctuaUrl = environment.noctuaUrl + '?' + paramsString;
    self.globalUrl.universalWorkbenches = environment.globalWorkbenchesUniversal.map(workbench => {
      return {
        label: workbench['menu-name'],
        url: environment.workbenchUrl + workbench['workbench-id'] + '?' + paramsString,
      };
    });

    self.globalUrl.universalBetaTestWorkbenches = environment.globalWorkbenchesUniversalBetaTest.map(workbench => {
      return {
        label: workbench['menu-name'],
        url: environment.workbenchUrl + workbench['workbench-id'] + '?' + paramsString,
      };
    });

    return self.globalUrl;
  }

  getModelUrls(modelId: string) {
    const self = this;
    const modelInfo: any = {};

    let params = new HttpParams();

    if (self.noctuaUserService.baristaToken) {
      params = params.append('barista_token', self.noctuaUserService.baristaToken);
    }

    modelInfo.graphEditorUrl = environment.noctuaUrl + '/editor/graph/' + modelId + '?' + params.toString();

    if (modelId) {
      params = params.append('model_id', modelId);
    }

    const paramsString = params.toString();

    modelInfo.owlUrl = environment.noctuaUrl + '/download/' + modelId + '/owl';
    modelInfo.gpadUrl = environment.noctuaUrl + '/download/' + modelId + '/gpad';
    modelInfo.noctuaFormUrl = environment.workbenchUrl + 'noctua-form?' + paramsString;
    modelInfo.noctuaVPEUrl = environment.workbenchUrl + 'noctua-visual-pathway-editor?' + paramsString;

    modelInfo.modelWorkbenches = environment.globalWorkbenchesModel.map(workbench => {
      return {
        id: workbench['workbench-id'],
        label: workbench['menu-name'],
        url: environment.workbenchUrl + workbench['workbench-id'] + '?' + paramsString,
      };
    });

    modelInfo.modelBetaTestWorkbenches = environment.globalWorkbenchesModelBetaTest.map(workbench => {
      return {
        id: workbench['workbench-id'],
        label: workbench['menu-name'],
        url: environment.workbenchUrl + workbench['workbench-id'] + '?' + paramsString,
      };
    });

    modelInfo.workbenches = {}

    modelInfo.modelWorkbenches.forEach((workbench) => {
      modelInfo.workbenches[workbench['id']] = workbench
    })

    return modelInfo;
  }

  activityToAnnotation(activity: Activity): AnnotationActivity {
    const annotationActivity = new AnnotationActivity();

    const criteria = {} as AnnotationEdgeConfig

    if (activity.activityType === ActivityType.ccOnly || activity.activityType === ActivityType.molecule) {
      annotationActivity.gp = activity.gpNode;

      activity.getEdges(activity.gpNode.id).forEach((edge) => {

        if (noctuaFormConfig.ccOnlyEdges.includes(edge.predicate.edge.id)) {
          criteria.gpToTermPredicate = edge.predicate.edge.id;
          annotationActivity.goterm = edge.object;
          annotationActivity.gp.predicate = edge.predicate;
        }

      });
    } else {

      criteria.gpToTermPredicate = noctuaFormConfig.edge.enabledBy.id;
      annotationActivity.gp = activity.gpNode;
      annotationActivity.goterm = activity.mfNode;

      if (activity.mfNode?.term.id === noctuaFormConfig.rootNode.mf.id) {
        criteria.mfNodeRequired = true;
        activity.getEdges(activity.mfNode.id).forEach((edge) => {
          if (noctuaFormConfig.mfToTermEdges.includes(edge.predicate.edge.id)) {

            annotationActivity.gpToTermEdge = edge.predicate.edge
            criteria.mfToTermPredicate = edge.predicate.edge.id;

            annotationActivity.goterm = edge.object;

            activity.getEdges(edge.object.id).forEach((extensionEdge) => {
              annotationActivity.extensionEdge = extensionEdge.predicate.edge;
              annotationActivity.extension = extensionEdge.object;
            });
          }
        });
      }
    }

    const edgeId = this.findEdge(criteria.gpToTermPredicate);
    const inverseEdgeId = annotationActivity.findEdgeByCriteria(criteria);
    const inverseEdge = this.findEdge(inverseEdgeId);

    if (edgeId && inverseEdge) {
      annotationActivity.gpToTermEdge = Entity.createEntity(edgeId);
      annotationActivity.gpToTermEdge.inverseEntity = inverseEdge
    }

    annotationActivity.gpToTermEdges = this.getTermRelations(
      annotationActivity.gp.rootTypes,
      annotationActivity.goterm.rootTypes,
      true
    );

    this._getAnnotationExtensions(activity, annotationActivity)


    return annotationActivity
  }

  private _getAnnotationExtensions(activity: Activity, annotationActivity: AnnotationActivity) {

    const edges = activity.getEdges(annotationActivity.goterm.id)

    edges.forEach((edge) => {

      const allowedPredicate = this.getTermRelations(edge.subject.rootTypes, edge.object.rootTypes)

      const isAllowedPredicate = allowedPredicate.some((predicate) => {
        return predicate.id === edge.predicate.edge.id
      });

      if (isAllowedPredicate) {
        annotationActivity.extensionEdge = edge.predicate.edge;
        annotationActivity.extension = edge.object;
      }
    });
  }



  createPredicate(edge: Entity, evidence?: Evidence[]): Predicate {
    const predicate = new Predicate(edge, evidence);

    ShapeUtils.setEvidenceLookup(predicate);

    return predicate;
  }

  //For reading the table
  createActivityBaseModel(modelType: ActivityType, rootNode: ActivityNode): Activity {

    const baseNode = ModelDefinition.rootNodes[modelType];

    if (!baseNode) return;
    const node = { ...baseNode, ...rootNode }

    return ModelDefinition.createBaseActivity(modelType, node as ActivityNode);
  }

  // For the form
  createActivityModel(activityType: ActivityType): Activity {
    switch (activityType) {
      case ActivityType.default:
        return ModelDefinition.createActivityShex(ModelDefinition.activityUnitDescription);
      case ActivityType.bpOnly:
        return ModelDefinition.createActivityShex(ModelDefinition.bpOnlyAnnotationDescription);
      case ActivityType.ccOnly:
        return ModelDefinition.createActivityShex(ModelDefinition.ccOnlyAnnotationDescription);
      case ActivityType.molecule:
        return ModelDefinition.createActivityShex(ModelDefinition.moleculeDescription);
      case ActivityType.proteinComplex:
        return ModelDefinition.createActivityShex(ModelDefinition.proteinComplexDescription);
      case ActivityType.simpleAnnoton:
        return ModelDefinition.createActivityShex(ModelDefinition.simpleAnnotonDescription);
    }
  }

  getTermRelations(subjectRootTypes: Entity[], objectRootTypes: Entity[], gpToTerm = false) {
    if (!subjectRootTypes || !objectRootTypes) return [];

    const subjectIds = subjectRootTypes.map((rootType) => {
      return rootType.id
    });

    const objectIds = objectRootTypes.map((rootType) => {
      return rootType.id
    });

    const predicates = DataUtils.getPredicates(
      gpToTerm ? gpToTermJson.goshapes : shexJson.goshapes, subjectIds, objectIds);

    return predicates.map((predicate) => {
      return this.findEdge(predicate);
    });
  }

  setTermLookup(activityNode: ActivityNode, goCategories: GoCategory[]) {
    ShapeUtils.setTermLookup(activityNode, goCategories);
  }

  getObjectsRelations(subjectRootTypes: Entity[], gpToTerm = false) {
    if (!subjectRootTypes) return [];

    const subjectIds = subjectRootTypes.map((rootType) => {
      return rootType.id
    });

    const objectIds = DataUtils.getObjects(gpToTerm ? gpToTermJson.goshapes : shexJson.goshapes, subjectIds);

    return objectIds.reduce((acc, term) => {
      const node = this.termLookupTable[term];
      if (node) {
        const category = new GoCategory();
        category.category = node.id;
        acc.push(category);
      }
      return acc;
    }, []);

  }

  addActivityNodeShex(activity: Activity,
    subjectNode: ActivityNode,
    predExpr: ShapeDescription.PredicateExpression,
    objectNode: Partial<ActivityNode>): ActivityNode {
    return ModelDefinition.addNodeShex(activity, subjectNode, predExpr, objectNode);
  }

  insertActivityNodeShex(activity: Activity,
    subjectNode: ActivityNode,
    predExpr: ShapeDescription.PredicateExpression,
    objectId: string = null): ActivityNode {
    return ModelDefinition.insertNodeShex(activity, subjectNode, predExpr, objectId);
  }

  insertActivityNodeByPredicate(activity: Activity, subjectNode: ActivityNode, bbopPredicateId: string,
    partialObjectNode?: Partial<ActivityNode>): ActivityNode {
    const predExprs: ShapeDescription.PredicateExpression[] = subjectNode.canInsertNodes;


    let objectNode;

    /*  each(predExprs, (predExpr: ShapeDescription.PredicateExpression) => {
       if (bbopPredicateId === predExpr.id) {
         if (partialObjectNode && partialObjectNode.hasRootTypes(predExpr.node.category)) {
           objectNode = ModelDefinition.insertNodeShex(activity, subjectNode, predExpr);
           return false;
         } else if (!partialObjectNode) {
           objectNode = ModelDefinition.insertNodeShex(activity, subjectNode, predExpr);
           return false;
         }
       }
     }); */

    return objectNode;
  }

  createActivityModelFakeData(nodes) {
    const self = this;
    const activity = self.createActivityModel(ActivityType.default);

    nodes.forEach((node) => {
      const activityNode = activity.getNode(node.id);
      const destEvidences: Evidence[] = [];

      activityNode.term = new Entity(node.term.id, node.term.label);

      each(node.evidence, (evidence) => {
        const destEvidence: Evidence = new Evidence();

        destEvidence.evidence = new Entity(evidence.evidence.id, evidence.evidence.label);
        destEvidence.reference = evidence.reference;
        destEvidence.with = evidence.with;

        destEvidences.push(destEvidence);
      });

      activityNode.predicate.setEvidence(destEvidences);
    });

    activity.enableSubmit();
    return activity;
  }

  findEdge(predicateId) {

    const edge = find(noctuaFormConfig.allEdges, {
      id: predicateId
    });

    return edge ? Entity.createEntity(edge) : Entity.createEntity({ id: predicateId, label: predicateId });
  }

  getAspect(id) {
    const rootNode = find(noctuaFormConfig.rootNode, { id: id });

    return rootNode ? rootNode.aspect : '';
  }

  getModelId(url: string) {
    return 'gomodel:' + url.substr(url.lastIndexOf('/') + 1);
  }

  getIndividalId(url: string) {
    return 'gomodel:' + url.substr(url.lastIndexOf('/') + 2);
  }

  private _parameterize = (params) => {
    return Object.keys(params).map(key => key + '=' + params[key]).join('&');
  }

}
