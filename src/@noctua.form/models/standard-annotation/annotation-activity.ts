import { ActivityNode } from './../activity/activity-node';
import { Entity, RootTypes } from './../activity/entity';
import { noctuaFormConfig } from './../../noctua-form-config';
import { Activity } from './../activity/activity';
import { Triple, TriplePair } from './../activity/triple';
import { Predicate } from './../activity/predicate';
import * as ShapeUtils from './../../data/config/shape-utils';
import * as EntityDefinition from './../../data/config/entity-definition';
import { Evidence } from './../activity/evidence';
import { AnnotationEvidenceForm, StandardAnnotationForm } from './form';
import { cloneDeep } from 'lodash';
import { Contributor } from '../contributor';
import { AnnotationActivitySortBy, AnnotationActivitySortField } from './annotation-activity-sortby';


export interface AnnotationEdgeConfig {
  gpToTermPredicate?: string;
  gpToTermReverse?: boolean;
  mfNodeRequired: boolean;
  mfToTermPredicate?: string;
  root?: RootTypes;
  mfToTermReverse?: boolean;
}

export class AnnotationExtension {
  extensionTerm: ActivityNode;
  extensionEdge: Entity;
  extensionEdges: Entity[] = [];

  constructor(extension?: ActivityNode) {
    if (extension) {
      this.extensionTerm = extension;
    } else {
      this.extensionTerm = ShapeUtils.generateBaseTerm([]);
      this.extensionTerm.label = 'Extension Term';
    }
  }
}


export class AnnotationActivity {
  id: string;
  gp: ActivityNode;
  goterm: ActivityNode;
  gpToTermEdge: Entity;
  gotermAspect: string;

  evidenceCode = ShapeUtils.generateBaseTerm([]);
  reference = ShapeUtils.generateBaseTerm([]);
  with = ShapeUtils.generateBaseTerm([]);
  comments: string[] = [];
  evidenceDate: string;
  evidenceContributors: Contributor[] = [];

  extensions: AnnotationExtension[] = [];
  gpToTermEdges: Entity[] = [];
  activity: Activity;
  date: string;
  formattedDate: string;


  constructor(activity?: Activity) {

    if (activity) {
      this.activityToAnnotation(activity);
    }

    this.evidenceCode.category = [EntityDefinition.GoEvidence];
    this.evidenceCode.label = 'Evidence'
    this.reference.label = 'Reference'
    this.with.label = 'With/From'
  }


  activityToAnnotation(activity: Activity) {
    this.gp = activity.getNode('gp');
    this.goterm = activity.getNode('goterm');

    const extensionTriples: Triple<ActivityNode>[] = activity.getEdges(this.goterm.id);
    this.extensions = extensionTriples.map(triple => {
      const extension = new AnnotationExtension();
      extension.extensionTerm = triple.object;
      extension.extensionEdge = triple.predicate.edge;
      return extension;
    });

  }

  findEdgeByCriteria(matchCriteria: AnnotationEdgeConfig): string {

    const config = noctuaFormConfig.simpleAnnotationEdgeConfig;

    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        let allCriteriaMatch = true;
        const entry = config[key];

        for (const criterion in matchCriteria) {
          if (entry[criterion] !== matchCriteria[criterion]) {
            allCriteriaMatch = false;
            break;
          }
        }

        if (allCriteriaMatch) {
          return key;
        }
      }
    }
    return null;
  }


  getEvidenceNodes(): Evidence[] {
    const evidenceNodes: Evidence[] = [];
    this.activity.edges.forEach(triple => {
      triple.predicate.evidence.forEach(evidence => {
        evidenceNodes.push(evidence);
      });
    });

    return evidenceNodes;
  }

  getPredicates(): Predicate[] {
    return this.activity.edges.map(triple => {
      return triple.predicate;
    });
  }

  getExtensionTriple(predicateId: string, extension: ActivityNode): Triple<ActivityNode> {
    const triple = this.activity.edges.find(edge => edge.object.uuid === extension.uuid && edge.predicate.edge.id === predicateId);

    return triple

  }

  getTriplePair(predicateId: string, goterm: ActivityNode, newPredicateId: string): TriplePair<ActivityNode> {
    const oldTriple = this.activity.edges.find(edge =>
      (predicateId === noctuaFormConfig.edge.enabledBy.id ? edge.subject.uuid : edge.object.uuid) === goterm.uuid &&
      edge.predicate.edge.id === predicateId
    );


    if (!oldTriple) {
      return { a: undefined, b: undefined };
    }

    const config = noctuaFormConfig.simpleAnnotationEdgeConfig[newPredicateId];
    if (!config) {
      return { a: oldTriple, b: undefined };
    }

    const newTriple = cloneDeep(oldTriple);

    const shouldSwapSubjectAndObject =
      predicateId === noctuaFormConfig.edge.enabledBy.id ||
      predicateId === noctuaFormConfig.inverseEdge.enables.id ||
      newPredicateId === noctuaFormConfig.edge.enabledBy.id ||
      newPredicateId === noctuaFormConfig.inverseEdge.enables.id;

    if (shouldSwapSubjectAndObject) {
      [newTriple.subject, newTriple.object] = [newTriple.object, newTriple.subject];
    }

    newTriple.predicate.edge = new Entity(
      config.mfNodeRequired ? config.mfToTermPredicate : config.gpToTermPredicate,
      ''
    );

    return { a: oldTriple, b: newTriple };
  }

  genExtensionTriple(relationId: string, extensionId: string) {
    const edge = new Entity(relationId, '');
    const extension = new ActivityNode();
    const evidence = this._createEvidence();
    const predicate = new Predicate(edge, [evidence]);

    extension.term = new Entity(extensionId, '');
    predicate.comments = this.comments;

    return new Triple(this.goterm, extension, predicate);
  }

  public static createGPsSave(srcAnnotationActivity: AnnotationActivity, gpIds: string[]) {
    const saveData = {
      triples: [],
      nodes: [],
      graph: null
    };

    gpIds.forEach((gpId: string) => {
      const annotationActivity = this._populateBulkAnnotationActivity(srcAnnotationActivity, gpId);

      saveData.nodes.push(annotationActivity.gp, annotationActivity.goterm);

      const edgeType = annotationActivity.gpToTermEdge.inverseEntity?.id
      const config = noctuaFormConfig.simpleAnnotationEdgeConfig[edgeType]
      const evidence = annotationActivity._createEvidence();

      if (!config) {
        console.warn('No configuration defined for edge:', edgeType);
        return;
      }

      if (config.mfNodeRequired) {
        const mfNode = ShapeUtils.generateBaseTerm([]);

        const rootMF = noctuaFormConfig.rootNode.mf;
        mfNode.term = new Entity(rootMF.id, rootMF.label);

        const triple = annotationActivity._createTriple(mfNode, annotationActivity.gp, config.gpToTermPredicate, evidence, config.gpToTermReverse)
        saveData.triples.push(triple);

        if (config.mfToTermPredicate) {
          const mfTriple = annotationActivity._createTriple(mfNode, annotationActivity.goterm, config.mfToTermPredicate, evidence)
          saveData.triples.push(mfTriple);
        }

      } else {
        const triple = annotationActivity._createTriple(annotationActivity.gp, annotationActivity.goterm, config.gpToTermPredicate, evidence, config.gpToTermReverse)
        saveData.triples.push(triple);
      }

      annotationActivity.extensions.forEach(ext => {

        if (ext.extensionTerm?.hasValue()) {
          const extensionTriple = annotationActivity._createTriple(annotationActivity.goterm, ext.extensionTerm, ext.extensionEdge.id, evidence);

          saveData.nodes.push(ext.extensionTerm);
          saveData.triples.push(extensionTriple);
        }
      });
    });

    return saveData;
  }

  public static createSave(annotationForm: StandardAnnotationForm) {

    const saveData = {
      title: 'enabled by ' + annotationForm.gp?.label,
      triples: [],
      nodes: [],
      graph: null
    };

    annotationForm.evidences.forEach(evidenceForm => {
      const annotationActivity = this._populateAnnotationActivity(annotationForm, evidenceForm);

      saveData.nodes.push(annotationActivity.gp, annotationActivity.goterm);

      const edgeType = annotationActivity.gpToTermEdge.id
      const config = noctuaFormConfig.simpleAnnotationEdgeConfig[edgeType]
      const evidence = annotationActivity._createEvidence();

      if (!config) {
        console.warn('No configuration defined for edge:', edgeType);
        return;
      }

      if (config.mfNodeRequired) {
        const mfNode = ShapeUtils.generateBaseTerm([]);

        const rootMF = noctuaFormConfig.rootNode.mf;
        mfNode.term = new Entity(rootMF.id, rootMF.label);

        const triple = annotationActivity._createTriple(mfNode, annotationActivity.gp, config.gpToTermPredicate, evidence, config.gpToTermReverse)
        saveData.triples.push(triple);

        if (config.mfToTermPredicate) {
          const mfTriple = annotationActivity._createTriple(mfNode, annotationActivity.goterm, config.mfToTermPredicate, evidence)
          saveData.triples.push(mfTriple);
        }

      } else {
        const triple = annotationActivity._createTriple(annotationActivity.gp, annotationActivity.goterm, config.gpToTermPredicate, evidence, config.gpToTermReverse)
        saveData.triples.push(triple);
      }

      annotationActivity.extensions.forEach(ext => {

        if (ext.extensionTerm?.hasValue()) {
          const extensionTriple = annotationActivity._createTriple(annotationActivity.goterm, ext.extensionTerm, ext.extensionEdge.id, evidence);

          saveData.nodes.push(ext.extensionTerm);
          saveData.triples.push(extensionTriple);
        }
      });
    });

    return saveData;
  }

  private _createEvidence() {
    const evidence = new Evidence();

    evidence.evidence = new Entity(this.evidenceCode?.term.id, "");
    evidence.reference = this.reference?.term.id;
    evidence.with = this.with?.term.id;

    return evidence;
  }


  private _createTriple(subjectNode: ActivityNode, objectNode: ActivityNode, predicateId: string, evidence: Evidence, reverse = false) {
    const edgeConfig = noctuaFormConfig.allEdges.find(edge => edge.id === predicateId);

    if (!edgeConfig) {
      throw new Error(`Edge configuration not found for predicate ID: ${predicateId}`);
    }

    const predicateEntity = Entity.createEntity(edgeConfig);
    const predicate = new Predicate(predicateEntity, [evidence]);
    predicate.comments = this.comments;

    return reverse
      ? new Triple(objectNode, subjectNode, predicate)
      : new Triple(subjectNode, objectNode, predicate);
  }


  updateAspect() {
    if (!this.goterm.hasValue()) return

    let aspect: string | null = null;
    const rootNode = noctuaFormConfig.rootNode
    for (const key in noctuaFormConfig.rootNode) {
      if (this.goterm.rootTypes && this.goterm.rootTypes.some(item => item.id === rootNode[key].id)) {
        this.gotermAspect = rootNode[key].aspect;
        break;
      }
    }

    return aspect;
  }

  private static _populateBulkAnnotationActivity(srcAnnotationActivity: AnnotationActivity, gpId: string) {

    const annotationActivity = cloneDeep(srcAnnotationActivity);

    annotationActivity.gp.term.id = gpId;
    annotationActivity.gp.id = undefined;
    annotationActivity.gp.term.uuid = undefined;
    annotationActivity.gp.uuid = undefined;
    annotationActivity.goterm.id = undefined;
    annotationActivity.goterm.term.uuid = undefined;
    annotationActivity.goterm.uuid = undefined
    annotationActivity.gpToTermEdge.uuid = undefined;

    // Evidence
    annotationActivity.evidenceCode.term.uuid = undefined
    annotationActivity.reference.term.uuid = undefined
    annotationActivity.with.term.uuid = undefined;

    annotationActivity.comments = [...srcAnnotationActivity.comments];

    annotationActivity.extensions.forEach((extension: AnnotationExtension) => {
      extension.extensionEdge.uuid = undefined;
      extension.extensionTerm.uuid = undefined;
      extension.extensionTerm.term.uuid = undefined;
    });

    return annotationActivity;
  }

  private static _populateAnnotationActivity(annotationForm: StandardAnnotationForm, evidenceForm: AnnotationEvidenceForm) {

    const annotationActivity = new AnnotationActivity();
    annotationActivity.gp = ShapeUtils.generateBaseTerm([]);
    annotationActivity.goterm = ShapeUtils.generateBaseTerm([]);

    annotationActivity.gp.term.id = annotationForm.gp.id;
    annotationActivity.goterm.term.id = annotationForm.goterm.id;
    annotationActivity.gpToTermEdge = annotationForm.gpToTermEdge;
    annotationActivity.goterm.isComplement = annotationForm.isComplement;

    // Evidence
    annotationActivity.evidenceCode.term.id = evidenceForm.evidenceCode.id;
    annotationActivity.reference.term.id = evidenceForm.reference;
    annotationActivity.with.term.id = evidenceForm.withFrom;

    annotationActivity.comments = Array.from(new Set(annotationForm.annotationComments.map(comment => comment.comment)));

    annotationForm.annotationExtensions.forEach((ext) => {
      const extension = new AnnotationExtension();

      extension.extensionTerm = ShapeUtils.generateBaseTerm([]);
      extension.extensionEdge = ext.extensionEdge;
      extension.extensionTerm.term.id = ext.extensionTerm.id;

      annotationActivity.extensions.push(extension);

    });

    return annotationActivity;
  }

  public static getSortByKey(annotationActivity: AnnotationActivity) {
    return annotationActivity.gp?.term.label;
  }

  private static getSafeLabel(obj: any): string {
    return obj?.term?.label ?? '';
  }

  public static sortBy(activities: AnnotationActivity[], sortBy: AnnotationActivitySortBy): AnnotationActivity[] {
    return activities.sort((a, b) => {
      let comparison = 0;

      switch (sortBy.field) {
        case AnnotationActivitySortField.GP:
          comparison = this.getSafeLabel(a.gp).localeCompare(this.getSafeLabel(b.gp));
          break;
        case AnnotationActivitySortField.GOTERM:
          comparison = this.getSafeLabel(a.goterm).localeCompare(this.getSafeLabel(b.goterm));
          break;
        case AnnotationActivitySortField.GP_TO_TERM_EDGE:
          comparison = (a.gpToTermEdge?.label ?? '').localeCompare(b.gpToTermEdge?.label ?? '');
          break;
        case AnnotationActivitySortField.GO_TERM_ASPECT:
          comparison = (a.gotermAspect ?? '').localeCompare(b.gotermAspect ?? '');
          break;
        case AnnotationActivitySortField.EVIDENCE_CODE:
          comparison = this.getSafeLabel(a.evidenceCode).localeCompare(this.getSafeLabel(b.evidenceCode));
          break;
        case AnnotationActivitySortField.REFERENCE:
          comparison = this.getSafeLabel(a.reference).localeCompare(this.getSafeLabel(b.reference));
          break;
        case AnnotationActivitySortField.WITH:
          comparison = this.getSafeLabel(a.with).localeCompare(this.getSafeLabel(b.with));
          break;
        case AnnotationActivitySortField.DATE:
          const dateA = a.date ? new Date(a.date) : new Date(0); // Use epoch date if a.date is null or undefined
          const dateB = b.date ? new Date(b.date) : new Date(0); // Use epoch date if b.date is null or undefined
          comparison = dateA.getTime() - dateB.getTime();
          break;
        default:
          comparison = this.getSafeLabel(a.gp).localeCompare(this.getSafeLabel(b.gp));
      }

      // If the primary sort yields equality, sort by id as secondary criterion
      if (comparison === 0) {
        comparison = (a.id ?? '').localeCompare(b.id ?? '');
      }

      return sortBy.ascending ? comparison : -comparison;
    });
  }

}
