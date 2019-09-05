import * as XLSX from 'xlsx';

import Observer from "../../Observer";
import removeDiacritics from "../../removeDiacritics";
import * as validators from "../../ValidatorModel.private/validators"
import doesHaveWhitespaces from "../../doesHaveWhitespaces";
import {getCell} from "../../ValidatorModel.private/getCell";
import {addPropertyToErrors} from "../../ValidatorModel.private/addPropertyToErrors";

export interface Config {
    mode: 'none' | 'email' | 'phone' | 'site' | 'ws' | 'numbers' | 'fullName' | 'countCompanies' | 'companies' | 'names';
    row: string
    cols: {
        firstCol: string;
        secondCol: string;
    }
    lists: string | ConvertedLists;
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

export interface ListObject {
    list: string;
    listName: string;
    data: string;
    fileName: string;
}

export interface FullNameSheetErrors {
    lackOfNamesErrors: ErrorObject[] | false;
    matchErrors: ErrorObject[][] | false;
}

interface ConvertedLists {
    lists: number[],
    type: string
}

export type ValidationResult = (ErrorObject[] | FullNameSheetErrors | ListObject)[];

interface ValidateData {
    workbook: XLSX.WorkBook;
    config: Config;

    validateWorkbook(): void;
}

export default class ValidatorModel implements  ValidateData {
    private _workbook: XLSX.WorkBook;
    private _config: Config;

    private _currentSheet: {
        sheet: XLSX.WorkSheet;
        range: XLSX.Range;
        name: string;
        number: string;
    };
    private _currentCell: {
        cell: XLSX.CellObject;
        value: string;
        row: string;
        col: string;
    };
    private _validationResult: ValidationResult = [];

    private _validationCompletedSubject = new Observer();
    private _configurationErrorFoundSubject = new Observer();

    set workbook(workbook: XLSX.WorkBook) {
        this._workbook = workbook;
    }

    set config(config: Config) {
        this._config = config;
    }

    private _setCurrentSheet(iterationSheetNumber: number) {
        const sheetNames = this._workbook.SheetNames;

        const sheet = this._workbook.Sheets[sheetNames[iterationSheetNumber]];
        const number = String(iterationSheetNumber + 1);
        const name = sheetNames[iterationSheetNumber];

        const range: XLSX.Range = XLSX.utils.decode_range(sheet['!ref']);

        this._currentSheet = {
            sheet: sheet,
            range: range,
            name: name,
            number: number
        }

    }

    private _setCurrentCell(iterationRow: number, iterationCol: number) {
        const cell = this._currentSheet.sheet[ XLSX.utils.encode_cell({r: iterationRow, c: iterationCol}) ];

        const value = !!cell ? cell.v : undefined;
        this._currentCell = {
            cell: cell,
            value: !!value ? String(value) : undefined,
            row: `${iterationRow + 1}`,
            col: `${iterationCol + 1}`
        };
    }

    private _cleanModel() {
        this._validationResult = [];
    }

    validateWorkbook(): void {

        this._cleanModel();
        this._convertConfig();
        //this.lists.lists = [first,...., last]: first and last inclusively
        //this.lists.lists - lists from _config, not for iteration

        if ( typeof this._config.lists === 'string') {
            throw new Error('Lists might not be converted(they should be of object type)');
        }

        if ( this._checkConvertedLists().result === false ) return;

        this._config.lists.type;
        this._config.lists.lists;

        if ( this._config.lists.type === 'listsCollection' ) {
            for (let currentListNumber of this._config.lists.lists) {

                const currentListIterationNumber = currentListNumber - 1;

                this._setCurrentSheet(currentListIterationNumber);

                if ( this._checkColumns().result === false ) return;

                this._validateSheet();
            }
        } else {
            let firstListIterationNumber: number = this._config.lists.lists[0] - 1;
            const lastListIterationNumber: number = this._config.lists.lists[this._config.lists.lists.length - 1] - 1;

            if ( firstListIterationNumber > lastListIterationNumber ) {
                this._configurationErrorFoundSubject.notifyObservers
                    ('Lists range should go from smaller to larger');

                return;
            }

            for (let currentListIterationNumber = firstListIterationNumber;
                 currentListIterationNumber <= lastListIterationNumber; currentListIterationNumber++) {
                this._setCurrentSheet(currentListIterationNumber);

                if ( this._checkColumns().result === false ) return;


                this._validateSheet();
            }
        }

            this._validationCompletedSubject.notifyObservers();

    }

    whenWorkbookValidated(errorsFoundCallback: (result: ValidationResult, config: Config) => void,
                          noErrorsFoundCallback: () => void): void {
        this._validationCompletedSubject.addObserver(
            () => {
                if ( this._validationResult.length !== 0 ) {
                    errorsFoundCallback(this._validationResult, this._config);
                } else {
                    noErrorsFoundCallback();
                }
            }
        );
    }

    whenConfigurationErrorFound(callback: (error: string) => void): void {
        this._configurationErrorFoundSubject.addObserver((error: string): void => {
            callback(error);
        });
    }

    private _validateSheet(): void {
        if ( this._config.mode === 'fullName' ) {
            this._validateFullNamesSheet();
        }

        if ( this._config.mode === 'countCompanies' ) {
            this._validateNonRepeatingSheetCompanies();
        }

        if ( this._config.mode !== 'fullName' && this._config.mode !== 'countCompanies' ) {
            this._validateSingleCellSheet();
        }
    }

    private _validateSingleCellSheet(): void {
        const sheetErrors: ErrorObject[]  = [];

        let rowForIteration = Number(this._config.row) - 1;
        let colForIteration = Number(this._config.cols.firstCol) - 1;

        for (rowForIteration; rowForIteration < this._currentSheet.range.e.r; rowForIteration++) {
            this._setCurrentCell(rowForIteration, colForIteration);

            if ( typeof this._currentCell.cell === 'undefined' ) continue;

            if ( typeof this._currentCell.value === 'undefined' ) continue;

            const errorObject = this._getCellValueErrors();

            if ( !!errorObject ) {
                errorObject.row = String(rowForIteration + 1);

                sheetErrors.push(errorObject);
            }
        }

        if ( sheetErrors.length !==0 ) {
            this._validationResult.push(sheetErrors);
        }
    }

    private _validateFullNamesSheet(): void {
        const fullNamesAndLackOfNamesErrors = this._getFullNamesObjectsArrayAndLackOfNamesErrors();

        const lackOfNamesErrors = fullNamesAndLackOfNamesErrors.errors;
        const fullNames = fullNamesAndLackOfNamesErrors.fullNamesObjects;

        const matchErrors = this._getFullNameMatchErrors(fullNames);

        let hasError = false;

        if ( lackOfNamesErrors !== false ) hasError = true;
        if ( matchErrors !== false ) hasError = true;

        if ( hasError ) {
            this._validationResult.push({
                lackOfNamesErrors: lackOfNamesErrors,
                matchErrors: matchErrors
            })
        }
    }

    private _validateNonRepeatingSheetCompanies(): ListObject | false {
        const getSheetColCellObjectsArray = (sheet: XLSX.Sheet): string[] => {
            const range = XLSX.utils.decode_range(sheet['!ref']);

            const col: number = Number(this._config.cols.firstCol);

            const array: string[] = [];

            for(let i = Number(this._config.row) - 1; i < range.e.r; i++) {
                const value = !!getCell( sheet, i, Number(col) - 1 ) ?
                    (getCell( sheet, i, Number(col) - 1 ).v as string).trim() : undefined;

                if ( !!value ) {
                    array.push(value);
                }
            }


            return array;
        };

        const companies = getSheetColCellObjectsArray(this._currentSheet.sheet);

        if ( companies.length === 0 ) return;

        let nonRepeatingCompaniesNumber: number = 0;

        for ( let i = 0; i < companies.length; i++ ) {
            const value = companies[i];

            if ( value === undefined ) continue;

            nonRepeatingCompaniesNumber++;

            for (let j = i + 1; j < companies.length; j++) {
                const comparisonValue = companies[j];

                if ( value === comparisonValue ) {
                    companies[j] = undefined;
                }
            }
        }

        this._validationResult.push({
            list: this._currentSheet.number,
            listName: this._currentSheet.name,
            data: `${nonRepeatingCompaniesNumber}`,
            fileName: this._config.fileName
        });
    }

    private _getCellValueErrors(): ErrorObject | false {
        let isValid: boolean;
        let error: boolean | string = false;
        const trimmedCellValue = this._currentCell.value.trim();

        const mode = this._config.mode;

        if ( mode === "email"     )  isValid = validators.isEmailValid(trimmedCellValue);
        if ( mode === "phone"     )  isValid = validators.isPhoneNumberValid(trimmedCellValue);
        if ( mode === "site"      )  isValid = validators.isSiteAddressValid(trimmedCellValue);
        if ( mode === "numbers"   )  isValid = validators.isOnlyNumbersValid(trimmedCellValue);
        if ( mode === "names"     )  isValid = validators.isNameValid(trimmedCellValue);
        if ( mode === "companies" )  isValid = validators.isCompanyNameValid(trimmedCellValue);
        if ( mode === "ws"        )  isValid = true;

        if ( doesHaveWhitespaces(this._currentCell.value) || !isValid) {
            if (!isValid && doesHaveWhitespaces(this._currentCell.value)) {
                error = "incorrect/whitespaces";
            } else if (!isValid) {
                error = "incorrect";
            } else error = "whitespaces";
        }

        if ( error === false ) return false;

        return {
            row: this._currentCell.row,
            col: this._config.cols.firstCol,
            value: this._currentCell.value,
            error: error,
            list: this._currentSheet.number,
            listName: this._currentSheet.name,
            fileName: this._config.fileName
        };
    }

    private _getFullNamesObjectsArrayAndLackOfNamesErrors():
        {fullNamesObjects: ErrorObject[], errors: ErrorObject[] | false} {
        const firstNameCol = this._config.cols.firstCol;
        const secondNameCol = this._config.cols.secondCol;

        // const range = XLSX.utils.decode_range(this._currentSheet.sheet['!ref']);
        // const end = range.e.r;

        const errors: ErrorObject[] = [];
        const fullNames: ErrorObject[] = [];

        const isRowEmpty = (sheet: XLSX.Sheet, rowNumber: number): boolean => {
            const range = XLSX.utils.decode_range(sheet['!ref']);

            for (let i = 0; i < range.e.c; i++) {
                const cell = getCell(sheet, rowNumber, i);

                if ( typeof cell !== 'undefined' && typeof cell.v !== 'undefined' ) {
                    return false;
                }
            }

            return true;
        };

        for (let i = Number(this._config.row) - 1; i < this._currentSheet.range.e.r; i++) {
            this._setCurrentCell(i, Number(firstNameCol) - 1);

            const firstName = !!this._currentCell.cell ?
                this._currentCell.value.trim() : undefined;

            this._setCurrentCell(i, Number(secondNameCol) - 1);

            const secondName = !!this._currentCell.cell ?
                this._currentCell.value.trim() : undefined;

            //check for empty row may be unnecessary
            if ( (!firstName || !secondName) && !isRowEmpty(this._currentSheet.sheet, i) ) {

                let error: ErrorObject;

                if( !firstName && !secondName ) {
                    // if ( isRowEmpty(this._currentSheet.sheet, i) ) continue;

                    error = this._createErrorObject('no full name');

                    error.col = `${firstNameCol} | ${secondNameCol}`;
                    error.value = ' - ';

                    errors.push(error);
                } else if ( !firstName ) {
                    error = this._createErrorObject('no first name');

                    error.col = `${firstNameCol} | ${secondNameCol}`;
                    error.value = `${secondName}`;

                    errors.push(error);
                } else {
                    error = this._createErrorObject('no second name');

                    error.col = `${firstNameCol} | ${secondNameCol}`;
                    error.value = `${firstName}`;


                    errors.push(error);
                }
            }

            let result: ErrorObject;

            if ( firstName && secondName ) {
                result = this._createErrorObject('');

                result.col = `${firstNameCol} | ${secondNameCol}`;
                result.value = firstName + ' ' + secondName;

                fullNames.push( result );
            }

        }

        if ( errors.length !== 0 ) {
            return {
                fullNamesObjects: fullNames,
                errors: errors
            };
        }

        return {
            fullNamesObjects: fullNames,
            errors: false
        }
    }

    private _getFullNameMatchErrors(_fullNames: ErrorObject[]): ErrorObject[][] | false {
        const fullNames = _fullNames.slice(0);
        const arrayOverlaps: ErrorObject[][] = [];

        for (let i = 0; i < fullNames.length; i++) {

            if ( !fullNames[i] ) continue;

            const elemOverlaps: ErrorObject[] =[];

            _fullNames[i].error = 'overlap';

            elemOverlaps.push(_fullNames[i]);

            for (let j = i + 1; j < fullNames.length; j++) {

                if ( !fullNames[j] ) continue;

                if ( removeDiacritics( String(fullNames[i].value).trim() ) === removeDiacritics( String(fullNames[j].value).trim() ) ) {
                    _fullNames[j].error = 'overlap';

                    elemOverlaps.push(_fullNames[j]);

                    fullNames[j] = undefined;
                }
            }

            if ( elemOverlaps.length > 1 ) arrayOverlaps.push(elemOverlaps);
        }

        if ( arrayOverlaps.length !== 0 ) {
            return arrayOverlaps;
        }

        return false;
    }

    private _createErrorObject(error: string): ErrorObject {
        return {
            row: this._currentCell.row,
            col: this._currentCell.col,
            value: this._currentCell.value,
            error: error,
            list: this._currentSheet.number,
            listName: this._currentSheet.name,
            fileName: this._config.fileName
        }
    }

    private  _checkColumns(): {result: boolean} {
        const sheetNames = this._workbook.SheetNames;
        const sheet = this._workbook.Sheets[sheetNames[Number(this._currentSheet.number)]];
        const range: XLSX.Range = XLSX.utils.decode_range(sheet['!ref']);

        const list = `list No ${this._currentSheet.number}`;

        let result: boolean = true;
        let error: false | string = false;

        const doesColExist = (col: number, range: XLSX.Range): boolean => {
            return ( col >= (range.s.c + 1) && col <= (range.e.c) );
        };

        const firstColHere: boolean = doesColExist(Number(this._config.cols.firstCol), range);

        if ( !firstColHere ) {
            result = false;
            error =  `Column No ${this._config.cols.firstCol} doesn't exist on ${list}`;
        }

        const secondColHere: boolean = doesColExist(Number(this._config.cols.secondCol), range);

        if ( this._config.mode === 'fullName'  && !secondColHere ) {
            result = false;
            error =  `Column No ${this._config.cols.secondCol} doesn't exist on ${list}`
        }

        if ( result === false && error !== false ) {
            this._configurationErrorFoundSubject.notifyObservers(error);
        }

        return {
            result: result
        };
    }

    private _addListPropertiesToErrors(errors: FullNameSheetErrors | ErrorObject[], listNumber: string, listName: string): void {
        if ( this._config.mode === 'fullName' ) {
            let key: keyof FullNameSheetErrors;

            for (key in errors as FullNameSheetErrors) {
                if ( (errors as FullNameSheetErrors)[key] !== false ) {
                    addPropertyToErrors((errors as FullNameSheetErrors)[key] as ErrorObject[][] | ErrorObject[],
                        'lists', listNumber);
                    addPropertyToErrors((errors as FullNameSheetErrors)[key] as ErrorObject[][] | ErrorObject[],
                        'listName', listName);
                }
            }

            return;
        }

        addPropertyToErrors(errors as ErrorObject[], 'lists',
            listNumber);
        addPropertyToErrors(errors as ErrorObject[], 'listName',
            listName);
    }

    private _convertConfig(): void {
        this._convertListsString();
        this._convertColumnsToNumbers();
    }

    private _convertListsString(): void {
        //convert no whitespaces list string
        const sheetNames = this._workbook.SheetNames;

        if ( typeof this._config.lists !== 'string') {
            throw new Error('Lists might be already converted(they are not of string type)')
        }

        //lists = [first,...., last]: first and last inclusively
        let lists: number[];
        let type: 'fullWorkbook' | 'singleList' | 'listsCollection' | 'listsRange';

        if ( this._config.lists === '' ) {
            lists = [1, sheetNames.length];
            type = 'fullWorkbook';
        }

        if ( /\d+/.test(this._config.lists) ) {

            lists = [Number(this._config.lists), Number(this._config.lists)];
            type = 'singleList';
        }

        if ( this._config.lists.match(/,/) !== null ) {
            const array: string[] = this._config.lists.split(',');

            //CHECK THIS LATER IF LISTS HAVEN'T BECOME NUMBERS
            lists = array.map((list) => Number(list));
            type = 'listsCollection'
        }

        if (this._config.lists.match(/-/) !== null) {
            if (this._config.lists.match(/-/).length === 1) {
                const array: string[] = this._config.lists.split('-');

                lists = array.map(list => Number(list));
                type = 'listsRange';
            }
        }

        this._config.lists = {
            lists: lists,
            type: type
        }
    }

    private _convertColumnsToNumbers(): void {
        this._config.cols.firstCol = String(XLSX.utils.decode_col(this._config.cols.firstCol) + 1);

        if ( this._config.mode === 'fullName' && !!this._config.cols.secondCol ) {
            this._config.cols.secondCol = String(XLSX.utils.decode_col(this._config.cols.secondCol) + 1);

        }
    }

    private _checkConvertedLists(): {result: boolean} {
        const sheetNames = this._workbook.SheetNames;

        if ( typeof this._config.lists === "string" ) {
            throw new Error('Lists might not be converted(they should be of object type)');
        }

        const createListError = (listNumber: string | number): string => {
            return `List No ${listNumber} doesn't exist`
        };
        let result: boolean = true;
        let error: string;

        const doesListExist = (list: number, sheetNames: string[] ): boolean => {
            if ( list > 0 && list <= sheetNames.length ) return true;
        };

        for (let i = 0; i < this._config.lists.lists.length; i++) {
            if (!doesListExist(this._config.lists.lists[i], sheetNames)) {
                result = false;
                error = createListError(this._config.lists.lists[i]);
                break;
            }
        }

        if ( !result ) {
            this._configurationErrorFoundSubject.notifyObservers(error);
        }

        return {
            result: result
        }
    }
}