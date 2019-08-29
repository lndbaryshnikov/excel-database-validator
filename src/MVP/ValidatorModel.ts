import * as XLSX from 'xlsx';

import Observer from "../Observer";
import removeDiacritics from "../removeDiacritics";
import * as validators from "../ValidatorModel.private/validators"
import doesHaveWhitespaces from "../doesHaveWhitespaces";
import {getListsArray} from "../ValidatorModel.private/getListsArray";
import {doListsFromArrayExist} from "../ValidatorModel.private/doListsFromArrayExist";
import {doesColExist} from "../ValidatorModel.private/doesColExist";
import {getCell} from "../ValidatorModel.private/getCell";
import {addPropertyToErrors} from "../ValidatorModel.private/addPropertyToErrors";

export interface Config {
    mode: string;
    row: string
    cols: {
        firstCol: string;
        secondCol: string;
    }
    list: string;
    fileName: string;
}

export interface ErrorObject {
    row: string;
    col: string;
    value: string;
    error: string;
    list: string;
    listName: string;
    fileName: string;
}

export interface FullNameSheetErrors {
    lackOfNamesErrors: ErrorObject[] | false;
    matchErrors: ErrorObject[][] | false;
}

interface ValidateData {
    config: Config;

    validateWorkbook(workbook: XLSX.WorkBook): void;
    whenWorkbookValidated(callback: (workbookErrors: ErrorObject[][] | FullNameSheetErrors[] | false, log?: string | false) => void): void;
}

export default class ValidatorModel implements  ValidateData {
    config: Config;
    private _validationCompletedSubject = new Observer();
    private _configurationErrorFoundSubject = new Observer();

    validateWorkbook(workbook: XLSX.WorkBook): void {
        const sheetNames = workbook.SheetNames;

        const workbookErrors:  (ErrorObject[] | FullNameSheetErrors)[] = [];

        //lists = [first,...., last]: first and last inclusively
        //lists - lists from config, not for iteration
        const lists = getListsArray(this.config.list, sheetNames);

        if ( doListsFromArrayExist(lists.lists, sheetNames).result === false ) {
            const error = doListsFromArrayExist(lists.lists, sheetNames).error;

            this._configurationErrorFoundSubject.notifyObservers(error);

            return;
        }

        if ( lists.type === 'listsCollection' ) {
            lists.lists.forEach((currentListNumber) => {
                if ( this._doColumnsExist(workbook, currentListNumber) !== true ) {
                    const error = this._doColumnsExist(workbook, currentListNumber);

                    this._configurationErrorFoundSubject.notifyObservers(error);

                    return;
                }

                const currentListIterationNumber = currentListNumber - 1;

                const currentSheet: XLSX.WorkSheet = workbook.Sheets[sheetNames[currentListIterationNumber]];

                const sheetErrors = this._validateSheet(currentSheet);

                if ( sheetErrors === false ) return;

                this._addListPropertiesToErrors(sheetErrors, String(currentListIterationNumber + 1),
                    sheetNames[currentListIterationNumber]);

                workbookErrors.push(sheetErrors);
            });
        } else {
            let firstListIterationNumber: number = lists.lists[0] - 1;
            const lastListIterationNumber: number = lists.lists[lists.lists.length - 1] - 1;

            if ( firstListIterationNumber > lastListIterationNumber ) {
                this._configurationErrorFoundSubject.notifyObservers
                    ('Lists range should go from smaller to larger');

                return;
            }

            for (let currentListIterationNumber = firstListIterationNumber;
                 currentListIterationNumber <= lastListIterationNumber; currentListIterationNumber++) {
                if ( this._doColumnsExist(workbook, currentListIterationNumber + 1) !== true ) {
                    const error = this._doColumnsExist(workbook, currentListIterationNumber);

                    this._configurationErrorFoundSubject.notifyObservers(error);

                    return;
                }

                const currentSheet = workbook.Sheets[sheetNames[currentListIterationNumber]];

                const sheetErrors = this._validateSheet(currentSheet);

                if ( sheetErrors === false ) continue;

                this._addListPropertiesToErrors(sheetErrors, String(currentListIterationNumber + 1),
                    sheetNames[currentListIterationNumber]);

                workbookErrors.push(sheetErrors);
            }
        }

        if ( workbookErrors.length !== 0 ) {
            this._validationCompletedSubject.notifyObservers(workbookErrors);
        } else {
            this._validationCompletedSubject.notifyObservers(false);
        }
    }

    whenWorkbookValidated(callback: (workbookErrors: ErrorObject[][] | FullNameSheetErrors[] | false, log?: string | false) => void): void {
        this._validationCompletedSubject.addObserver(
            (workbookErrors: ErrorObject[][] | FullNameSheetErrors[] | false) => {
                if ( workbookErrors!== false ) {
                    const log = this.createLog(workbookErrors, this.config.fileName);

                    callback(workbookErrors, log as string);
                } else {
                    callback(false);
                }
            }
        );
    }

    whenConfigurationErrorFound(callback: (error: string) => void): void {
        this._configurationErrorFoundSubject.addObserver((error: string): void => {
            callback(error);
        });
    }

    createLog(workbookErrors: ErrorObject[][] | FullNameSheetErrors[], fileName: string): string {
        const convertFullNameErrors = (errorsArray: FullNameSheetErrors[]):
            {lackOfNamesErrors: ErrorObject[][] | false; matchErrors: ErrorObject[][][] | false;} => {
            let lackOfNames: ErrorObject[][] | false = [];
            let match: ErrorObject[][][] | false= [];

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
        };

        const createLogForErrorsArray = (errorsArray: ErrorObject[], numeration: 'group' | 'in-course',
                                      errorNumber?: number | undefined) => {
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
        };

        const createLogForErrors = (workbookErrors: ErrorObject[][] | ErrorObject[][][],
                                 errorsArrayForm: 'array-in-array' | 'array') => {
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
                        text += createLogForErrorsArray((currentList as ErrorObject[][])[i], 'group', i + 1);
                    }
                }

                if ( errorsArrayForm === 'array' ) {
                    text += createLogForErrorsArray((currentList as ErrorObject[]), 'in-course')
                }
            }

            return text;
        };

        let text = "Errors for \"" + fileName + "\":";

        if ( this.config.mode === 'fullName' ) {
            const errors = convertFullNameErrors(workbookErrors as FullNameSheetErrors[]);

            const matchErrors = errors.matchErrors;
            const lackOfNamesErrors = errors.lackOfNamesErrors;

            if ( matchErrors !== false ) {
                text += createLogForErrors(matchErrors, 'array-in-array');
            }

            if ( lackOfNamesErrors !== false ) {
                text += "\r\n\r\n Another errors: \r\n\r\n";

                text += createLogForErrors(lackOfNamesErrors, 'array');
            }

        } else {
            text += createLogForErrors((workbookErrors as ErrorObject[][]), 'array');
        }

        return text;
    }

    private _validateSheet(sheet: XLSX.WorkSheet): ErrorObject[] | FullNameSheetErrors | false {
        const range: XLSX.Range = XLSX.utils.decode_range(sheet['!ref']);

        if ( this.config.mode === 'fullName' ) {
            return this._validateFullNamesSheet(sheet);
        }

        const sheetErrors: ErrorObject[]  = [];

        let rowForIteration = Number(this.config.row) - 1;
        let colForIteration = Number(this.config.cols.firstCol) - 1;

        for (rowForIteration; rowForIteration < range.e.r; rowForIteration++) {
            const cell = getCell(sheet, rowForIteration, colForIteration);

            if ( typeof cell === 'undefined' ) continue;

            const cellValue = cell.v;

            if ( typeof cellValue === 'undefined' ) continue;

            const errorObject = this._validateCellValue( String(cellValue) );

            if ( !!errorObject ) {
                errorObject.row = String(rowForIteration + 1);

                sheetErrors.push(errorObject);
            }
        }

        if ( sheetErrors.length !==0 ) return sheetErrors;

        return false;
    }

    private _validateFullNamesSheet(sheet: XLSX.WorkSheet): FullNameSheetErrors | false {
        const firstNameCol = this.config.cols.firstCol;
        const secondNameCol = this.config.cols.secondCol;

        const fullNamesAndLackOfNamesErrors = this._pushAllFullNamesToArrayAndReturnErrors(sheet, firstNameCol, secondNameCol);
        const lackOfNamesErrors = fullNamesAndLackOfNamesErrors.errors;
        const fullNames = fullNamesAndLackOfNamesErrors.fullNames;

        const matchErrors = this._returnArrayMatchErrors(fullNames);

        let hasError = false;

        if ( lackOfNamesErrors !== false ) hasError = true;
        if ( matchErrors !== false ) hasError = true;

        if ( !hasError ) return false;

        return {
            lackOfNamesErrors: lackOfNamesErrors,
            matchErrors: matchErrors
        }
    }

    private _validateCellValue(cellValue: string): ErrorObject | false {
        let isValid: boolean;
        let error: boolean | string = false;
        const trimmedCellValue = String(cellValue).trim();

        const mode = this.config.mode;

        if ( mode === "email"   )  isValid = validators.isEmailValid(trimmedCellValue);
        if ( mode === "phone"   )  isValid = validators.isPhoneNumberValid(trimmedCellValue);
        if ( mode === "site"    )  isValid = validators.isSiteAddressValid(trimmedCellValue);
        if ( mode === "numbers" )  isValid = validators.isOnlyNumbersValid(trimmedCellValue);
        if ( mode === "ws"      )  isValid = true;

        if ( doesHaveWhitespaces(cellValue) || !isValid) {
            if (!isValid && doesHaveWhitespaces(cellValue)) {
                error = "incorrect/whitespaces";
            } else if (!isValid) {
                error = "incorrect";
            } else error = "whitespaces";
        }

        if ( error === false ) return false;

        return {
            row: '',
            col: this.config.cols.firstCol,
            value: cellValue,
            error: error,
            list: '',
            listName: '',
            fileName: ''
        };
    }

    private _pushAllFullNamesToArrayAndReturnErrors(sheet: XLSX.WorkSheet, firstNameCol: string, secondNameCol:string):
        {fullNames: string[], errors: ErrorObject[] | false} {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const end = range.e.r;

        const errors: ErrorObject[] = [];
        const fullNames: string[] = [];

        for (let i = Number(this.config.row) - 1; i < end; i++) {
            const firstName = !!getCell( sheet, i, Number(firstNameCol) - 1 ) ?
                (getCell( sheet, i, Number(firstNameCol) - 1 ).v as string).trim() : undefined;

            const secondName = !!getCell( sheet, i, Number(secondNameCol) -  1 ) ?
                (getCell( sheet, i, Number(secondNameCol) - 1 ).v as string).trim() : undefined;

            if ( !firstName || !secondName ) {
                if( !firstName && !secondName ) {
                    errors.push({
                        row: String(i + 1),
                        col: `${firstNameCol} | ${secondNameCol}`,
                        value: ' - ',
                        error: 'no full name',
                        list: '',
                        listName: '',
                        fileName: this.config.fileName
                    });
                } else if ( !firstName ) {
                    errors.push({
                        row: String(i + 1),
                        col: `${firstNameCol} | ${secondNameCol}`,
                        value: secondName.trim(),
                        error: 'no first name',
                        list: '',
                        listName: '',
                        fileName: this.config.fileName
                    });
                } else {
                    errors.push({
                        row: String(i + 1),
                        col: `${firstNameCol} | ${secondNameCol}`,
                        value: firstName.trim(),
                        error: 'no second name',
                        list: '',
                        listName: '',
                        fileName: this.config.fileName
                    });
                }
            }

            let result;

            if ( !firstName || !secondName ) result = undefined;
            else result = firstName + ' ' + secondName;

            fullNames.push( result );


        }

        if ( errors.length !== 0 ) {
            return {
                fullNames: fullNames,
                errors: errors
            };
        }

        return {
            fullNames: fullNames,
            errors: false
        }
    }

    private _returnArrayMatchErrors(_array: string[]): ErrorObject[][] | false {
        const arr = _array.slice(0);
        const arrayOverlaps: ErrorObject[][] = [];

        for (let i = 0, iRow = Number(this.config.row); i < arr.length; i++, iRow++) {
            const value = arr[i];

            if ( !value ) continue;

            const elemOverlaps: ErrorObject[] =[];

            elemOverlaps.push({
                row: (String(iRow)),
                col: `${this.config.cols.firstCol} - ${this.config.cols.secondCol}`,
                value: value,
                error: 'overlap',
                list: '',
                listName: '',
                fileName: this.config.fileName
            });


            for (let j = i + 1, jRow = iRow + 1; j < arr.length; j++, jRow++) {

                if ( !arr[j] ) continue;

                if ( removeDiacritics( String(value).trim() ) === removeDiacritics( String(arr[j]).trim() ) ) {
                    elemOverlaps.push({
                        row: String(jRow),
                        col: `${this.config.cols.firstCol} - ${this.config.cols.secondCol}`,
                        value: arr[j],
                        error: 'overlap',
                        list: '',
                        listName: '',
                        fileName: this.config.fileName
                    });

                    arr[j] = undefined;
                }
            }

            if ( elemOverlaps.length > 1 ) arrayOverlaps.push(elemOverlaps);
        }

        if ( arrayOverlaps.length !== 0 ) {
            return arrayOverlaps;
        }

        return false;
    }

    private  _doColumnsExist(workbook: XLSX.WorkBook, listNumber: number): string | true {
        const sheetNames = workbook.SheetNames;
        const sheet = workbook.Sheets[sheetNames[listNumber]];
        const range: XLSX.Range = XLSX.utils.decode_range(sheet['!ref']);

        const list = `list No ${listNumber}`;

        const firstColHere: boolean = doesColExist(Number(this.config.cols.firstCol), range);

        if ( !firstColHere ) {
            return `Column No ${this.config.cols.firstCol} doesn't exist on ${list}`;
        }

        const secondColHere: boolean = doesColExist(Number(this.config.cols.secondCol), range);

        if ( this.config.mode === 'fullName'  && !secondColHere ) {
            return `Column No ${this.config.cols.secondCol} doesn't exist on ${list}`
        }

        return true;
    }

    private _addListPropertiesToErrors(errors: FullNameSheetErrors | ErrorObject[], listNumber: string, listName: string): void {
        if ( this.config.mode === 'fullName' ) {
            let key: keyof FullNameSheetErrors;

            for (key in errors as FullNameSheetErrors) {
                if ( (errors as FullNameSheetErrors)[key] !== false ) {
                    addPropertyToErrors((errors as FullNameSheetErrors)[key] as ErrorObject[][] | ErrorObject[],
                        'list', listNumber);
                    addPropertyToErrors((errors as FullNameSheetErrors)[key] as ErrorObject[][] | ErrorObject[],
                        'listName', listName);
                }
            }

            return;
        }

        addPropertyToErrors(errors as ErrorObject[], 'list',
            listNumber);
        addPropertyToErrors(errors as ErrorObject[], 'listName',
            listName);
    }
}