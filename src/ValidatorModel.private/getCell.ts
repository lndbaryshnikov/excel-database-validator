import * as XLSX from "xlsx";

export const getCell = (sheet: XLSX.Sheet, row: number, col: number): XLSX.CellObject => {
    return sheet[ XLSX.utils.encode_cell({r: row, c: col}) ];
};