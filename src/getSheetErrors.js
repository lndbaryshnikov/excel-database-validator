import * as XLSX from 'xlsx';
import validateCellValue from "./validateCellValue";
import isOnlyNumbersValid from "./validators/isOnlyNumbersValid";

const getSheetErrors = (sheet, sheetName, config, colNumber) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);

    const sheetErrors = [];

    if ( !(colNumber >= (range.s.c + 1) && colNumber <= (range.e.c + 1)) ) {
        alert('Col number is incorrect');

        return;
    }

    const colNum = Number(colNumber) - 1;

    let rowNum = 1;

    for (rowNum; rowNum <= range.e.r; rowNum++) {
        const cell = sheet[
            XLSX.utils.encode_cell({r: rowNum, c: colNum})
        ];

        if ( typeof cell === 'undefined' ) continue;

        const cellValue = cell.v;

        if ( typeof cellValue === 'undefined' ) continue;

        const error = validateCellValue(cellValue, config);

        if ( !!error ) {
            const errorObject = {
                row: rowNum + 1,
                col: colNum + 1,
                value: cellValue,
                error: error,
                listName: sheetName
            };

            sheetErrors.push(errorObject);
        }
    }

    return sheetErrors;
};

export default getSheetErrors;