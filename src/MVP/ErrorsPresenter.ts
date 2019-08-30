import ErrorsView from "./ErrorsView";
import {ConvertedFullNameErrors} from "./ValidatorPresenter";
import {Config, ErrorObject} from "./ValidatorModel";

export default class ErrorsPresenter {
    view: ErrorsView;

    constructor(view: ErrorsView) {
        this.view = view;
    }

    initialize(workBookErrors: ConvertedFullNameErrors | ErrorObject[][], config: Config) {
        this.view.workbookErrors = workBookErrors;
        this.view.config = config;
    }
}