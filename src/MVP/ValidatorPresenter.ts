import * as XLSX from "xlsx";
import ValidatorModel, {Config, ErrorObject, FullNameSheetErrors} from "./ValidatorModel";
import ValidatorView from "./ValidatorView";
import ErrorsPresenter from "./ErrorsPresenter";
import ErrorsView from "./ErrorsView";
import LogPresenter from "./LogPresenter";
import LogModel from "./LogModel";
import LogView from "./LogView";

export interface ConvertedFullNameErrors {
    matchErrors: ErrorObject[][][] | false;
    lackOfNamesErrors: ErrorObject[][] | false;
}


export default class ValidatorPresenter {
    model: ValidatorModel;
    view: ValidatorView;

    constructor(model: ValidatorModel, view: ValidatorView) {
        this.model = model;
        this.view = view;

        this.view.whenValidationStarted(this.validateWorkbookCallback());
        this.model.whenWorkbookValidated(this.renderErrorsCallback(), this.showNoErrorsMessageCallback());
        this.model.whenConfigurationErrorFound(this.showErrorMessageCallback());
    }

    initialize(): void {
        this.view.renderUI();
    }

    validateWorkbookCallback() {
        return (workbook: XLSX.WorkBook, options: Config) => {
            this.model.config = options;

            this.model.validateWorkbook(workbook);
        }
    }

    renderErrorsCallback() {
        return (workbookErrors: ErrorObject[][] | FullNameSheetErrors[], config: Config) => {

            let errors: ConvertedFullNameErrors | ErrorObject[][];

            if ( config.mode === 'fullName' ) {
                if ( Array.isArray(workbookErrors[0]) ) {
                    throw new Error('WorkBook errors are not assignable to required format');
                }

                errors = this._convertFullNameErrors(workbookErrors as FullNameSheetErrors[]);
            } else {
                if ( !Array.isArray(workbookErrors[0]) ) {
                    throw new Error('WorkBook errors are not assignable to required format');
                }

                errors = workbookErrors as ErrorObject[][];
            }

            const errorsPresenter = new ErrorsPresenter(new ErrorsView());
            const logPresenter = new LogPresenter(new LogView(), new LogModel());

            logPresenter.initialize(errors, config.mode);
            errorsPresenter.initialize(errors, config);


            this.view.renderErrors(errorsPresenter.view, logPresenter.view);
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