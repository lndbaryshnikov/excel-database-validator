import * as XLSX from "xlsx";
import getSheetErrors from './getSheetErrors';

const getWorkbookErrors = (workbook, config, colNumber) => {
    const sheetNames = workbook.SheetNames;

    const workbookErrors = [];

    for (let i = 0; i < sheetNames.length; i++) {
        const sheet = workbook.Sheets[sheetNames[i]];

        const sheetErrors = getSheetErrors(sheet, sheetNames[i], config, colNumber);

        workbookErrors.push(sheetErrors);
    }

    return workbookErrors;
};

export default getWorkbookErrors;