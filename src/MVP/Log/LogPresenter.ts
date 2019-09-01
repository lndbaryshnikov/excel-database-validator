import LogModel from "./LogModel";
import LogView from "./LogView";
import {ConvertedFullNameErrors} from "../ValidatorPresenter";
import {Config, ErrorObject} from "../ValidatorModel";

export default class LogPresenter {
    model: LogModel;
    view: LogView;

    constructor(view: LogView, model: LogModel) {
        this.model = model;
        this.view = view;

        this.model.whenLogCreated(this._setlLog())
    }

    initialize(workbookErrors: ConvertedFullNameErrors | ErrorObject[][], mode: Config['mode']) {
        this._createLog(workbookErrors, mode);

        this.view.initialize();
    }

    private _createLog(workbookErrors: ConvertedFullNameErrors | ErrorObject[][], mode: Config['mode'] ){
        this.model.errors = workbookErrors;

        if ( mode === 'fullName' ) {
            this.model.createLogForConvertedFullNameErrors();
        } else {
            this.model.createLogForSingleCellErrors();
        }
    }

    private _setlLog() {
        return (log: string) => {
            this.view.log = log;
        }
    }



}