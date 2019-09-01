import * as XLSX from "xlsx";
import ValidatorModel, {Config, ErrorObject, FullNameSheetErrors, ListObject, ValidationResult} from "./ValidatorModel";
import ValidatorView from "./ValidatorView";
import ResultPresenter from "../Result/ResultPresenter";
import ResultView from "../Result/ResultView";
import LogPresenter from "../Log/LogPresenter";
import LogModel from "../Log/LogModel";
import LogView from "../Log/LogView";

export interface ConvertedFullNameErrors {
    matchErrors: ErrorObject[][][] | false;
    lackOfNamesErrors: ErrorObject[][] | false;
}

export type ConvertedValidationResult = ConvertedFullNameErrors | (ErrorObject[] | ListObject)[];


export default class ValidatorPresenter {
    model: ValidatorModel;
    view: ValidatorView;

    constructor(model: ValidatorModel, view: ValidatorView) {
        this.model = model;
        this.view = view;

        this.view.whenValidationStarted(this.validateWorkbookCallback());
        this.model.whenWorkbookValidated(this.renderResultCallback(), this.showNoErrorsMessageCallback());
        this.model.whenConfigurationErrorFound(this.showErrorMessageCallback());
    }

    initialize(): void {
        this.view.renderUI();
    }

    validateWorkbookCallback() {
        return (workbook: XLSX.WorkBook, options: Config) => {
            this.model.workbook = workbook;
            this.model.config = options;

            this.model.validateWorkbook();
        }
    }

    renderResultCallback() {
        return (result: ValidationResult, config: Config) => {

            let errors: ConvertedFullNameErrors | (ErrorObject[] | ListObject)[];

            if ( config.mode === 'fullName' ) {
                errors = this._convertFullNameErrors(result as FullNameSheetErrors[]);
            } else {
                errors = result as (ErrorObject[] | ListObject)[];
            }

            const errorsPresenter = new ResultPresenter(new ResultView());
            const logPresenter = new LogPresenter(new LogView(), new LogModel());

            errorsPresenter.initialize(errors, config);

            if ( config.mode !== 'countCompanies' ) {
                logPresenter.initialize(errors as ConvertedFullNameErrors | ErrorObject[][], config.mode);

                this.view.renderErrors(errorsPresenter.view, logPresenter.view);
            } else {
                this.view.renderErrors(errorsPresenter.view);
            }

        }
    }

    private showNoErrorsMessageCallback() {
        return  () => {
            this.view.showNoErrorsMessage();

        };
    }

    showErrorMessageCallback() {
        return (error: string): void => {
            this.view.processErrorMessage(error);
        }
    }

    private _convertFullNameErrors(errorsArray: FullNameSheetErrors[]): ConvertedFullNameErrors {
        let lackOfNames: ErrorObject[][] | false = [];
        let match: ErrorObject[][][] | false = [];

        errorsArray.forEach( (errorObject) => {
            if ( errorObject.lackOfNamesErrors !== false ) (lackOfNames as ErrorObject[][]).push(errorObject.lackOfNamesErrors);
            if ( errorObject.matchErrors !== false ) (match as ErrorObject[][][]).push(errorObject.matchErrors);
        });

        if ( lackOfNames.length === 0 ) lackOfNames = false;
        if ( match.length === 0 ) match = false;


        return {
            lackOfNamesErrors: lackOfNames,
            matchErrors: match
        }
    }


}