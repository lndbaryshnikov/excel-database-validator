import * as XLSX from "xlsx";
import getSheetErrors from './getSheetErrors';
import {addPropertyToErrors} from "./fullNameMatchAndCheck";

const getWorkbookErrors = (workbook, config, colNumber) => {
    const sheetNames = workbook.SheetNames;

    const workbookErrors = [];

    for (let i = 0; i < sheetNames.length; i++) {
        const sheet = workbook.Sheets[sheetNames[i]];

        const sheetErrors = getSheetErrors(sheet, config, colNumber);

        if ( !Array.isArray(sheetErrors) ) {
            for (let key in sheetErrors) {
                if ( sheetErrors.hasOwnProperty(key) ) {
                    addPropertyToErrors(sheetErrors[key], 'listName', sheetNames[i]);
                }
            }
        } else {
            addPropertyToErrors(sheetErrors, 'listName', sheetNames[i]);
        }

        workbookErrors.push(sheetErrors);
    }

    return workbookErrors;
};

export default getWorkbookErrors;