import {ErrorObject} from "../ValidatorModel";
import {ConvertedFullNameErrors} from "../ValidatorPresenter";
import Observer from "../../Observer";

export default class LogModel {
    workbookErrors: ConvertedFullNameErrors | ErrorObject[][];
    private _logCreatedSubject = new Observer();

    whenLogCreated(callback: (log: string) => void) {
        this._logCreatedSubject.addObserver((log: string) => {
            callback(log);
        })
    }

    set errors(workbookErrors: ConvertedFullNameErrors | ErrorObject[][]) {
        this.workbookErrors = workbookErrors;
    }

    createLogForSingleCellErrors(): void {
        if ( !Array.isArray(this.workbookErrors) ) {
            throw new Error('WorkBook Errors are not assignable to required format');
        }

        let text = "Errors for \"" + this.workbookErrors[0][0].fileName + "\":";

        text += this._createLogForErrors((this.workbookErrors as ErrorObject[][]), 'array');

        this._logCreatedSubject.notifyObservers(text);
    }

    createLogForConvertedFullNameErrors(): void {
        if ( Array.isArray(this.workbookErrors) ) {
            throw new Error('WorkBook Errors are not assignable to required format');
        }

        const matchErrors = this.workbookErrors.matchErrors;
        const lackOfNamesErrors = this.workbookErrors.lackOfNamesErrors;

        let fileName;

        if ( !!matchErrors ) {
            fileName = matchErrors[0][0][0].fileName;
        } else if ( !!lackOfNamesErrors ) {
            fileName = lackOfNamesErrors[0][0].fileName;
        }

        let text = "Errors for \"" + fileName + "\":";


        if ( matchErrors !== false ) {
            text += this._createLogForErrors(matchErrors, 'array-in-array');
        }

        if ( lackOfNamesErrors !== false ) {
            text += "\r\n\r\n Another errors: \r\n\r\n";

            text += this._createLogForErrors(lackOfNamesErrors, 'array');
        }

        this._logCreatedSubject.notifyObservers(text);
    }


    private _createLogForErrors(workbookErrors: ErrorObject[][] | ErrorObject[][][],
                                         errorsArrayForm: 'array-in-array' | 'array') {
        let text: string = '';

        for (let i = 0; i < workbookErrors.length; i++) {
            const currentList = workbookErrors[i];

            let list, listName;
            if ( Array.isArray(currentList[i]) ) {
                list = ((currentList as ErrorObject[][])[0][0]).list;
                listName = ((currentList as ErrorObject[][])[0][0]).listName;
            } else {
                list = ((currentList as ErrorObject[])[0]).list;
                listName = ((currentList as ErrorObject[])[0]).listName;
            }

            text += "\r\n\r\nLis No" + list + "(" + listName + ")\r\n";
            text += "No - ROW - VALUE - ERROR TYPE\r\n\r\n";

            if ( errorsArrayForm === 'array-in-array' ) {
                for (let i = 0; i < (currentList as ErrorObject[][]).length; i++) {
                    text += this._createLogForErrorsArray((currentList as ErrorObject[][])[i], 'group', i + 1);
                }
            }

            if ( errorsArrayForm === 'array' ) {
                text += this._createLogForErrorsArray((currentList as ErrorObject[]), 'in-course')
            }
        }

        return text;
    };

    private _createLogForErrorsArray(errorsArray: ErrorObject[], numeration: 'group' | 'in-course',
                                              errorNumber?: number | undefined) {
        let text: string = '';

        for (let i = 0; i < errorsArray.length; i++) {
            let logNumber: string;

            if ( numeration === 'group' && !!errorNumber ) {
                logNumber = String(errorNumber);
            }
            if ( numeration === 'in-course' && !errorNumber ) logNumber = String(i + 1);

            // if ( !logNumber ) logNumber = '';

            const currentError = errorsArray[i];
            text += "" + logNumber + " - "
                + currentError.row + " - "
                + currentError.value + " - "
                + currentError.error + "\r\n";

            // errorNumber = undefined;
        }

        return text;
    }
}