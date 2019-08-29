import * as XLSX from "xlsx";

export const doesColExist = (col: number, range: XLSX.Range): boolean => {
    return ( col >= (range.s.c + 1) && col <= (range.e.c + 1) );
};

