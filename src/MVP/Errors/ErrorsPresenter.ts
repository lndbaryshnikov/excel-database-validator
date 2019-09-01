import ErrorsView from "./ErrorsView";
import {ConvertedFullNameErrors, ConvertedValidationResult} from "../ValidatorPresenter";
import {Config, ErrorObject, ListObject} from "../ValidatorModel";

export default class ErrorsPresenter {
    view: ErrorsView;

    constructor(view: ErrorsView) {
        this.view = view;
    }

    initialize(validationResult: ConvertedFullNameErrors | (ErrorObject[] | ListObject)[], config: Config) {
        this.view.validationResult = validationResult;
        this.view.config = config;
    }
}