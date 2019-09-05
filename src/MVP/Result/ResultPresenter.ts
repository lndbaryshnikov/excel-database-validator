import ResultView from "./ResultView";
import {ConvertedFullNameErrors} from "../Validator/ValidatorPresenter";
import {Config, ErrorObject, ListObject} from "../Validator/ValidatorModel";

export default class ResultPresenter {
    view: ResultView;

    constructor(view: ResultView) {
        this.view = view;
    }

    initialize(validationResult: ConvertedFullNameErrors | (ErrorObject[] | ListObject)[], config: Config) {
        this.view.validationResult = validationResult;
        this.view.config = config;
    }
}