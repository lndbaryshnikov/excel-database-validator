import * as XLSX from "xlsx";


import ValidatorModel, {Config, ErrorObject, FullNameSheetErrors} from "./ValidatorModel";
import ValidatorView from "./ValidatorView";

export default class ValidatorPresenter {
    model: ValidatorModel;
    view: ValidatorView;

    constructor(model: ValidatorModel, view: ValidatorView) {
        this.model = model;
        this.view = view;

        this.view.whenValidationStarted(this.validateWorkbook());
        this.model.whenWorkbookValidated(this.renderErrors());
        this.model.whenConfigurationErrorFound(this.alertErrorMessage());
    }

    initialize(): void {
        this.view.renderUI();
    }

    validateWorkbook() {
        return (workbook: XLSX.WorkBook, options: Config) => {
            this.model.config = options;

            this.model.validateWorkbook(workbook);
        }
    }

    renderErrors() {
        return (workbookErrors: ErrorObject[][] | FullNameSheetErrors[] | false, log?: string) => {
            if ( workbookErrors !== false ) {
                this.view.renderErrors(workbookErrors, log);
            } else {
                this.view.showNoErrorsMessage();
            }
        }
    }

    alertErrorMessage() {
        return (error: string): void => {
            this.view.showErrorMessage(error);
        }
    }

}