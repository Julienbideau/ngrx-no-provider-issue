import {
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {noop, Observable, of, Subject, Subscription} from 'rxjs';
import * as X2JS from 'x2js';
import {MatCheckbox, MatCheckboxChange} from '@angular/material/checkbox';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSelectChange} from '@angular/material/select';
import {Overlay} from '@angular/cdk/overlay';
import {
  ChrAbsenceProvider
} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/chr-absence.provider';
import {
  ChrAbsenceMessages
} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/chr-absence.messages';
import {AbsencesDetailFormComponent} from '@asys/forms';
import {
  IAbsencesClass,
  IAbsenceshClass,
  IAbsencesperiodeClass,
  ITypabsClass
} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/models';
import {ChrAbsenceState} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/chr-absence.state';
import {select, Store} from '@ngrx/store';
import * as AbsPeriodeStoreSelectors
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/absenceperiode/absenceperiode.selectors';
import * as AbsPeriodeStoreActions
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/absenceperiode/absenceperiode.actions';
import * as AbsHeureStoreSelectors
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/absenceheure/absenceheure.selectors';
import * as AbsHeureStoreActions
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/absenceheure/absenceheure.actions';
import * as TypabsStoreSelectors
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/typabs/typabs.selectors';
import * as TransactionStoreSelectors
  from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/transaction/transaction.selectors';
import {switchMap, takeUntil} from 'rxjs/operators';
import {Dictionary} from '@ngrx/entity';
import {
  ChrCtxabsClass
} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/models/chr-ctxabs.class';
import {AbsencesTools} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/chr-absence-tools';
import {Serialize} from 'cerialize';
import {
  DocumentManagementSystemService
} from '../../../../../../chronos/frontend-redesign/src/modules/document-management-system/services/document-management-system.service';
// import { Actions } from '@ngrx/effects';
import {
  AbsenceParameterNamesConstants,
  AbsenceValidationClass,
  Actions,
  ChrReturn,
  Ctxdata,
  GenericConstants,
  GlobalParam,
  HttpAbsencesResponse,
  Par,
  PaRow,
  Record as ChrRecord,
  Ressource,
  TypeUtils,
  Validation
} from '../../../../../../chronos/frontend-redesign/src/modules/common/classes';
import {ItemMode, ReturnType} from '../../../../../../chronos/frontend-redesign/src/modules/common/enums';
import {
  AbsTools,
  Exports,
  Times,
  Tools
} from '../../../../../../chronos/frontend-redesign/src/modules/common/namespaces';
import {ActionsClass, CsvData} from '../../../../../../chronos/frontend-redesign/src/modules/chronos-core/classes';
import {
  ChrDatePipe,
  ChrDecimalPipe,
  ChrGetMsgPipe,
  ChrGetTextPipe
} from '../../../../../../chronos/frontend-redesign/src/modules/chronos-core/pipes';
import {
  AppContext,
  ChrMainCommunicationService,
  ChrTranslation,
  ExportManager,
  Logger,
  SaveManager,
  SaveOnClose,
  TransactionState
} from '../../../../../../chronos/frontend-redesign/src/modules/chronos-core/services';
import {
  ChrScrollbarParentDirective
} from '../../../../../../chronos/frontend-redesign/src/modules/object-html/chr-scrollbar-offset';
import {ChrBrowseParam} from '../../../../../../chronos/frontend-redesign/src/modules/object-html/chr-browse';
import {
  ChrEmail,
  ChrMailManager,
  ChrMessagesManager
} from '../../../../../../chronos/frontend-redesign/src/modules/object-html/chr-messages-manager';
import {ChrFilter} from '../../../../../../chronos/frontend-redesign/src/modules/object-html/chr-filter';
import {
  TransactionStoreAction
} from '../../../../../../chronos/frontend-redesign/src/modules/chr-absence/store/transaction';
import {
  DmsConstants
} from '../../../../../../chronos/frontend-redesign/src/modules/common/classes/constants/dms-constants';
import {
  DocumentManagementSystemTools
} from '../../../../../../chronos/frontend-redesign/src/modules/document-management-system/tools/document-management-system.tools';
import {MatRadioChange} from '@angular/material/radio';

// FIXME: remove this if possible
declare var appelJS: any;
declare var ctx: any;

/**
 * composant principal de la transaction des absences
 */

@Component({
  selector: 'chr-absence',
  styleUrls: ['./store.component.scss'],
  templateUrl: './store.component.html',
  encapsulation: ViewEncapsulation.None
})
export class StoreComponent implements OnInit, OnDestroy, SaveOnClose {
  @ViewChild(ChrScrollbarParentDirective, {static: true}) public scrollbarDirective: ChrScrollbarParentDirective;
  @ViewChild('printTemplate') public printTemplate: ElementRef;
  @ViewChild('suppTotal') public suppTotal: MatCheckbox;

  @HostBinding('class.chr-absence')
  public applyHostClass = true;

  @Input() public jour: boolean;
  @Input() public horaire: boolean;
  @Input() public deb: string;
  @Input() public fin: string;

  @Input() public hideConfig: boolean;
  /**
   * Unique id for each transaction aka page
   * We need this in order to disambiguate all custom ids in case we have several absence transactions open.
   * Otherwise Angular is unable to attach events correctly. (cf bugfix yellow-3075)
   *  */

  @Input() public idTransac: number;

  public ctxtLoaded: boolean = false;
  public retAbs: HttpAbsencesResponse;
  public browseParamGroup: ChrBrowseParam = new ChrBrowseParam();
  public browseParamAbs: ChrBrowseParam = new ChrBrowseParam();
  public simpleselectMax: string[];
  public simpleselectMin: string[];
  public alerte: boolean = false;
  public readonly chrAbsMsg: ChrAbsenceMessages;
  public ngDestroyed$: Subject<boolean> = new Subject<boolean>();
  public typabsStock: Dictionary<ITypabsClass> = {};
  public ctxAbs: ChrCtxabsClass = new ChrCtxabsClass();
  public absValidation: AbsenceValidationClass;
  public envoiMail: string = '1';
  public clientMail: boolean = false;
  public ctxData: Ctxdata;
  public virtualizedAbsences: IAbsencesClass[];
  public autoSupp: boolean = true;
  public usrMnu: string;

  /**
   * tout selectionnner pour la suppression
   */
  public chkSupAll: boolean = false;
  public indeterminate: boolean = false;

  /**
   *  export vers excel car données particulières
   */
  public get exportToExcel(): boolean {
    return this.translation.exportExcel;
  }

  /**
   *  Affichage des niveaux de validation en mode imprimer
   */
  public toPrint: boolean = false;
  /**
   * avec ou sans rechargement de la population
   */
  private reloadPop: boolean;
  /**
   * selecteur pour le rechargement après validation
   */
  private callSelector: Subscription[];

  private isEnrss: boolean = false;

  private lstabsBoard: string;
  private nivminBoard: string;
  private nivmaxBoard: string;

  public canSave: boolean = true;

  private _dmsEnabled: boolean = false;

  private documentsAllowedAbsenceCodes: string[] = [];

  // FIXME: TransactionState exists in two places, rename one!
  public constructor(
    public state: TransactionState,
    private readonly mailManager: ChrMailManager,
    public messageManagerService: ChrMessagesManager,
    private readonly provider: ChrAbsenceProvider,
    public overlay: Overlay,
    public actions: ActionsClass,
    public localContext: AppContext,
    private readonly store: Store<ChrAbsenceState>,
    public readonly saveManager: SaveManager,
    private readonly chrFilter: ChrFilter,
    private readonly exportManager: ExportManager,
    public readonly chrTextPipe: ChrGetTextPipe,
    private readonly chrMessagePipe: ChrGetMsgPipe,
    private readonly chrDatePipe: ChrDatePipe,
    private readonly chrNumberPipe: ChrDecimalPipe,
    public translation: ChrTranslation,
    private readonly matdialog: MatDialog,
    private mainCommunication: ChrMainCommunicationService,
    private dmsService: DocumentManagementSystemService,
    private logger: Logger
  ) {
    this.reloadPop = false;
    this.chrAbsMsg = new ChrAbsenceMessages(this.chrTextPipe, this.chrMessagePipe);
  }

  /**
   * copie des data au chargement
   */
  private _initialAbsences: IAbsencesClass[] = [];

  /**
   * stockage des absences au chargement
   * sert à la comparaison à l'enregistrement pour les absences modifiées
   */
  public get initialAbsences(): IAbsencesClass[] {
    return this._initialAbsences;
  }

  public set initialAbsences(value: IAbsencesClass[]) {
    const arrayAbs: IAbsencesClass[] = [];
    value.forEach((abs: IAbsencesClass) => {
      arrayAbs.push(Tools.deepClone<IAbsencesClass>(abs));
    });
    this._initialAbsences = this._initialAbsences.concat(arrayAbs);
  }

  /**
   * concaténation des 2 types d'absences Heure et Période
   */
  public absences: IAbsencesClass[] = [];

  public ngOnInit(): void {
    this.store
      .pipe(select(TransactionStoreSelectors.loadingTransac))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((loading: boolean) => {
        this.state.setLoading(loading);
      });

    // récupération du contexte du ChronoBoard
    this.lstabsBoard = this.localContext.getCtxBoardToVAB('lstabs');
    this.nivminBoard = this.localContext.getCtxBoardToVAB('nivmin');
    this.nivmaxBoard = this.localContext.getCtxBoardToVAB('nivmax');
    // récupération du contexte
    this.getContext();

    // sélecteur du paramétrage des motifs d'absences
    this.store
      .pipe(select(TypabsStoreSelectors.entities))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((typabs: Dictionary<ITypabsClass>) => {
        this.typabsStock = typabs;
      });

    this.store
      .pipe(select(TransactionStoreSelectors.absences))
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe((abs: IAbsencesClass[]) => {
        this.absences = abs;
        this.fillIAbsence(this.absences);
        this.initialAbsences = this.absences;
        this.updateCheckScrollBar();
      });

    this.localContext.population
      .populationChange()
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe(() => {
        // BLUE-692 : [Absence] Lorsqu'on créé une absence sur une partie de la population, si, sans enregistrer on ajoute une personne de la population, alors les absences nouvellement créées disparaissent
        // appel du test de data en attente d'enregistrement
        this.isWaitingForRecord('save', [false], 'load_storeAbsences', [''], 'load_storeAbsences', ['']);
      });

    this.chrFilter.afterFilter().subscribe(() => {
      this.updateCheckScrollBar();
    });

    // rendere le bouton d'enregistrement enable/disable
    this.saveManager.afterChange().subscribe((hasDataToSave: boolean) => {
      if (hasDataToSave) {
        this.actions.setButtonEnableState('ENR');
      } else {
        this.actions.setButtonDisableState('ENR');
      }
    });
  }

  private updateCheckScrollBar(): void {
    // Vérification de la présence de scrollbars
    window.setTimeout(() => {
      this.checkScrollBar();
    }, 100);
  }

  /**
   * Appelle la fonction de vérification de la directive pour les scrollbars
   */
  private checkScrollBar(): void {
    if (this.scrollbarDirective) {
      this.scrollbarDirective.checkScrollBar();
    }
  }

  public ngOnDestroy(): void {
    this.saveContext();
    this.ngDestroyed$.next(true);
    this.ngDestroyed$.complete();
  }

  /**
   * Retourne un id unique pour chaque ligne d'absences avec le format MATRICULE-MOTIF-DEB-IDEB-FIN-IFIN
   *
   * @param absence : IAbsencesClass
   * @param idTransac: number, Unique id of this transaction. If we set an id explicitely it must be unique even with multiple absence transactions open.
   */
  public getLineId(absence: IAbsencesClass, idTransac: number): string {
    let id = '';
    if (absence) {
      id = absence.baseIdentifiantHtml + idTransac;
    }
    return id;
  }

  /**
   *  chargement des absences
   */
  public load_storeAbsences(): void {
    this.actions.setButtonDisableState('ENR');
    this.saveManager.clear();
    this.chkSupAll = false;
    this.indeterminate = false;
    // ajout des en-têtes pour les regroupements
    this.upateRegroupement();
    this.store.dispatch(new TransactionStoreAction.Fetch(this.ctxAbs));
  }

  /**
   * Maj par la date
   */
  public updateDateRange(): void {
    this.reloadPop = true;
    // rechargement des données
    this.refresh();
  }

  /***
   *
   * @param absence (IAbsencesClass)
   */
  public delete(absence: IAbsencesClass): void {
    if (!absence.isHoraire) {
      this.store.dispatch(new AbsPeriodeStoreActions.Remove(absence));
    } else {
      this.store.dispatch(new AbsHeureStoreActions.Remove(absence));
    }
    // gestion de l'état de la checkbox de la colonne de suppression
    this.etatCheckAll();
  }

  /**
   * Event provenant du chr-absence-line de la case à cocher de suppression
   * @param absence (IAbsencesClass)
   */
  public restore(absence: IAbsencesClass): void {
    if (!absence.isHoraire) {
      this.store.dispatch(new AbsPeriodeStoreActions.Restore(absence));
    } else {
      this.store.dispatch(new AbsHeureStoreActions.Restore(absence));
    }
    // gestion de l'état de la checkbox de la colonne de suppression
    this.etatCheckAll();
  }

  /**
   * Selectionne ou deselectionne toutes les lignes pour les supprimer
   * @param ev : MatCheckboxChange
   */
  public toggleDeleteAll(ev: MatCheckboxChange): void {
    // YELLOW-1519
    const absj: IAbsencesperiodeClass[] = this.chrFilter.cacheData
      .filter((a) => !a.isHoraire)
      .filter((a1: IAbsencesperiodeClass) => a1.canModify);
    const absh: IAbsenceshClass[] = this.chrFilter.cacheData
      .filter((a) => a.isHoraire)
      .filter((a1: IAbsenceshClass) => a1.canModify);
    if (ev.checked) {
      this.store.dispatch(new AbsPeriodeStoreActions.RemoveAll(absj));
      this.store.dispatch(new AbsHeureStoreActions.RemoveAll(absh));
    } else {
      this.store.dispatch(new AbsPeriodeStoreActions.RestoreAll(absj));
      this.store.dispatch(new AbsHeureStoreActions.RestoreAll(absh));
    }
    // gestion de l'état de la checkbox de la colonne de suppression
    this.etatCheckAll();
  }

  /**
   * enregistrement des données
   * @param fromPopup: boolean = false => si true alors appel de la méthode lors de la fermeture de la transaction
   * @param chevauchements?: Record[]
   */
  public save(fromPopup: boolean = false, chevauchements?: ChrRecord[]): Observable<boolean> {
    const afterSave: Subject<boolean> = new Subject<boolean>();

    if (this.saveManager.hasDataToSave() || chevauchements) {
      this.state.setLoading(true);
      const absToSave: { r: ChrRecord[] } = {r: []};
      // abs heure
      this.getAbsencesHtoSave(absToSave);
      // abs periode
      this.getAbsencesJtoSave(absToSave, chevauchements);
      // appel du thread d'enregistrement
      this.provider.putAbsences(JSON.stringify(absToSave), chevauchements === undefined).subscribe(
        (returnList: ChrReturn[]) => {
          this.nextSave(returnList, absToSave);
        },
        (error: string) => {
          this.setSnackError(error, this.chrAbsMsg.getMessage('err2'));
        },
        () => {
          if (fromPopup && fromPopup === true) {
            afterSave.next(true);
          } else {
            this.load_storeAbsences();
          }
          if (this.state.transmitter !== '') {
            this.state.transactionSaved(this.state.transmitter);
          }
        }
      );
    }
    if (this.suppTotal) {
      this.suppTotal.checked = false;
    }
    return afterSave as Observable<boolean>;
  }

  /**
   * Gestion du retour après enregistrement (next)
   * This is a success handler: BUT, there might be business errors
   * @param returnList: tableau de données renvoyées après enregistrement
   */
  private nextSave(returnList: ChrReturn[], absToSave: { r: ChrRecord[] }): void {
    this.saveManager.clear();
    // ici aiguillage selon la valeur de response[n].ret
    const errors: ChrReturn[] = returnList.filter((r) => r.ret === ReturnType.ERROR);
    const mails: ChrReturn[] = returnList.filter((r) => r.ret === ReturnType.MAIL);
    // si le type est SELECTION, alors les donnée sont dans 'mes'
    const selections: ChrReturn[] = returnList.filter((r) => r.ret === ReturnType.SELECTION);
    /**
     * erreurs
     */
    if (errors.length !== 0) {
      // We wait util the user closes the error list and then ask to treat the overlapping absences.
      this.callList(errors).subscribe(() => {
        this.overlapTreatment(selections, absToSave, mails);
      });
    } else {
      this.overlapTreatment(selections, absToSave, mails);
    }
  }

  /**
   * overlap treatment
   */
  private overlapTreatment(selections: ChrReturn[], absToSave: { r: ChrRecord[] }, mails: ChrReturn[]): void {
    const fromPopup: boolean = false;
    if (selections.length !== 0) {
      this.callChevauchement(selections, absToSave.r, fromPopup);
    }
    if (mails.length !== 0) {
      this.callMail(mails);
    }
  }

  /**
   * récupération des absences horaires à enregistrer
   * @param absToSave: absences horaires à enregistrer
   */
  private getAbsencesHtoSave(absToSave: { r: ChrRecord[] }): void {
    const abshToSave: {
      toCreate;
      toUpdate;
      toDelete;
    } = this.saveManager.getDataToSave<IAbsenceshClass>('absenceHeure');

    for (const abh in abshToSave.toDelete) {
      if (Tools.hasValue(abshToSave.toDelete[abh])) {
        absToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(abshToSave.toDelete[abh], 'ABSENCEH', 'delete', this.initialAbsences)
          )
        );
      }
    }

    for (const abh in abshToSave.toUpdate) {
      if (Tools.hasValue(abshToSave.toUpdate[abh])) {
        absToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(abshToSave.toUpdate[abh], 'ABSENCEH', 'update', this.initialAbsences)
          )
        );
      }
    }

    for (const abh in abshToSave.toCreate) {
      if (Tools.hasValue(abshToSave.toCreate[abh])) {
        absToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(abshToSave.toCreate[abh], 'ABSENCEH', 'create', this.initialAbsences)
          )
        );
      }
    }
  }

  /**
   * récupération des absences en jours à enregistrer
   * @param absenceToSave: absences jours à enregistrer
   * @param chevauchements: liste des absences en chevauchement
   */
  private getAbsencesJtoSave(absenceToSave: { r: ChrRecord[] }, chevauchements?: ChrRecord[]): void {
    const absencePeriodeToSave: {
      toCreate;
      toUpdate;
      toDelete;
    } = this.saveManager.getDataToSave<IAbsencesperiodeClass>('absencePeriode');
    let ordre: number = 0;
    for (const absenceToDelete in absencePeriodeToSave.toDelete) {
      if (Tools.hasValue(absencePeriodeToSave.toDelete[absenceToDelete])) {
        absenceToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(
              absencePeriodeToSave.toDelete[absenceToDelete],
              'ABSENCE',
              'delete',
              this.initialAbsences,
              ordre
            )
          )
        );
        ordre++;
      }
    }

    for (const absenceToUpdate in absencePeriodeToSave.toUpdate) {
      if (Tools.hasValue(absencePeriodeToSave.toUpdate[absenceToUpdate])) {
        absenceToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(
              absencePeriodeToSave.toUpdate[absenceToUpdate],
              'ABSENCE',
              'update',
              this.initialAbsences,
              ordre
            )
          )
        );
        ordre++;
      }
    }

    for (const absenceToCreate in absencePeriodeToSave.toCreate) {
      if (Tools.hasValue(absencePeriodeToSave.toCreate[absenceToCreate])) {
        absenceToSave.r.push(
          Serialize(
            AbsTools.setIAbsenceClassToRecord(
              absencePeriodeToSave.toCreate[absenceToCreate],
              'ABSENCE',
              'create',
              this.initialAbsences,
              ordre
            )
          )
        );
        ordre++;
      }
    }

    if (chevauchements) {
      absenceToSave.r = chevauchements;
    }
  }

  /**
   * Retourne les absences sans codPaye,
   * niveau de validation différent de 1 (ou 1 est dans la liste des niveau dispo)
   * et niveau inférieur au niveau de validation
   */
  public getAllAbsToValid(): IAbsencesClass[] {
    const absToReturn: IAbsencesClass[] = [];
    const dataToSave: IAbsencesClass[] = this.getAbsToCreate();

    for (const abs of this.chrFilter.cacheData.filter(
      (ab: IAbsencesClass) => ab.souhait !== this.absValidation.valide
    )) {
      if (
        dataToSave.find((ab) => ab.seq === abs.seq) ||
        !abs.canModify ||
        !abs.isValidable ||
        !Tools.isNullOrUndefined(abs.cp)
      ) {
        continue;
      }
      abs.souhait = this.absValidation.valide;
      absToReturn.push(abs);
    }
    return absToReturn;
  }

  /**
   * validation globale des absences
   */
  public validAbsAll(): void {
    // appel du test de data en attente d'enregistrement
    this.isWaitingForRecord('save', [false], 'validAbsAll_next', null, 'validAbsAll_next', null);
  }

  /**
   * mise à jour du niveau de validation et appel HTTP ngvalidabs.html
   * @param absences => tableau de IAbsencesClass
   * @option souhait
   */
  public validationAbsenceline(absences: IAbsencesClass[], souhait?: string): void {
    if (absences.length === 1) {
      const dataToSave: IAbsencesClass[] = this.getAbsToCreate();
      if (dataToSave.find((ab) => ab.seq === absences[0].seq)) {
        return;
      }
    }
    // appel du test de data en attente d'enregistrement
    this.isWaitingForRecord('save', [false], 'validationAbsence', [absences, souhait], 'validationAbsence', [
      absences,
      souhait
    ]);
  }

  /**
   * mise à jour du niveau de validation et appel HTTP ngvalidabs.html
   * @param absences => tableau de IAbsencesClass
   * @option souhait
   * @mail envoie de mail en mode pop
   */
  public validationAbsence(absences: IAbsencesClass[], souhait?: string, mail: boolean = false): void {
    this.callSelector = [];
    if (absences.length === 1) {
      if (!absences[0].isHoraire) {
        this.callSelector.push(
          this.store
            .pipe(select(AbsPeriodeStoreSelectors.loadingTransac))
            .pipe(takeUntil(this.ngDestroyed$))
            .subscribe((loading: boolean) => {
              this.state.setLoading(loading);
            })
        );

        this.store.dispatch(
          new AbsPeriodeStoreActions.Valid(
            absences[0],
            !souhait ? absences[0].souhait : souhait,
            this.absValidation,
            this.envoiMail,
            this.clientMail
          )
        );

        this.callSelector.push(
          this.store
            .pipe(select(AbsPeriodeStoreSelectors.refreshTransac))
            .pipe(takeUntil(this.ngDestroyed$))
            .subscribe((reload: boolean = false) => {
              this.removeAbsValidated(absences);
              this.callSelectorResponse(reload);
            })
        );
      } else {
        this.callSelector.push(
          this.store
            .pipe(select(AbsHeureStoreSelectors.loadingTransac))
            .pipe(takeUntil(this.ngDestroyed$))
            .subscribe((loading: boolean) => {
              this.state.setLoading(loading);
            })
        );

        this.store.dispatch(
          new AbsHeureStoreActions.Valid(
            absences[0],
            !souhait ? absences[0].souhait : souhait,
            this.absValidation,
            this.envoiMail,
            this.clientMail
          )
        );

        this.callSelector.push(
          this.store
            .pipe(select(AbsHeureStoreSelectors.refreshTransac))
            .pipe(takeUntil(this.ngDestroyed$))
            .subscribe((reload: boolean = false) => {
              this.removeAbsValidated(absences);
              this.callSelectorResponse(reload);
            })
        );
      }
    } else {
      this.store.dispatch(new TransactionStoreAction.ValidAll(absences, souhait, mail, this.envoiMail));

      this.callSelector.push(
        this.store
          .pipe(select(TransactionStoreSelectors.refreshTransac))
          .pipe(takeUntil(this.ngDestroyed$))
          .subscribe((reload: boolean | false) => {
            this.removeAbsValidated(absences);
            this.callSelectorResponse(reload);
          })
      );
    }
  }

  /**
   * retire du tableau d'absences, celles qui viennent d'être validées pour la mise à jour du niveau de validation
   * (YELLOW-747)
   * @param absences: absences qui viennent d'être validées
   */
  private removeAbsValidated(absences: IAbsencesClass[]): void {
    absences.forEach((ab: IAbsencesClass) => {
      const index = this.absences.indexOf(ab);
      if (index !== -1) {
        this.absences.splice(index, 1);
      }
    });
  }

  /**
   *
   * @param reload: boolean
   */
  private callSelectorResponse(reload: boolean): void {
    if (reload) {
      this.setTimeOutRefresh();
      this.state.transactionSaved(this.state.transmitter);
    }
  }

  /**
   * ouverture du formulaire de modification de l'absence
   * @param absence (IAbsencesClass)
   */
  public edit(absence: IAbsencesClass): void {
    /* Désactivation de la modification du formulaire si on n'a pas accès à l'enregistrement */
    if (!this.canSave) {
      absence.canModify = false;
    }
    const dialogRef: MatDialogRef<AbsencesDetailFormComponent> = this.matdialog.open(AbsencesDetailFormComponent, {
      data: {
        population: this.localContext.population,
        titre: this.chrTextPipe.transform("Modification d'absence"),
        typabsCommentTiTre: this.ctxData.params.get('ABSENCE_TITRE_COMMENTAIRE').valeur
          ? this.ctxData.params.get('ABSENCE_TITRE_COMMENTAIRE').valeur
          : '',
        condiGenTitre: this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur
          ? this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur.split(',')[0]
          : '',
        condiGenLien: this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur
          ? this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur.split(',')[1]
          : '',
        form: absence,
        fromAbsTranc: true,
        libValidation:
          this.absValidation.validations !== null && this.absValidation.validations.has(absence.souhait.toString())
            ? this.absValidation.validations.get(absence.souhait.toString()).libelle
            : '',
        listMotifAvecJustificatif: this.documentsAllowedAbsenceCodes,
        dmsEnabled: this.isDmsEnabled(),
        documentManagementSystemAuthorizedDocumentFormat: this.ctxData.params.get(
          AbsenceParameterNamesConstants.DMS_AUTHORIZED_DOCUMENT_FORMAT
        )?.valeur
      },
      width: '550px'
    });
    dialogRef.afterClosed().subscribe((result: { absence: IAbsencesClass; isHoraire: boolean; reload: boolean }) => {
      if (result) {
        if (result.isHoraire) {
          this.store.dispatch(new AbsHeureStoreActions.Upsert(result.absence));
        } else {
          this.store.dispatch(new AbsPeriodeStoreActions.Upsert(result.absence));
        }
      }
    });
  }

  /**
   * rechargement des données
   */
  public refresh(): void {
    // appel du test de data en attente d'enregistrement
    this.isWaitingForRecord('save', [false], 'refresh_next', [this.reloadPop], 'refresh_next', [this.reloadPop]);
  }

  /**
   * mise à jour du niveau mini
   * @param ev (MatSelectChange)
   */
  public updateMin(ev: MatSelectChange): void {
    this.ctxAbs.min = ev.value;
  }

  /**
   * mise à jour du niveau maxi
   * @param ev (MatSelectChange)
   */
  public updateMax(ev: MatSelectChange): void {
    this.ctxAbs.max = ev.value;
  }

  public changeTyp($event: MatRadioChange): void {
    switch ($event.value) {
      case 'ABSP,':
        this.ctxAbs.chkAbsh = false;
        this.ctxAbs.chkAbsj = true;
        break;
      case ',ABSH':
        this.ctxAbs.chkAbsh = true;
        this.ctxAbs.chkAbsj = false;
        break;
      default:
        this.ctxAbs.chkAbsh = true;
        this.ctxAbs.chkAbsj = true;
        break;
    }
    this.majCheckListItem();
  }

  /**
   * mise à jour des checkbox de la partie filtre Heure/Jour
   */
  public majCheckListItem(): void {
    const chks: string[] = [];
    chks[0] = this.ctxAbs.chkAbsj ? 'ABSP' : '';
    chks[1] = this.ctxAbs.chkAbsh ? 'ABSH' : '';
    this.ctxAbs.listitem = chks.join(',');
    if (!this.ctxAbs.chkAbsj && !this.ctxAbs.chkAbsh) {
      this.actions.setButtonDisableState('INS');
    } else {
      this.actions.setButtonEnableState('INS');
    }
    // ajout des en-têtes pour les regroupements
    this.upateRegroupement();
    // sauvegarde du contexte
    this.saveContext();
    // appel du test de data en attente d'enregistrement
    this.isWaitingForRecord('save', [false], 'load_storeAbsences', [''], 'load_storeAbsences', ['']);
  }

  /**
   * imprimer
   */
  public print(): void {
    this.toPrint = true;
    this.state.setLoading(true);
    this.state.setPrinting(true);
    requestAnimationFrame(() => {
      window.print();
      this.state.setPrinting(false);
      this.state.setLoading(false);
      this.toPrint = false;
    });
  }

  /**
   * formatage du suivi pour le print
   * @param absence (IAbsencesClass)
   */
  public getSuiviTxt(absence: IAbsencesClass): string {
    return this.chrTextPipe.transform(AbsencesTools.getSuiviTxt(absence));
  }

  /**
   * formatage codajp ou hdeb/hfin pour le print
   * @param absence (IAbsencesClass)
   * @param idebIfin => code ajp (pour abs jour) ou heure de début / heure de fin (pour abs heure)
   */
  public getIdebIfinTxt(absence: IAbsencesClass, idebIfin: string): string {
    if (absence && !absence.isHoraire) {
      return this.chrTextPipe.transform(AbsencesTools.getIdebIfinTxt(absence, idebIfin));
    } else {
      return AbsencesTools.getIdebIfinTxt(absence, idebIfin);
    }
  }

  /**
   * export Excel
   */
  public exportXls(): void {
    this.state.setLoading(true);
    this.state.setPrinting(true);
    // la colonne ressource devient "matricule" "nom" "prénom" donc il nous manquera 2 colonnes pour les colspans
    // de la ligne de regroupement
    // en fait plus qu'une car la colonne commentaire n'est pas exportée
    // il se peut cependant que le nombre de colonne soit déjà a 11, dans ce cas, on n'en ajoute aucune
    if (this.chrFilter.regroupementMainCell.colspan === 10) this.chrFilter.regroupementMainCell.colspan++;
    this.translation.enableExcelMode();
    requestAnimationFrame(() => {
      this.exportManager.xls(this.printTemplate, `${this.chrTextPipe.transform('absences')}_${Tools.ukey()}`);
      // on retire les deux colonnes précédemment ajoutées
      this.state.setPrinting(false);
      this.state.setLoading(false);
      this.translation.disableExcelMode();
      this.chrFilter.regroupementMainCell.colspan--;
    });
  }

  /**
   * export CSV
   */
  public exportCsv(): void {
    const csv: CsvData = new CsvData();
    // here Record is the ES5 property map we want
    const header: Record<string, string> = {};
    const entries: string[] = [
      'type',
      'mat',
      'nom',
      'pre',
      'cod',
      'lib',
      'deb',
      'sedb',
      'fin',
      'sfin',
      'j',
      's',
      'su',
      'v',
      'createUpdate',
      'workflow'
    ];
    const n2: number = 2;
    const n3: number = 3;
    const n4: number = 4;
    const n5: number = 5;
    const n6: number = 6;
    const n7: number = 7;
    const n8: number = 8;
    const n9: number = 9;
    const n10: number = 10;
    const n11: number = 11;
    const n12: number = 12;
    const n13: number = 13;
    const n14: number = 14;
    const n15: number = 15;
    header[entries[0]] = this.chrTextPipe.transform('Type');
    header[entries[1]] = this.chrTextPipe.transform('Matricule');
    header[entries[n2]] = this.chrTextPipe.transform('Nom');
    header[entries[n3]] = this.chrTextPipe.transform('Prénom');
    header[entries[n4]] = this.chrTextPipe.transform('Code');
    header[entries[n5]] = this.chrTextPipe.transform('Libellé');
    header[entries[n6]] = this.chrTextPipe.transform('Début');
    header[entries[n7]] = this.chrTextPipe.transform('Suite Début');
    header[entries[n8]] = this.chrTextPipe.transform('Fin');
    header[entries[n9]] = this.chrTextPipe.transform('Suite Fin');
    header[entries[n10]] = this.chrTextPipe.transform('J/J+1');
    header[entries[n11]] = this.chrTextPipe.transform('Suivi');
    header[entries[n12]] = this.chrTextPipe.transform('Suivi unité');
    header[entries[n13]] = this.chrTextPipe.transform('Validation');
    header[entries[n14]] = this.chrTextPipe.transform('Création - Modification');
    header[entries[n15]] = this.chrTextPipe.transform('Suivi de la validation');

    let i: number = 0;
    for (; i < entries.length; i++) {
      csv.addHeaders(header[entries[i]]);
    }
    this.chrFilter.cacheData.forEach((absence: IAbsencesClass) => {
      // on est bien sur une absence qui (objet qui doit avoir une séquence) et non pas sur un regroupement
      if (!Tools.isNullOrUndefined(absence.seq)) {
        const lineData: string[] = [];
        lineData.push(absence.item);
        lineData.push(absence.matricule);
        lineData.push(absence.nom);
        lineData.push(absence.prenom);
        lineData.push(absence.cod);
        lineData.push(absence.libabs);
        lineData.push(this.chrDatePipe.transform(absence.deb, 'shortDate'));
        lineData.push(this.getIdebIfinTxt(absence, absence.ideb));
        lineData.push(this.chrDatePipe.transform(absence.fin, 'shortDate'));
        lineData.push(this.getIdebIfinTxt(absence, absence.ifin));
        lineData.push(
          absence.typjrs === 'N' ? this.chrTextPipe.transform('J+1') : this.chrTextPipe.transform(absence.typjrs)
        );
        lineData.push(this.getValueFollow(absence.val));
        lineData.push(this.getUnitFollow(absence.val));
        lineData.push(
          this.absValidation.validations.has(absence.souhait.toString())
            ? this.absValidation.validations.get(absence.souhait.toString()).libelle
            : absence.souhait.toString()
        );
        lineData.push(this.getUpdateOrCreateInformationsLabel(absence, true));
        lineData.push(this.getValidationLabel(absence, true));
        csv.addLine(lineData);
      }
    });
    this.exportManager.generateCsv(csv, `${this.chrTextPipe.transform('absences')}_${Tools.ukey()}`);
  }

  /**
   * renvoie une chaine de caractères avec un espace non sécable à la fin
   * @param value => chaine de caractères
   */
  public putNbsp(value: string): string {
    return Exports.putNbsp(value);
  }

  /**
   * Renvoie la valeur du suivi des absences
   * Ne retourne que la valeur, pas l'unité
   * Formate la valeur pour les calculs (remplacer . par ,)
   */
  public getValueFollow(value: string): string {
    let valueFollow: string = '';
    if (Tools.hasValue(value)) {
      valueFollow = value.substring(0, value.length - 1).trim();
      valueFollow = valueFollow.replace(':', '.');
    }
    const unit: string = this.getUnitFollow(value);
    if (unit === 'J') {
      valueFollow = this.chrNumberPipe.transform(valueFollow);
    } else {
      valueFollow = this.chrNumberPipe.transform(valueFollow, 'hour');
    }
    return valueFollow;
  }

  /**
   * Renvoie l'unité du suivi des absences
   */
  public getUnitFollow(value: string): string {
    let unitFollow = '';
    if (Tools.hasValue(value)) {
      unitFollow = value.substring(value.length - 1);
    }
    return unitFollow;
  }

  /**
   * titre du print
   */
  public getCaption(): string {
    if (this.ctxAbs.chkAbsj && !this.ctxAbs.chkAbsh) {
      return this.chrMessagePipe.transform(
        'Tableau des absences en jours du $1 au $2',
        `${this.localContext.deb}|${this.localContext.fin}`
      );
    } else {
      if (!this.ctxAbs.chkAbsj && this.ctxAbs.chkAbsh) {
        return this.chrMessagePipe.transform(
          'Tableau des absences en heures du $1 au $2',
          `${this.localContext.deb}|${this.localContext.fin}`
        );
      } else {
        return this.chrMessagePipe.transform(
          'Tableau des absences du $1 au $2',
          `${this.localContext.deb}|${this.localContext.fin}`
        );
      }
    }
  }

  /**
   * Nom de la ressource du print
   */
  public getCaption1Ressource(): string {
    if (this.localContext.population.selectedRessources.length === 1) {
      const selectedRessource: Ressource = this.localContext.population.selectedRessources[0];
      return this.chrMessagePipe.transform(
        'Pour la ressource $1 $2 ($3)',
        `${selectedRessource.nom}|${selectedRessource.prenom}|${selectedRessource.matricule}`
      );
    }
    return '';
  }

  /**
   * ajouter d'une ou plusieurs absences depuis le formulaire absences-detail-form.component
   */
  public add(): void {
    const dialogRef: MatDialogRef<AbsencesDetailFormComponent> = this.matdialog.open(AbsencesDetailFormComponent, {
      data: {
        population: this.localContext.population,
        titre: this.chrTextPipe.transform("Création d'absence"),
        typabsCommentTiTre: this.ctxData.params.get('ABSENCE_TITRE_COMMENTAIRE').valeur
          ? this.ctxData.params.get('ABSENCE_TITRE_COMMENTAIRE').valeur
          : '',
        condiGenTitre: this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur
          ? this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur.split(',')[0]
          : '',
        condiGenLien: this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur
          ? this.ctxData.params.get('CONDITIONS_GEN_ABS').valeur.split(',')[1]
          : '',
        chkAbsenceHeure: this.ctxAbs.chkAbsh,
        chkAbsenceJour: this.ctxAbs.chkAbsj,
        topmat:
          this.localContext.population.selectedRessources.length === 1
            ? this.localContext.population.selectedRessources[0].matricule
            : '*',
        fromAbsTranc: true,
        listMotifAvecJustificatif: this.documentsAllowedAbsenceCodes,
        dmsEnabled: this.isDmsEnabled(),
        documentManagementSystemAuthorizedDocumentFormat: this.ctxData.params.get(
          AbsenceParameterNamesConstants.DMS_AUTHORIZED_DOCUMENT_FORMAT
        )?.valeur
      },
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      width: '550px'
    });
    dialogRef.afterClosed().subscribe((result: { absences: IAbsencesClass[]; isHoraire: boolean; reload: boolean }) => {
      if (result) {
        if (result.isHoraire) {
          this.store.dispatch(new AbsHeureStoreActions.AddMultiple(result.absences));
        } else {
          this.store.dispatch(new AbsPeriodeStoreActions.AddMultiple(result.absences));
        }
        if (result.reload) {
          // si CREER et CONTINUER
          this.add();
        }
      }
    });
  }

  /**
   * mise à jour des requêtes pour les browses
   */
  public setBrowseParam(): void {
    const ret: number = 1;
    const retaff: number = 2;
    // les browses
    this.browseParamGroup = new ChrBrowseParam();
    this.browseParamGroup.lab = `${this.chrAbsMsg.getMessage('cod')},${this.chrAbsMsg.getMessage('designation')}`;
    this.browseParamGroup.req = 'RUN:tpsgrpabs.p|$cod|$lib|undefined|undefined';
    this.browseParamGroup.bar = '*';
    this.browseParamGroup.ret = ret;
    this.browseParamGroup.retaff = retaff;

    this.browseParamAbs = new ChrBrowseParam();
    this.browseParamAbs.lab = `${this.chrAbsMsg.getMessage('cod')},${this.chrAbsMsg.getMessage('designation')}`;
    if (
      this.ctxData !== undefined &&
      this.ctxData.params
        .get('WEB_USER_LSTABSAFF')
        .valeur.toLowerCase()
        .trim() === 'true'
    ) {
      this.browseParamAbs.req = 'RUN:tpstypabsaffgrp.p|$cod|$lib|' + (this.ctxAbs.fgrp || 'UNDEFINED');
    } else {
      this.browseParamAbs.req = 'RUN:tpstypabsgrp.p|$cod|$lib|' + (this.ctxAbs.fgrp || 'UNDEFINED');
    }
    this.browseParamAbs.bar = '*';
    this.browseParamAbs.ret = ret;
    this.browseParamAbs.retaff = retaff;
  }

  /**
   * Nested function afin de déclencher la sauvegarde des raccourcis au rechargement de la transaction
   */
  public saveRacCtx(): void {
    const x2js: X2JS = new X2JS();
    let shortcuts: string = '';
    this.actions.shortcuts.forEach((shortcut: string, index: number) => {
      if (index < this.actions.shortcuts.length - 1) {
        shortcuts += shortcut + ',';
      } else {
        shortcuts += shortcut;
      }
    });
    // here Record is the ES5 property map we want
    const ctxRacAbs2Save: Record<string, unknown> = {
      ArrayOfracx: {
        racx: {
          lrac: shortcuts
        }
      }
    };
    const rac2save: string = x2js.js2xml(ctxRacAbs2Save);
    this.ctxData.params.get('WEB_CTX_SLNEWABSRAC').valeur = 'SLNEWABSRAC|' + rac2save;
    this.provider.putContext('SLNEWABSRAC', rac2save).subscribe({
      next: noop,
      error: (error) => this.logger.error(error),
      complete: noop
    });
  }

  /**
   * gestion de la proprité indeterminate de la checkbox de suppression globale
   */
  public etatCheckAll(): void {
    let count = 0;
    this.absences.forEach((abs: IAbsencesClass) => {
      if (abs.toDelete) {
        count++;
      }
    });
    if (count === this.absences.length) {
      this.chkSupAll = true;
      this.indeterminate = false;
    } else if (count <= 0) {
      this.chkSupAll = false;
      this.indeterminate = false;
    } else {
      this.chkSupAll = false;
      this.indeterminate = true;
    }
  }

  /**
   * ne pas pouvoir valider une absence créée mais pas encore enregistrée
   */
  public getAbsToCreate(): IAbsencesClass[] {
    const abshToSave: {
      toCreate;
    } = this.saveManager.getDataToSave<IAbsenceshClass>('absenceHeure');
    const abspToSave: {
      toCreate;
    } = this.saveManager.getDataToSave<IAbsencesperiodeClass>('absencePeriode');

    return [
      ...Object.values(abshToSave.toCreate as IAbsencesClass[]),
      ...Object.values(abspToSave.toCreate as IAbsencesClass[])
    ];
  }

  /**
   * Fonction permettant de tracker les items du ngFor en fonction de leur ID dans un but d'optimisation
   * @param index: number
   * @param item: IAbsencesClass
   */
  public trackById(index: number, item: IAbsencesClass): string {
    return item.seq;
  }

  /**
   *
   * @param souhait: number
   */
  public getInfosValidationForExcel(souhait: number): string {
    if (this.absValidation && this.absValidation.validations.has(souhait.toString())) {
      const magicTen: number = 10;
      return `${souhait} ${this.absValidation.validations.get(souhait.toString(magicTen)).libelle}`;
    }

    return `${souhait}`;
  }

  /**
   * récuparation des paramètres utiles à la transaction ainsi que du contexte
   */
  protected getContext(): void {
    const parametres: Map<string, string> = new Map<string, string>();
    parametres.set('NIVEAU_VALIDATION', 'C');
    parametres.set('WEB_USER_ENVOI_MAIL', 'C');
    parametres.set('WEB_USER_CLIENT_MAIL', 'L');
    parametres.set('ABSENCE_TITRE_COMMENTAIRE', 'C');
    parametres.set('PL_MATRICULE', 'C');
    parametres.set('WEB_CTX_SLNEWABS', 'C');
    parametres.set('WEB_CTX_SLNEWABSRAC', 'C');
    parametres.set('WEB_NGABSENCE_ACTIONS', 'P');
    parametres.set('WEB_USER_MENU', 'P');
    parametres.set('WEB_AUTSUPPABS', 'L');
    parametres.set('WEB_CTX_SLNEWABSH', 'C');
    parametres.set('WEB_CTX_SLNEWABSHRAC', 'C');
    parametres.set('CONDITIONS_GEN_ABS', 'C');
    parametres.set('WEB_EMAIL_NEW_FORM', 'L');
    parametres.set('EMAIL_ADRESSE', 'C');
    parametres.set('WEB_USER_LSTABSAFF', 'L');
    // Document Managment System
    parametres.set(AbsenceParameterNamesConstants.WEB_PROFIL_DMS_REG_ABS, 'C');
    parametres.set(DmsConstants.GESTION_DMS, 'L');
    parametres.set(AbsenceParameterNamesConstants.DMS_AUTHORIZED_DOCUMENT_FORMAT, 'C');

    this.provider
      .getCtxdata(JSON.stringify(new Par(parametres).value))
      .pipe(
        switchMap((ctxdata: Ctxdata) => {
          this._dmsEnabled = DocumentManagementSystemTools.getDmsStatus(ctxdata);
          if (this._dmsEnabled) {
            this.setDocumentsAllowedAbsenceCodes(ctxdata);
          }
          return of(ctxdata);
        })
      )
      .subscribe((ctxdata: Ctxdata) => {
        this.ctxData = ctxdata;
        // mise à jour des requêtes des browses, déplacé ici car on a besoinb de la valeur d'un paramètre
        this.setBrowseParam();
        this.processContext();
      });
  }

  /**
   * Alimente la liste des codes d'absences autorisant l'ajout de justificatifs.
   *
   * @param ctxdata
   * @returns
   */
  private setDocumentsAllowedAbsenceCodes(ctxdata: Ctxdata): void {
    this.dmsService
      .getDocumentsAllowedAbsenceCodes(ctxdata)
      .pipe(takeUntil(this.ngDestroyed$))
      .subscribe({
        next: (absencesCodes: string[]) => {
          this.documentsAllowedAbsenceCodes = absencesCodes;
        },
        error: (error: Error) => {
          this.logger.error(error);
          this.documentsAllowedAbsenceCodes = [];
        }
      });
  }

  /**
   * sauvegarde du contexte
   */
  protected saveContext(): void {
    const x2js: X2JS = new X2JS();
    /**
     * TODO à ajouter deb: Times.toDateIsoString(this.localContext.deb), fin: Times.toDateIsoString(this.localContext.fin), après modification du chr-date pour qu'il accepte du IsoDate
     *     // here Record is the ES5 property map we want
     */
    const ctxabs: Record<string, unknown> = {
      ArrayOfctxabsj: {
        ctxabsj: {
          deb: this.localContext.deb,
          fin: this.localContext.fin,
          fabs: this.ctxAbs.fabs,
          fgrp: this.ctxAbs.fgrp,
          min: this.ctxAbs.min,
          max: this.ctxAbs.max,
          col: this.ctxAbs.col,
          listitem: this.ctxAbs.listitem
        }
      }
    };
    const data: string = x2js.js2xml(ctxabs);
    if (this.state.transmitter === null || this.state.transmitter !== 'ALERTAGEVAB') {
      this.provider.putContext('SLNEWABS', data).subscribe();
    }
  }

  /**
   * mise à jour des propriétés du contexte, du menu et des actions
   */
  protected processContext(): void {
    const x2js: X2JS = new X2JS();
    const ctxSlNewAbs: GlobalParam = this.ctxData.params.get('WEB_CTX_SLNEWABS');
    const entry: string = 'ArrayOfctxabsj';
    this.absValidation = new AbsenceValidationClass(this.ctxData.params.get('NIVEAU_VALIDATION').valeur);
    if (!Tools.isNullOrUndefined(ctxSlNewAbs.valeur)) {
      try {
        this.ctxAbs = x2js.xml2js(ctxSlNewAbs.valeur.split('|').pop())[entry].ctxabsj;
      } catch {
        this.ctxAbs.deb = '';
        this.ctxAbs.fin = '';
      }
    }
    this.ctxAbs.deb = Times.dateOrToday(this.ctxAbs.deb, Times.dateFormat);
    this.ctxAbs.fin = Times.dateOrToday(this.ctxAbs.fin, Times.dateFormat);
    this.updateCtxAbs();

    const menuActions: string[] = this.getMenuActions();

    const strRaccourcis: string[] = this.getStrRaccourcis(x2js);

    const menuActInString: string = this.updateMenuActions(menuActions);

    /**
     * construction de la liste de raccourcis en fonction du paramétrage profil
     */
    if (!this.isEnrss) {
      if (strRaccourcis.indexOf('csv') !== -1) {
        strRaccourcis.splice(strRaccourcis.indexOf('csv'), 1);
      }
      if (strRaccourcis.indexOf('xls') !== -1) {
        strRaccourcis.splice(strRaccourcis.indexOf('xls'), 1);
      }
    }
    if (
      menuActions.indexOf('print') === -1 &&
      menuActions.indexOf('*') === -1 &&
      strRaccourcis.indexOf('print') !== -1
    ) {
      strRaccourcis.splice(strRaccourcis.indexOf('print'), 1);
    }

    this.buildActions(menuActInString, strRaccourcis);
    if (!this.actions.menus.has('ENR')) {
      this.canSave = false;
    }
    // Désactivation du bouton Valider si NIVEAU_VALIDATION ne contient qu'une seule entrée
    if (this.absValidation.niveaux.length <= 1) {
      this.actions.setButtonDisableState('VAL');
    }
    this.ctxtLoaded = true;
    // mise à jour des selects de niveaux de validation dans le filtre
    this.setParamHeader();
    // récupération des libellés des niveaux de validation
    this.getLibnivval();
    this.localContext.updatePopADate();
  }

  /**
   * mise à jour du ctxAbs
   */
  private updateCtxAbs(): void {
    /**
     * TODO: supprimer Times.toDateIsoString après modification du chr-date pour qu'il accepte du IsoDate
     * FIXME:
     */
    this.localContext.deb = this.deb || Times.toDateIsoString(Times.formatDate(this.ctxAbs.deb, Times.ISOdateFormat));
    this.localContext.fin = this.fin || Times.toDateIsoString(Times.formatDate(this.ctxAbs.fin, Times.ISOdateFormat));
    if (
      Tools.isNullOrUndefined(this.ctxAbs.listitem) ||
      this.ctxAbs.listitem.trim() === '' ||
      this.ctxAbs.listitem.replace(',', '').trim() === ''
    ) {
      this.ctxAbs.listitem = 'ABSP';
    }

    this.ctxAbs.chkAbsj = this.ctxAbs.listitem.indexOf('ABSP') > -1 || this.ctxAbs.listitem.indexOf('ABS') === -1;
    this.ctxAbs.chkAbsh = this.ctxAbs.listitem.indexOf('ABSH') > -1;

    if (this.jour) {
      this.ctxAbs.chkAbsj = true;
      this.ctxAbs.chkAbsh = false;
    } else if (this.horaire) {
      this.ctxAbs.chkAbsj = false;
      this.ctxAbs.chkAbsh = true;
    }

    // Si ouverture depuis ChronoBoard, on force les paramètres de motifs et niveaux
    if (
      this.lstabsBoard &&
      this.lstabsBoard !== '' &&
      this.nivminBoard &&
      this.nivminBoard !== '' &&
      this.nivmaxBoard &&
      this.nivmaxBoard !== ''
    ) {
      this.ctxAbs.fabs = this.lstabsBoard;
      this.ctxAbs.min = this.nivminBoard.toString();
      this.ctxAbs.max = this.nivmaxBoard.toString();
      this.ctxAbs.listitem = 'ABSP,ABSH';
    }

    this.updateMailAndAutoSupp();
  }

  /**
   * mise à jour des variables clientMail et autoSupp
   */
  private updateMailAndAutoSupp(): void {
    this.envoiMail = this.ctxData.params.get('WEB_USER_ENVOI_MAIL').valeur;
    if (
      this.ctxData.params.get('WEB_USER_CLIENT_MAIL').valeur &&
      this.ctxData.params
        .get('WEB_USER_CLIENT_MAIL')
        .valeur.toLowerCase()
        .trim() === 'true'
    ) {
      this.clientMail = true;
    }
    if (
      this.ctxData.params.get('WEB_AUTSUPPABS').valeur &&
      this.ctxData.params
        .get('WEB_AUTSUPPABS')
        .valeur.toLowerCase()
        .trim() === 'false'
    ) {
      this.autoSupp = false;
    }
    this.updateUserMenu();
  }

  /**
   * mise à jour de la variable usrMnu
   */
  private updateUserMenu(): void {
    if (!Tools.isNullOrUndefined(this.ctxData.params.get('WEB_USER_MENU').valeur)) {
      /**
       * il faut supprimer du web_user_menu les web_ctx_outils qui peuvent être placés n'importe ou
       */
      const usrMnuWithoutCtxOutils: string[] = this.ctxData.params
        .get('WEB_USER_MENU')
        .valeur.split(',')
        .filter((m) => m.indexOf('§') === -1);
      this.usrMnu = usrMnuWithoutCtxOutils.join(',');
      if (
        !Tools.isNullOrUndefined(this.usrMnu) &&
        this.usrMnu.indexOf('ABH') !== -1 &&
        this.usrMnu.indexOf('ABS') === -1
      ) {
        this.ctxAbs.chkAbsh = true;
        this.ctxAbs.chkAbsj = false;
        this.ctxAbs.listitem = ',ABSH';
      } else if (
        !Tools.isNullOrUndefined(this.usrMnu) &&
        this.usrMnu.indexOf('ABH') === -1 &&
        this.usrMnu.indexOf('ABS') !== -1
      ) {
        this.ctxAbs.chkAbsj = true;
        this.ctxAbs.chkAbsh = false;
        this.ctxAbs.listitem = 'ABSP,';
      }
    } else {
      this.usrMnu = '';
    }
  }

  /**
   * récupération des actions du menu
   */
  private getMenuActions(): string[] {
    let menuActions: string[];
    if (!Tools.isNullOrUndefined(this.ctxData.params.get('WEB_NGABSENCE_ACTIONS').valeur)) {
      menuActions = this.ctxData.params
        .get('WEB_NGABSENCE_ACTIONS')
        .valeur.split('|')[0]
        .split(',');
    } else {
      menuActions = ['*'];
    }
    if (menuActions.indexOf('ENRSS') !== -1) {
      this.isEnrss = true;
      menuActions.splice(menuActions.indexOf('ENRSS'), 1);
    }
    if (menuActions.indexOf('APE') !== -1) {
      const index: number = menuActions.indexOf('APE');
      menuActions[index] = 'print';
    }
    /* Pas d'insertion possible si on n'a pas accès à l'enregistrement */
    if (menuActions.indexOf('ENR') === -1 && menuActions.indexOf('INS') !== -1) {
      menuActions.splice(menuActions.indexOf('INS'));
    }
    return menuActions;
  }

  /**
   * variable mise à jour et contenant les actions du menu
   * @param menuActions : variable contenant les actions du menu
   */
  private updateMenuActions(menuActions: string[]): string {
    // TODO: Enlever HLP de la liste lorsque l'aide en ligne sera accessible
    const unImplemented: string[] = ['ANN', 'MAIL'];

    unImplemented.forEach((action) => {
      if (menuActions.indexOf(action) !== -1) {
        menuActions.splice(menuActions.indexOf(action), 1);
      }
    });

    let menuActInString: string = menuActions.join(',');
    if (menuActions.indexOf('REC') === -1 && menuActions.indexOf('*') === -1) {
      menuActions.unshift('REC');
    }

    if (menuActInString === '*' || menuActions === undefined) {
      menuActInString = 'REC,INS,ENR,VAL,RAP,print,HLP';
      this.isEnrss = true;
    }

    return menuActInString;
  }

  /**
   * création des actions
   * @param menuActInString: actions
   * @param strRaccourcis: raccourcis
   * @param isEnrss: présence ou non de l'ancienne action "Enregistrer sous"
   */
  private buildActions(menuActInString: string, strRaccourcis: string[]): void {
    const actions: Actions = new Actions();
    menuActInString.split(',').forEach((act: string) => {
      const paRow: PaRow = new PaRow();
      paRow.actions = act;
      paRow.dossier = 'false';
      paRow.label = '';
      actions.dossiers.push(paRow);
      actions.actionList.set(act, TypeUtils.getFunctionFromAction(act));
    });
    this.actions.shortcuts = [];
    if (actions.actionList.has('REC')) {
      this.actions.locals.set('REC', {function: 'refresh'});
    }
    if (actions.actionList.has('ENR')) {
      this.actions.locals.set('ENR', {function: 'save'});
    }
    if (actions.actionList.has('INS')) {
      this.actions.locals.set('INS', {function: 'add'});
    }
    if (actions.actionList.has('VAL')) {
      this.actions.locals.set('VAL', {function: 'validAbsAll'});
    }
    if (actions.actionList.has('RAP')) {
      this.actions.locals.set('RAP', {function: 'rapPredef'});
    }
    if (actions.actionList.has('CSV')) {
      this.actions.locals.set('CSV', {function: 'exportCsv', args: ['absences']});
    }
    if (actions.actionList.has('XLS')) {
      this.actions.locals.set('XLS', {function: 'exportXls', args: ['absences']});
    }
    /* Pour gérer la version antérieure, ENRSS est remplacé par XLS et CSV dans le menu et les fonctions associées sont ajoutées */
    if (this.isEnrss) {
      this.actions.locals.set('csv', {function: 'exportCsv', args: ['absences']});
      this.actions.locals.set('xls', {function: 'exportXls', args: ['absences']});
      actions.actionList.set('csv', TypeUtils.getFunctionFromAction('CSV'));
      actions.actionList.set('xls', TypeUtils.getFunctionFromAction('XLS'));
      actions.dossiers.push({
        actions: ['csv', 'xls'],
        label: 'Exports',
        dossier: 'true'
      });
    }
    this.actions.locals.set('print', {function: 'print'});
    this.actions.locals.set('pdf', {args: ['absences']});
    strRaccourcis = strRaccourcis.filter((val) => Array.from(actions.actionList.keys()).includes(val));

    this.actions.buildMenuAndShortcuts(actions, strRaccourcis.join(','), this);
  }

  /**
   * récupération des raccourcis
   * @param x2js: converteur XMl to object javascript
   */
  private getStrRaccourcis(x2js: X2JS): string[] {
    let strRaccourcis: string[] = [];
    const entryArray: string = 'ArrayOfracx';
    const entryArray1: string = 'racx';
    const entryArray2: string = 'lrac';
    if (!Tools.isNullOrUndefined(this.ctxData.params.get('WEB_CTX_SLNEWABSRAC').valeur)) {
      strRaccourcis = x2js
        .xml2js(
          this.ctxData.params
            .get('WEB_CTX_SLNEWABSRAC')
            .valeur.split('|')
            .pop()
        )
        [entryArray][entryArray1][entryArray2].split(',');
    } else {
      strRaccourcis = [];
    }
    /**
     * conversion de l'ancien contexte
     */
    if (strRaccourcis.indexOf('ENRSS') !== -1) {
      // vieux paramétrage
      strRaccourcis.splice(strRaccourcis.indexOf('ENRSS'), 1, 'csv');
      strRaccourcis.splice(strRaccourcis.indexOf('ENRSS'), 0, 'xls');
    }
    if (strRaccourcis.indexOf('APE') !== -1) {
      // vieux paramétrage
      strRaccourcis.splice(strRaccourcis.indexOf('APE'), 1, 'print');
    }
    return strRaccourcis;
  }

  /**
   * timeout avant rechargement sinon appel ngtransacabsences avant ngvalidabs
   */
  private setTimeOutRefresh(): void {
    const timeOut: number = 2000;
    setTimeout(() => {
      this.refresh_next(this.reloadPop);
    }, timeOut);
    if (this.callSelector) {
      this.callSelector.forEach((r: Subscription) => r.unsubscribe());
    }
  }

  /**
   * Envoi de mail depuis le menu ou les raccourcis
   */
  private mail(): void {
    this.mailManager.mail('abs', 'CHRONOS - ' + this.chrTextPipe.transform('ABSENCES'));
  }

  /**
   * suite de la validation globale après test isWaitingForRecord
   */
  private validAbsAll_next(): void {
    this.messageManagerService
      .confirm({message: this.chrAbsMsg.getMessage('wait4'), interfaceColor: 'abs'})
      .subscribe((data: boolean) => {
        if (data) {
          /*  sion est sur plusierus matricule, alors demande d'envoi de mail */
          const allAbsToVal: IAbsencesClass[] = this.getAllAbsToValid();
          const pop = this.getIndividualOrPop(allAbsToVal);
          if (this.envoiMail === '1' && pop) {
            this.validAbsAll_And_Mail(allAbsToVal);
          } else {
            this.validationAbsence(allAbsToVal, this.absValidation.valide.toString(), false);
          }
        }
      });
  }

  /**
   * validation concerne un matricule ou plusieurs
   * @param allAbsToVal: liste des absences qui ont été validées
   */
  private getIndividualOrPop(allAbsToVal: IAbsencesClass[]): boolean {
    let pop = false;
    let prevmat: string = '';
    for (const abs of allAbsToVal) {
      if (prevmat === '') {
        prevmat = abs.matricule;
      }
      if (!pop) {
        pop = prevmat !== abs.matricule;
      }
    }
    return pop;
  }

  /**
   * suite de la validation globale après test validAbsAll_next
   * @param allAbsToVal: liste des absences
   */
  private validAbsAll_And_Mail(allAbsToVal: IAbsencesClass[]): void {
    this.messageManagerService
      .confirm({message: this.chrAbsMsg.getMessage('wait5'), interfaceColor: 'abs'})
      .subscribe((data: boolean) => {
        this.validationAbsence(allAbsToVal, this.absValidation.valide.toString(), data || false);
      });
  }

  /**
   * transformation des absences en ChrRecord pour la méthode Save
   * @param absToSave => Dictionary<IAbsenceClass>
   * @param type => ABSENCE ou ABSENCEH
   * @param action => create, update ou delete
   */
  private setIAbsenceClassToRecord(absToSave: IAbsencesClass, type: string, action: string): ChrRecord {
    const oabAbs: IAbsencesClass = this.initialAbsences.find((abs) => abs.seq === absToSave.seq);
    const r: ChrRecord = new ChrRecord(absToSave.matricule);
    const magicNumber: number = 2;
    r.code = action === 'delete' ? '' : absToSave.cod;
    r.t = type;
    r.mod = magicNumber;
    r.nop = '1';
    r.com = absToSave.cmt;
    r.seq = action === 'create' ? '' : absToSave.seq;

    if (r.t === 'ABSENCEH') {
      r.deb = Times.hhmm(absToSave.ideb);
      r.fin = Times.hhmm(absToSave.ifin);
      r.dat = Times.formatDate(absToSave.deb, Times.ISOdateFormat);

      if (oabAbs && action !== 'create') {
        r.odeb = Times.formatDate(oabAbs.deb, Times.ISOdateFormat);
        r.ofin = Times.formatDate(oabAbs.fin, Times.ISOdateFormat);
        r.ohdeb = Times.hhmm(oabAbs.ideb);
        r.ohfin = Times.hhmm(oabAbs.ifin);
        r.ocod = oabAbs.cod;
      }
    }

    if (r.t === 'ABSENCE') {
      r.adeb = absToSave.ideb;
      r.afin = absToSave.ifin;
      r.ddeb = Times.formatDate(absToSave.deb, Times.ISOdateFormat);
      r.dfin = Times.formatDate(absToSave.fin, Times.ISOdateFormat);

      if (oabAbs && action !== 'create') {
        r.odeb = Times.formatDate(oabAbs.deb, Times.ISOdateFormat);
        r.ofin = Times.formatDate(oabAbs.fin, Times.ISOdateFormat);
        r.oadeb = oabAbs.ideb;
        r.oafin = oabAbs.ifin;
        r.ocod = oabAbs.cod;
      }
    }
    return r;
  }

  /***
   * appel des actions externes
   * @param action (ex: RAP = rapports prédéfinis, HLP = aide, MAIL = mail!!!)
   */
  private appeljs(action: string): void {
    ctx = 'newabs';
    const deb: string = Times.formatDate(this.localContext.deb, Times.dateFormat);
    const fin: string = Times.formatDate(this.localContext.fin, Times.dateFormat);
    const lstmat: string = this.localContext.population.jslstmat;
    const lstmatsel: string = this.localContext.population.jslstmatsel;
    appelJS(action, deb, fin, lstmat, lstmatsel, '', '', '', this.idTransac);
  }

  /**
   * raffraichissement des données avec ou sans reload de la population
   * @param reloadPop (true / false)
   */
  private refresh_next(reloadPop: boolean): void {
    this.alerte = false;
    this.saveManager.clear();
    if (this.ctxAbs.max >= this.ctxAbs.min) {
      this.saveRacCtx();
      this.saveContext();
      if (reloadPop) {
        this.localContext.updatePopADate();
      } else {
        this.load_storeAbsences();
      }
    }
    this.reloadPop = false;
    this.translation.disableExcelMode();
  }

  /**
   * envoi d'une erreur et d'un message vers la snackbar Error
   * @param err: string
   * @param msg: string
   */
  private setSnackError(err: string, msg: string): void {
    if (!Tools.isNullOrUndefined(err) && !Tools.isEmpty(err)) {
      msg = err.concat(': ').concat(msg);
    }
    this.messageManagerService.snackBar({message: `${msg}`, mode: 'error'});
  }

  /**
   * envoi d'un message vers la snackbar Info
   * @param msg: string
   */
  private setSnackInfo(msg: string): void {
    this.messageManagerService.snackBar({message: `${msg}`, mode: 'info'});
  }

  /**
   * envoi d'un message vers la snackbar Warning
   * @param msg: string
   */
  private setSnackWarning(msg: string): void {
    this.messageManagerService.snackBar({message: `${msg}`, mode: 'warning'});
  }

  /**
   * envoi d'un message vers la snackbar Success
   * @param msg: string
   */
  private setSnackSuccess(msg: string): void {
    this.messageManagerService.snackBar({message: `${msg}`, mode: 'success'});
  }

  /**
   * mise à jour des selects de niveaux de validation dans le filtre
   */
  private setParamHeader(): void {
    // mettre a jour les dates
    // les select simple
    let i: number = 0;
    const niveauxDeValidation: number = 9;
    this.simpleselectMin = [];
    this.simpleselectMax = [];
    for (; i <= niveauxDeValidation; i++) {
      this.simpleselectMin.push(i.toString());
      this.simpleselectMax.push(i.toString());
    }
  }

  /**
   * récupération des libellés des niveaux de validation de la table de correspondance ABSNIVTIT
   */
  private getLibnivval(): void {
    this.provider.getLibnivval().subscribe(
      (response: Validation[]) => {
        response.forEach(
          (validation: Validation) => (validation.libelle = this.chrTextPipe.transform(validation.libelle))
        );
        this.absValidation.initData(response);
      },
      (err: string) => {
        this.setSnackError(err, this.chrAbsMsg.getMessage('err4'));
      }
    );
  }

  /**
   * test s'il y a des données en attente d'enregistrement. Si c'est le cas, ouverture de la fenêtre de demande de confirmation d'action
   * @param funcYes?: string
   * @param argsYes?: any[]
   * @param funcNo?: string
   * @param argsNo?: any[]
   * @param funcNoDataToSave?: string
   * @param argsNoDataToSave?: any[]
   */
  private isWaitingForRecord(
    funcYes?: string,
    argsYes?: any[],
    funcNo?: string,
    argsNo?: any[],
    funcNoDataToSave?: string,
    argsNoDataToSave?: any[]
  ): void {
    if (this.canSave && this.saveManager.hasDataToSave()) {
      this.messageManagerService.confirm({interfaceColor: 'abs'}).subscribe((data: boolean) => {
        if (data) {
          this[funcYes](...(argsYes || []));
        } else {
          if (funcNo) {
            this[funcNo](...(argsNo || []));
          }
        }
      });
    } else {
      if (funcNoDataToSave) {
        this[funcNoDataToSave](...(argsNoDataToSave || []));
      }
    }
  }

  /**
   * Retourne les propriété liées a la ressource
   * @param abs: IAbsencesClass
   */
  private getRess(abs: IAbsencesClass): IAbsencesClass {
    if (Tools.isNullOrUndefined(abs.ressource) || abs.ressource === '') {
      const ressource: Ressource = this.localContext.population.getMat(abs.matricule);
      if (ressource) {
        abs.nom = ressource.nom;
        abs.prenom = ressource.prenom;
        abs.ressource = `${ressource.nom} ${ressource.prenom}`;
      }
    }
    return abs;
  }

  /**
   * Remplir le code couleur et le libellé si besoin
   * @param abs: IAbsencesClass
   */
  private getTypAbs(abs: IAbsencesClass): IAbsencesClass {
    if (Tools.isNullOrUndefined(abs.codabsColorClass) || abs.codabsColorClass === '') {
      abs.codabsColorClass = this.typabsStock[abs.cod].numcol;
    }
    if (Tools.isNullOrUndefined(abs.libabs) || abs.libabs === '') {
      const param: string = this.typabsStock[abs.cod].libabs;
      if (param) {
        abs.libabs = param;
      }
    }
    /* On vérifie que l'absence est modifiable via LISTE_ABSENCE */
    if (
      this.typabsStock &&
      this.typabsStock[abs.cod] &&
      !Tools.isNullOrUndefined(this.typabsStock[abs.cod].inlistabs)
    ) {
      abs.canModify = this.typabsStock[abs.cod].inlistabs;
    } else {
      abs.canModify = true;
    }
    return abs;
  }

  /**
   * retour du FETCH pour initialisation des données
   * @param abss: IAbsenceshClass[] | IAbsencesperiodeClass[]
   */
  private fillIAbsence(abss: IAbsenceshClass[] | IAbsencesperiodeClass[]): void {
    const absences: IAbsencesClass[] = [];
    const demandeAnnulation: string = '10';
    Object.assign(absences, abss);
    absences.forEach((abs: IAbsencesClass) => {
      abs.item = abs.isHoraire ? this.chrTextPipe.transform(ItemMode.HEURE) : this.chrTextPipe.transform(ItemMode.JOUR);
      this.getTypAbs(abs);
      this.getRess(abs);
      this.setAbsFilterValue(abs);
      abs.souFilterValue = this.absValidation.validations.has(abs.souhait.toString())
        ? this.absValidation.validations.get(abs.souhait.toString()).libelle
        : abs.souhait.toString();
      if (!Tools.isNullOrUndefined(abs.cp) && this.absValidation?.validations.has(demandeAnnulation)) {
        abs.souFilterValue = this.absValidation.validations.get(demandeAnnulation).libelle;
      }
      /* Si l'absence est modifiable, on contrôle le niveau de validation */
      if (abs.canModify) {
        abs.canModify =
          (abs.souhait === 1 && this.absValidation.invalide === 1) || abs.souhait <= this.absValidation.valide;
      }
      this.setAbsIsValidable(abs);
    });
  }

  /**
   * mise à jour de la propriété isValidable de l'absence
   * @param abs: absence
   */
  private setAbsIsValidable(abs: IAbsencesClass): IAbsencesClass {
    abs.isValidable = true;
    if (
      abs.souhait > this.absValidation.valide ||
      this.absValidation.niveaux.length === 1 ||
      (abs.souhait === 1 && this.absValidation.invalide !== 1) ||
      Times.compareISODate(abs.deb, this.localContext.clo) <= 0
    ) {
      abs.isValidable = false;
    }
    // inlistabs = code abs fait partie du liste_absences
    if (this.typabsStock && this.typabsStock[abs.cod] && this.typabsStock[abs.cod].inlistabs && abs.isValidable) {
      abs.isValidable = this.typabsStock[abs.cod].inlistabs.toString().trim() === 'true';
    }
    return abs;
  }

  /**
   * mise à jour des propriétés FilterValue de l'absence
   * @param abs: absence
   */
  private setAbsFilterValue(abs: IAbsencesClass): IAbsencesClass {
    if (abs.isHoraire) {
      abs.idebFilterValue = Times.formatHoraire(
        abs.ideb >= '24.00' ? Times.remove24hours(abs.ideb.replace('.', ':')) : abs.ideb
      );
      abs.ifinFilterValue = Times.formatHoraire(
        abs.ifin >= '24.00' ? Times.remove24hours(abs.ifin.replace('.', ':')) : abs.ifin
      );
      abs.typjrsFilterValue = abs.typjrs === 'N' ? 'J+1' : abs.typjrs;
    } else {
      abs.idebFilterValue = this.chrTextPipe.transform(AbsencesTools.getIdebIfinTxt(abs, abs.ideb));
      abs.ifinFilterValue = this.chrTextPipe.transform(AbsencesTools.getIdebIfinTxt(abs, abs.ifin));
      abs.typjrsFilterValue = abs.typjrs;
    }
    return abs;
  }

  /**
   * ouverture de la dialog MAIL
   * @param infoMail: ChrReturn[]
   */
  private callMail(infoMail: ChrReturn[]): void {
    this.provider.getEmail(infoMail).subscribe((mail: ChrEmail[]) => {
      this.mailManager.afficheMail('abs', mail[0], infoMail);
    });
  }

  /**
   * Ouverture de la dialog CHEVAUCHEMENT
   * @param selections: ChrReturn[]
   * @param absToSave: ChrReturn[]
   * @param frompopup: boolean
   */
  private callChevauchement(selections: ChrReturn[], absToSave: ChrRecord[], frompopup: boolean): void {
    const absToForce: ChrRecord[] = [];
    this.messageManagerService
      .selection({returns: selections, interfaceColor: 'abs', mode: 'question', contexte: this.localContext})
      .subscribe((selectedList: ChrReturn[]) => {
        selectedList.forEach((selectedOne: ChrReturn) => {
          const abs: ChrRecord = absToSave.find(
            (a) =>
              a.t === selectedOne.t &&
              a.m === selectedOne.mat &&
              a.ddeb === selectedOne.datd &&
              a.adeb === selectedOne.ajpd
          );
          if (abs !== undefined) {
            abs.dfin = abs.dfin !== selectedOne.datf ? selectedOne.datf : abs.dfin;
            absToForce.push(abs);
          }
        });
        if (absToForce.length !== 0) {
          this.save(frompopup, absToForce);
        }
      });
  }

  /**
   * Ouverture de la dialog ERRORS
   * returns an observable to signal that the user closed it.
   * @param liste: ChrReturn[]
   */
  private callList(liste: ChrReturn[]): Observable<boolean> {
    return this.messageManagerService.list({
      returns: liste,
      interfaceColor: 'abs',
      mode: 'error',
      contexte: this.localContext
    });
  }

  /**
   * regroupement ajout des en-têtes
   */
  private upateRegroupement(): void {
    this.chrFilter.addCol('item', {label: this.chrTextPipe.transform('Type'), width: '70px'});
    if (this.localContext.population.isCollectif && !this.exportToExcel) {
      this.chrFilter.addCol('ressource', {label: this.chrTextPipe.transform('Ressource'), width: 'auto'});
    } else {
      this.chrFilter.removeCol('ressource');
    }
    this.chrFilter.addCol('cod', {label: this.chrTextPipe.transform('Code'), width: 'auto'});
    this.chrFilter.addCol('libabs', {label: this.chrTextPipe.transform('Libellé'), width: 'auto'});
    this.chrFilter.addCol('deb', {label: this.chrTextPipe.transform('Début'), width: 'auto'});
    this.chrFilter.addCol('idebFilterValue', {label: this.chrTextPipe.transform('Suite Début'), width: 'auto'});
    this.chrFilter.addCol('fin', {label: this.chrTextPipe.transform('Fin'), width: 'auto'});
    this.chrFilter.addCol('ifinFilterValue', {label: this.chrTextPipe.transform('Suite Fin'), width: 'auto'});
    if ((this.ctxAbs.chkAbsh && this.ctxAbs.chkAbsj) || (this.ctxAbs.chkAbsh && !this.ctxAbs.chkAbsj)) {
      this.chrFilter.addCol('typjrsFilterValue', {label: this.chrTextPipe.transform('J/J+1'), width: 'auto'});
    } else {
      this.chrFilter.removeCol('typjrsFilterValue');
    }
    this.chrFilter.addCol('val', {label: this.chrTextPipe.transform('Suivi'), width: 'auto'});
    this.chrFilter.addCol('typ', {label: this.chrTextPipe.transform('Unité'), width: 'auto'});
    this.chrFilter.addCol('souFilterValue', {label: this.chrTextPipe.transform('Validation'), width: 'auto'});
  }

  public appelAide(): void {
    this.localContext.help('newabs');
  }

  /**
   * Appel la fonction qui intégrera le programme html5 dans une pop in
   */
  private rapPredef(): void {
    this.mainCommunication.appelJS(
      'RAP',
      this.localContext.population.cod,
      this.localContext.mat,
      this.localContext.debaff,
      this.localContext.finaff,
      this.localContext.population.selectedMat.join(GenericConstants.COMMA_SEPARATOR),
      this.localContext.population.selectedMat.join(GenericConstants.COMMA_SEPARATOR),
      '',
      '',
      '',
      this.idTransac,
      'abs'
    );
  }

  /**
   * Return if the population is collective or not
   * @returns boolean
   */
  public isPopulationCollective(): boolean {
    const isCollective: boolean = this.localContext.population.isCollectif;
    return isCollective;
  }

  /**
   * returns the formatted string to show who created the absence or modified it at last
   *
   * @param absence
   * @param cutTags allow the user to return the string without html tags
   * @returns
   */
  public getUpdateOrCreateInformationsLabel(absence: IAbsencesClass, cutTags: boolean = false): string {
    let updateOrCreateInformationsLabel: string = '';
    if (
      Tools.hasValue(absence) &&
      Tools.hasValue(absence.matricule) &&
      Tools.hasValue(absence.ressource) &&
      Tools.hasValue(absence.dcr)
    ) {
      const absenceCreationDate: Date = new Date(absence.dcr);
      const formattedAbsenceCreationDateString: string = Times.formatDate2(absenceCreationDate, 'DD/MM/YYYY');
      if (!cutTags) {
        updateOrCreateInformationsLabel = this.chrMessagePipe.transform(
          '<i>Par :</i> $1 ($2)<i>, le :</i> <b>$3</b>',
          `${absence.labelUserCreation}|${absence.ucr}|${formattedAbsenceCreationDateString}`
        );
      } else {
        updateOrCreateInformationsLabel = updateOrCreateInformationsLabel = this.chrMessagePipe.transform(
          'Par : $1 ($2), le : $3',
          `${absence.labelUserCreation}|${absence.ucr}|${formattedAbsenceCreationDateString}`
        );
      }
    }

    return updateOrCreateInformationsLabel;
  }

  /**
   * returns the formatted string to show the workflow of the absence
   *
   * @param absence
   * @param cutTags allow the user to return the string without html tags
   * @returns
   */
  public getValidationLabel(absence: IAbsencesClass, cutTags: boolean = false): string {
    let validationLabel: string = '';
    if (
      Tools.hasValue(absence) &&
      Tools.hasValue(absence.matricule) &&
      Tools.hasValue(absence.ressource) &&
      Tools.hasValue(absence.dvl)
    ) {
      const absenceValidationDate: Date = new Date(absence.dvl);
      const formattedAbsenceValidationDateString: string = Times.formatDate2(absenceValidationDate, 'DD/MM/YYYY');
      if (!cutTags) {
        validationLabel = this.chrMessagePipe.transform(
          `<i>$1 par :</i> $2 ($3)<i>, le :</i> <b>$4</b>`,
          `${absence.souFilterValue}|${absence.labelUserValidation}|${absence.uvl}|${formattedAbsenceValidationDateString}`
        );
      } else {
        validationLabel = this.chrMessagePipe.transform(
          `$1 par : $2 ($3), le : $4`,
          `${absence.souFilterValue}|${absence.labelUserValidation}|${absence.uvl}|${formattedAbsenceValidationDateString}`
        );
      }
    }

    return validationLabel;
  }

  /**
   * returns validation level label
   * @param souhait: number
   */
  public getValidationLevelLabel(souhait: number): string {
    let updatedValidationInformations: string = `${souhait}`;
    if (this.absValidation && this.absValidation.validations.has(souhait.toString())) {
      updatedValidationInformations = `${this.absValidation.validations.get(souhait.toString())?.libelle}`;
    }

    return updatedValidationInformations;
  }

  /**
   * Is Document Management System enabled
   */
  public isDmsEnabled(): boolean {
    return this._dmsEnabled;
  }

  public getHeaderId(headerType: string): string {
    let result = 'ecran-newabs-tableau-header';

    if (Tools.isStringDefined(headerType)) {
      result += `-${headerType}`;
    }

    if (!Tools.isNullOrUndefined(this.idTransac)) {
      result += `-${this.idTransac}`;
    }

    return result;
  }
}
