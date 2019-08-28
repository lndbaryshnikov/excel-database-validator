import * as XLSX from 'xlsx';

import Observer from "./Observer";
import removeDiacritics from "../removeDiacritics";
import {stringify} from "querystring";

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

    validateWorkbook(workbook: XLSX.WorkBook): void {
        const sheetNames = workbook.SheetNames;

        const workbookErrors:  (ErrorObject[] | FullNameSheetErrors)[] = [];

        const getListsArray = (noWsListNumberFromConfig: string, sheetNames: string[])
            : {lists: number[], type: string} => {
            //lists = [first,...., last]: first and last inclusively
            let lists: number[];
            let type: 'fullWorkbook' | 'singleList' | 'listsCollection' | 'listsRange';



            if ( noWsListNumberFromConfig === '' ) {
                lists = [1, sheetNames.length];
                type = 'fullWorkbook';
            }

            if ( /\d+/.test(noWsListNumberFromConfig) ) {

                lists = [Number(noWsListNumberFromConfig), Number(noWsListNumberFromConfig)];
                type = 'singleList';
            }

            if ( noWsListNumberFromConfig.match(/,/) !== null ) {
                const array: string[] = noWsListNumberFromConfig.split(',');

                //CHECK THIS LATER IF LISTS HAVEN'T BECOME NUMBERS
                lists = array.map((list) => Number(list));
                type = 'listsCollection'
            }

            if (noWsListNumberFromConfig.match(/-/) !== null) {
                if (noWsListNumberFromConfig.match(/-/).length === 1) {
                    const array: string[] = noWsListNumberFromConfig.split('-');

                    lists = array.map(list => Number(list));
                    type = 'listsRange';
                }
            }

            return {
                lists: lists,
                type: type
            }
        };

        const doListsFromArrayExist = (listsArray: number[], sheetNames: string[]): {result: boolean, error?: string} => {
            const createListError = (listNumber: string | number): string => {
                return `List No ${listNumber} doesn't exist`
            };
            let result: boolean = true;
            let error: string;

            for (let i = 0; i < listsArray.length; i++) {
                if (!this._doesListExist(listsArray[i], sheetNames)) {
                    result = false;
                    error = createListError(listsArray[i]);
                    break;
                }
            }

            return {
                result: result,
                error: error
            };
        };

        //lists = [first,...., last]: first and last inclusively
        //lists - lists from config, not for iteration
        const lists = getListsArray(this.config.list, sheetNames);

        if ( doListsFromArrayExist(lists.lists, sheetNames).result === false ) {
            alert(doListsFromArrayExist(lists.lists, sheetNames).error);

            return;
        }

        if ( lists.type === 'listsCollection' ) {
            lists.lists.forEach((currentListNumber) => {
                if ( this._doColumnsExist(workbook, currentListNumber) !== true ) {
                    const error = this._doColumnsExist(workbook, currentListNumber);

                    alert(error);

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
                alert('Lists range should go from smaller to larger');

                return;
            }

            for (let currentListIterationNumber = firstListIterationNumber;
                 currentListIterationNumber <= lastListIterationNumber; currentListIterationNumber++) {
                if ( this._doColumnsExist(workbook, currentListIterationNumber + 1) !== true ) {
                    const error = this._doColumnsExist(workbook, currentListIterationNumber);

                    alert(error);

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

    set options(options: Config) {
        this.config = options;
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
            const cell = this._getCell(sheet, rowForIteration, colForIteration);

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

        if ( mode === "email"   )  isValid = this._isEmailValid(trimmedCellValue);
        if ( mode === "phone"   )  isValid = this._isPhoneNumberValid(trimmedCellValue);
        if ( mode === "site"    )  isValid = this._isSiteAddressValid(trimmedCellValue);
        if ( mode === "numbers" )  isValid = this._isOnlyNumbersValid(trimmedCellValue);
        if ( mode === "ws"      )  isValid = true;

        if ( this._doesHaveWhitespaces(cellValue) || !isValid) {
            if (!isValid && this._doesHaveWhitespaces(cellValue)) {
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
            const firstName = !!this._getCell( sheet, i, Number(firstNameCol) - 1 ) ?
                (this._getCell( sheet, i, Number(firstNameCol) - 1 ).v as string).trim() : undefined;

            const secondName = !!this._getCell( sheet, i, Number(secondNameCol) -  1 ) ?
                (this._getCell( sheet, i, Number(secondNameCol) - 1 ).v as string).trim() : undefined;

            // const isOnlyWS = (string: string) => {
            //     return string.replace(/ /g, '') === '';
            // };

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

    private _doesListExist(list: number, sheetNames: string[] ): boolean {
        if ( list > 0 && list <= sheetNames.length ) return true;
    }

    private _doesColExist(col: number, range: XLSX.Range): boolean {
        return ( col >= (range.s.c + 1) && col <= (range.e.c + 1) );
    }

    private _doColumnsExist(workbook: XLSX.WorkBook, listNumber: number): string | true {
        const sheetNames = workbook.SheetNames;
        const sheet = workbook.Sheets[sheetNames[listNumber]];
        const range: XLSX.Range = XLSX.utils.decode_range(sheet['!ref']);

        const list = `list No ${listNumber}`;

        const firstColHere: boolean = this._doesColExist(Number(this.config.cols.firstCol), range);

        if ( !firstColHere ) {
            return `Column No ${this.config.cols.firstCol} doesn't exist on ${list}`;
        }

        const secondColHere: boolean = this._doesColExist(Number(this.config.cols.secondCol), range);

        if ( this.config.mode === 'fullName'  && !secondColHere ) {
            return `Column No ${this.config.cols.secondCol} doesn't exist on ${list}`
        }

        return true;
}

    private _getCell(sheet: XLSX.Sheet, row: number, col: number): XLSX.CellObject {
        return sheet[ XLSX.utils.encode_cell({r: row, c: col}) ];
    };

    private _createErrorObject(row: string, col: string, value: string, error: string,
                               list: string, listName: string, fileName: string): ErrorObject {
        return {
            row: row,
            col: col,
            value: value,
            error: error,
            list: list,
            listName: listName,
            fileName: fileName
        }
    }

    private _addListPropertiesToErrors(errors: FullNameSheetErrors | ErrorObject[], listNumber: string, listName: string): void {

        const addPropertyToErrors = (errors: any[], property: string, value: string) => {
            for (let i = 0; i < errors.length; i++) {
                if (errors[i] === undefined) continue;

                if (Array.isArray(errors[i])) {
                    addPropertyToErrors(errors[i], property, value);

                    continue;
                }
                errors[i][property] = value;
            }
        };

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

    private _isEmailValid(trimmedEmail: string) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return re.test(trimmedEmail.toLowerCase());
    }

    private _isPhoneNumberValid(trimmedPhone: string) {
        const re = /^[0-9]{1,3} [0-9]+$/;

        const encodedPhone = encodeURIComponent(trimmedPhone)
            .replace('%C2%A0', '%20');

        trimmedPhone = decodeURIComponent(encodedPhone);

        return re.test(String(trimmedPhone));
    }

    private _isSiteAddressValid(trimmedAddress: string) {
        const re = /(^https?:\/\/)|(www\.)[a-z0-9~_\-\.]+\.[a-z]{2,9}(\/|:|\?[!-~]*)?$/i;

        return re.test(trimmedAddress);
    }

    private _isOnlyNumbersValid(trimmedNumber: string) {
        const re = /^[0-9]+$/;

        return re.test(trimmedNumber);
    }

    private _doesHaveWhitespaces(string: string) {
        return !(string === string.trim());
    }

    private _doErrorsExist(errors: any[]): boolean {
        if ( errors.length === 0 ) return false;

        for (let i = 0; i < errors.length; i++) {
            if ( !Array.isArray(errors[i]) ) {
                return true;
            } else if ( this._doErrorsExist(errors[i]) ) {
                return true;
            }
        }

        return false;
    }
}