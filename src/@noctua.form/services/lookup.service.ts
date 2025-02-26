import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { find, filter, each, uniqWith, difference } from 'lodash';
import { noctuaFormConfig } from './../noctua-form-config';
import { Article } from './../models/article';
import { compareEvidenceEvidence, compareEvidenceReference, compareEvidenceWith, Evidence, EvidenceExt } from './../models/activity/evidence';
import { ActivityNode, GoCategory } from './../models/activity/activity-node';
import { Entity } from './../models/activity/entity';
import { Predicate } from './../models/activity/predicate';
import { NoctuaUserService } from './user.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import * as ShapeUtils from './../data/config/shape-utils';
import { GOlrResponse } from './../models/golr';
import { AutocompleteType } from './../models/autocomplete';

declare const require: any;

const amigo = require('amigo2');
const golr_conf = require('golr-conf');
const gconf = new golr_conf.conf(amigo.data.golr);
const gserv = environment.globalGolrServer; // "http://golr.berkeleybop.org/";
const impl_engine = require('bbop-rest-manager').jquery;
const golr_response = require('bbop-response-golr');
const engine = new impl_engine(golr_response);
engine.use_jsonp(true)

@Injectable({
  providedIn: 'root'
})
export class NoctuaLookupService {
  evidenceList: Evidence[] = [];
  termList: ActivityNode[] = [];
  name;
  linker;
  golrURLBase;
  localClosures;
  onArticleCacheReady: BehaviorSubject<any>;
  articleCache = {}

  constructor(private httpClient: HttpClient,
    private noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    this.onArticleCacheReady = new BehaviorSubject(null);
    this.name = 'DefaultLookupName';
    this.linker = new amigo.linker();
    this.golrURLBase = environment.globalGolrNeoServer + `select?`;
    // this.trusted = this.$sce.trustAsResourceUrl(this.golrURLBase);

    this.localClosures = [];

    //  this.golrLookupManager();

  }

  lookupFunc() {
    return {
      termLookup: this.termLookup.bind(this),
      // evidenceLookup: this.evidenceLookup.bind(this)
    };
  }

  escapeGolrValue(str) {
    const pattern = /([\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\/"])/g;
    return str.replace(pattern, "\\$1");
  }

  search(searchText: string, categories: GoCategory[]): Observable<GOlrResponse[]> {

    const reqs = ShapeUtils.getTermLookup(categories);
    return this.termLookup(searchText, reqs.requestParams);
  }

  termLookup(searchText, requestParams) {
    const self = this;
    requestParams.q = NoctuaUtils.formatSolrQueryString(searchText);
    const params = new HttpParams({
      fromObject: requestParams
    });
    const url = this.golrURLBase + params.toString();

    return this.httpClient.jsonp(url, 'json.wrf').pipe(
      map(response => {
        const result = this._lookupMap(response);
        return result;
      }),
      catchError(err => {
        console.error('Term Lookup Error:', err);
        return of([]);
      })
    );
  }

  preLookup(autocompleteType: AutocompleteType, categories: GoCategory[]) {
    switch (autocompleteType) {
      case AutocompleteType.TERM:
        return this.termPreLookup(categories);
      case AutocompleteType.EVIDENCE_CODE:
        return this.evidencePreLookup();
      case AutocompleteType.REFERENCE:
        return this.referencePreLookup();
      case AutocompleteType.WITH:
        return this.withPreLookup();
      default:
        return [];
    }
  }

  termPreLookup(categories: GoCategory[]): GOlrResponse[] {

    if (!categories || categories.length === 0) {
      return [];
    }

    const results: GOlrResponse[] = this.termList.map((node) => {
      return {
        id: node.term.id,
        label: node.term.label,
        rootTypes: node.rootTypes,
        notAnnotatable: true,
      } as GOlrResponse;

    }).filter((result) =>
      result.rootTypes.some((rootType) =>
        categories.some((category) => category.category === rootType.id)
      )
    );;

    return results;

  }

  evidencePreLookup(): GOlrResponse[] {
    const filtered = uniqWith(this.evidenceList, compareEvidenceEvidence);
    return filtered.map((evidence: Evidence) => {
      return {
        id: evidence.evidence.id,
        label: evidence.evidence.label,
        notAnnotatable: true,
      } as GOlrResponse;
    });
  }

  referencePreLookup(): string[] {

    const filtered = uniqWith(this.evidenceList, compareEvidenceReference);
    return filtered.map((evidence: Evidence) => {
      return evidence.reference
    });
  }

  withPreLookup(): string[] {
    const filtered = uniqWith(this.evidenceList, compareEvidenceWith);
    return filtered.map((evidence: Evidence) => {
      return evidence.with
    });
  }

  companionLookup(gp, aspect, extraParams) {
    const self = this;
    const golrUrl = environment.globalGolrServer + `select?`;

    const requestParams = {
      defType: 'edismax',
      qt: 'standard',
      indent: 'on',
      wt: 'json',
      sort: 'annotation_class_label asc',
      rows: '2000',
      start: '0',
      fl: '*,score',
      facet: 'true',
      'facet.mincount': '1',
      'facet.sort': 'count',
      'json.nl': 'arrarr',
      'facet.limit': '2000',
      fq: [
        'document_category: "annotation"',
        'aspect: "' + aspect + '"',
        'bioentity: "' + gp + '"'
      ],
      'facet.field': [
        'source',
        'assigned_by',
        'aspect',
        'evidence_type_closure',
        // 'panther_family_label',
        // 'qualifier',
        // 'taxon_label',
        'annotation_class_label',
        // 'regulates_closure_label',
        // 'annotation_extension_class_closure_label'
      ],
      q: '*:*',
      //  packet: '1',
      //  callback_type: 'search',
      // _: Date.now()
    };


    if (extraParams.term) {
      requestParams.fq.push('annotation_class:"' + extraParams.term + '"')
    }

    if (extraParams.evidence) {
      requestParams.fq.push('evidence:"' + extraParams.evidence + '"')
    }

    const params = new HttpParams({
      fromObject: requestParams
    })

    const url = golrUrl + params.toString();

    return this.httpClient.jsonp(url, 'json.wrf').pipe(
      map(response => {
        const docs = response['response'].docs;
        const result = [];

        each(docs, function (doc) {
          let activityNode: ActivityNode;
          const evidence = new Evidence();

          evidence.setEvidence(new Entity(doc.evidence, doc.evidence_label));

          if (doc.reference && doc.reference.length > 0) {
            evidence.reference = doc.reference.join(' | ');
          }

          if (doc.evidence_with && doc.evidence_with.length > 0) {
            evidence.with = doc.evidence_with.join(' | ');
          }

          evidence.groups = self.noctuaUserService.getGroupsFromNames([doc.assigned_by]);

          activityNode = find(result, (srcActivityNode: ActivityNode) => {
            return srcActivityNode.getTerm().id === doc.annotation_class;
          });

          if (doc.annotation_extension_json) {
            try {
              const extJsons = [];
              if (Array.isArray(doc.annotation_extension_json)) {
                doc.annotation_extension_json.forEach((ext) => {
                  extJsons.push(JSON.parse(ext));
                });
              } else {
                extJsons.push(JSON.parse(doc.annotation_extension_json));
              }

              evidence.evidenceExts = [];
              extJsons.forEach((extJson) => {
                if (extJson.relationship && extJson.relationship.relation) {
                  const evidenceExt = new EvidenceExt();
                  evidenceExt.term = new Entity(extJson.relationship.id, extJson.relationship.label)
                  extJson.relationship.relation.forEach(relation => {
                    evidenceExt.relations.push(new Entity(relation.id, relation.label))
                  });
                  evidence.evidenceExts.push(evidenceExt);
                }
              });

            } catch (e) {
              console.log(e, activityNode, doc.annotation_extension_json); // error in the above string (in this case, yes)!
            }
          }

          if (activityNode) {
            activityNode.predicate.addEvidence(evidence);
          } else {
            activityNode = new ActivityNode();
            activityNode.predicate = new Predicate(null);
            activityNode.term = new Entity(doc.annotation_class, doc.annotation_class_label);
            activityNode.predicate.addEvidence(evidence);
            result.push(activityNode);
          }
        });

        return result;
      }));
  }

  categoryToClosure(categories) {
    return categories.map((category) => {
      return `${category.categoryType}:"${category.category}"`;
    }).join(' OR ');
  }

  isaClosure(a: string, b: string) {
    const self = this;

    const requestParams = {
      q: NoctuaUtils.formatSolrQueryString(a),
      defType: 'edismax',
      indent: 'on',
      qt: 'standard',
      wt: 'json',
      rows: '2',
      start: '0',
      fl: '*,score',
      'facet': 'true',
      'facet.mincount': '1',
      'facet.sort': 'count',
      'facet.limit': '25',
      'json.nl': 'arrarr',
      packet: '1',
      callback_type: 'search',
      'facet.field': [
        'source',
        'subset',
        'idspace',
        'is_obsolete'
      ],
      fq: [
        'document_category:"ontology_class"',
        b
      ],
      qf: [
        'annotation_class^3',
        'isa_closure^1',
      ]
    };

    const params = new HttpParams({
      fromObject: requestParams
    });

    const url = this.golrURLBase + params.toString();

    return this.httpClient.jsonp(url, 'json.wrf').pipe(
      map(response => {
        const docs = response['response'].docs;
        let result = false;

        if (docs.length > 0) {
          result = docs[0].annotation_class === a;
        }
        return result;
      }));
  }

  getTermDetail(a: string) {
    const self = this;

    const requestParams = {
      q: NoctuaUtils.formatSolrQueryString(a),
      defType: 'edismax',
      indent: 'on',
      qt: 'standard',
      wt: 'json',
      rows: '2',
      start: '0',
      fl: '*,score',
      'facet': 'true',
      'facet.mincount': '1',
      'facet.sort': 'count',
      'facet.limit': '25',
      'json.nl': 'arrarr',
      packet: '1',
      callback_type: 'search',
      'facet.field': [
        'source',
        'subset',
        'idspace',
        'is_obsolete'
      ],
      fq: [
        'document_category:"ontology_class"',
      ],
      qf: [
        'annotation_class^3',
        'isa_closure^1',
      ]
    };

    const params = new HttpParams({
      fromObject: requestParams
    });

    const url = this.golrURLBase + params.toString();

    return this.httpClient.jsonp(url, 'json.wrf').pipe(
      map(response => self._lookupMap(response)),
      map(response => {
        if (response.length > 0) {
          return response[0]
        } else {
          return response
        }
      })
    );
  }

  getGenesDetails(ids: string[]) {

    const queryString = ids.map(id => `annotation_class:"${id}"`).join(' OR ');

    const requestParams = {
      q: queryString,
      defType: 'edismax',
      indent: 'on',
      qt: 'standard',
      wt: 'json',
      rows: ids.length.toString(),
      start: '0',
      fl: 'annotation_class,annotation_class_label,score',
      'facet': 'true',
      'facet.mincount': '1',
      'facet.sort': 'count',
      'facet.limit': '25',
      'json.nl': 'arrarr',
      packet: '1',
      callback_type: 'search',
      'facet.field': [
        'source',
        'subset',
        'idspace',
        'is_obsolete'
      ],
      fq: [
        'document_category:"ontology_class"',
      ],
    };

    const params = new HttpParams({
      fromObject: requestParams
    });

    const url = this.golrURLBase + params.toString();

    return this.httpClient.jsonp(url, 'json.wrf').pipe(
      map(response => this._lookupMap(response)),
      map(response => {
        const exactMatches = response.filter(result =>
          ids.includes(result.id)
        );
        return exactMatches;
      })
    );
  }

  getTermURL(id: string) {
    const self = this;

    if (id.startsWith('ECO')) {
      return 'http://www.evidenceontology.org/term/' + id;
    } else if (id.startsWith('PMID')) {
      const idAccession = id.split(':');
      if (idAccession.length > 1) {
        return 'https://www.ncbi.nlm.nih.gov/pubmed/' + idAccession[1].trim();
      } else {
        return null;
      }

    } else {
      return self.linker.url(id);
    }
  }

  addPubmedInfos(pmids: string[]) {
    const self = this;
    const presentPmids = Object.keys(this.articleCache)
    const ids = difference(pmids, presentPmids);

    if (ids.length > 0) {
      const url = environment.pubMedSummaryApi + ids.join(',');
      this.httpClient
        .get(url)
        .pipe(
          map(res => res['result']),
          map(res => {
            return res['uids'].map(uid => {
              return this._addArticles(res[uid])
            });
          })).subscribe((articles: Article[]) => {
            articles.forEach(article => {
              self.articleCache['PMID:' + article.id] = article;
            })

            self.onArticleCacheReady.next(true)
          });
    } else {
      self.onArticleCacheReady.next(true)
    }
  }

  getPubmedInfo(pmid: string) {
    const url = environment.pubMedSummaryApi + pmid;

    return this.httpClient
      .get(url)
      .pipe(
        map(res => res['result']),
        map(res => res[pmid]),
        map(res => this._addArticles(res)),
      );
  }

  private _addArticles(res) {
    const self = this;
    if (!res) {
      return;
    }

    const article = new Article();
    article.id = res.uid
    article.title = res.title;
    article.link = self.linker.url(`${noctuaFormConfig.evidenceDB.options.pmid.name}:${res.uid}`);
    article.date = res.pubdate;
    if (res.authors && Array.isArray(res.authors)) {
      article.author = res.authors.map(author => {
        return author.name;
      }).join(', ');
    }

    return article;
  }

  private _lookupMap(response): GOlrResponse[] {
    const self = this;
    const data = response.response.docs;
    const result: GOlrResponse[] = data.map((item) => {
      let xref;
      if (item.database_xref && item.database_xref.length > 0) {
        const xrefDB = item.database_xref[0].split(':');
        xref = xrefDB.length > 1 ? xrefDB[1] : xrefDB[0];
      }

      return {
        id: item.annotation_class,
        label: item.annotation_class_label,
        link: self.getTermURL(item.annotation_class),
        description: item.description,
        isObsolete: item.is_obsolete,
        replacedBy: item.replaced_by,
        rootTypes: self._makeEntitiesArray(item.isa_closure, item.isa_closure_label),
        xref: xref,
        neighborhoodGraphJson: item.neighborhood_graph_json,
        notAnnotatable: !item.subset?.includes('gocheck_do_not_annotate')
      } as GOlrResponse;
    });

    return result;
  }

  private _makeEntitiesArray(ids: string[], labels: string[]): Entity[] {
    let result = [];
    if (!labels && !ids) {
      return []
    } else if (!labels) {
      result = ids.map((id, key) => {
        return new Entity(id, id);
      });
    } else if (ids.length === labels.length) {
      result = ids.map((id, key) => {
        return new Entity(id, labels[key]);
      });
    }

    return filter(result, (item: Entity) => {
      return !item.id.startsWith('BFO');
    });
  }

}
