import * as XLSX from 'xlsx';
import validateCellValue from "./validateCellValue";
import FullNameMatchAndLackCheck from "./fullNameMatchAndCheck";

const getSheetErrors = (sheet, config, colNumber) => {
    let rowNum = 1;
    let colNum;

    if (typeof colNumber === "object") {
        colNum = colNumber.slice(0);

        for ( let i = 0; i < colNum.length; i++ ) colNum[i]--;

    } else colNum =  Number(colNumber) - 1;

    // if (String(config) === "fullNameMatch") {
    //     return FullNameMatchAndLackCheck(sheet, colNum);
    // }

    const range = XLSX.utils.decode_range(sheet['!ref']);

    const sheetErrors = [];

    if ( !(colNumber >= (range.s.c + 1) && colNumber <= (range.e.c + 1)) ) {
        alert('Col number is incorrect');

        return;
    }

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
                error: error
            };

            //console:
            // console.log(cellValue);
            // console.log(decodeURIComponent(encodeURIComponent(String(cellValue))));
            // console.log(encodeURIComponent('info@comau.com'));
            // console.log('info@comau.com' === String(cellValue));

            sheetErrors.push(errorObject);
        }
    }

    return sheetErrors;
};

export default getSheetErrors;