import * as XLSX from "xlsx";
import removeDiacritics from "./removeDiacritics";

const getCellValue = (sheet, row, col) => {
    return sheet[ XLSX.utils.encode_cell({r: row, c: col}) ].v;
};

const createErrorObjectForAnArrayElement = (value, number, error) => {
    return {
        value: value,
        row: number + 1,
        error: error
    };
};

const pushAllFullNamesToArrayAndReturnErrors = (sheet, firsNameCol, secondNameCol) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const end = range.e.r;

    const errors = [];
    const arr = [];

    //i = 1 because first row is table header
    for (let i = 1; i <= end; i++) {
        const firstName = getCellValue(sheet, i, firsNameCol);
        const secondName = getCellValue(sheet, i, secondNameCol);

        if ( !firstName || !secondName ) {
            if( !firstName && !secondName ) {
                errors.push(createErrorObjectForAnArrayElement(" - ", i, "no fullname"));
            } else if ( !firstName ) {
                errors.push(createErrorObjectForAnArrayElement(secondName.trim(), i, 'no secondname'));
            } else {
                errors.push(createErrorObjectForAnArrayElement(firstName.trim(), i, 'no secondname'));
            }
        }

        let result;

        if ( !firstName || !secondName ) result = undefined;
            else result = firstName.trim() + ' ' + secondName.trim();

        arr.push( result );
    }

    return {
        fullNames: arr,
        errors: errors
    };
};

const returnArrayMatchErrors = (_array) => {
    const arr = _array.slice(0);
    const arrayOverlaps = [];

    for (let i = 0; i < arr.length; i++) {
        const value = arr[i];

        if ( !value ) continue;

        const elemOverlaps = [];

        elemOverlaps.push(createErrorObjectForAnArrayElement(value, i, 'overlap'));

        for (let j = i + 1; j < arr.length; j++) {

            if ( arr[j] === undefined ) continue;

            if ( removeDiacritics( String(value).trim() ) === removeDiacritics( String(arr[j]).trim() ) ) {
                elemOverlaps.push(createErrorObjectForAnArrayElement(arr[j], j, 'overlap'));
            }

            arr[j] = undefined;
        }

        if ( elemOverlaps.length > 1 ) arrayOverlaps.push(elemOverlaps);
    }

    return arrayOverlaps;
};

export const addPropertyToErrors = (errors, property, value) => {
    for (let i = 0; i < errors.length; i++) {
        if ( errors[i] === undefined ) continue;

        if ( Array.isArray(errors[i]) ) {
            addPropertyToErrors( errors[i], property, value );

            continue;
        }
        errors[i][property] = value;
    }
};

const FullNameMatchAndLackCheck = (sheet, cols) => {
    const firstNameCol = cols[0];
    const secondNameCol = cols[1];

    const fullNamesAndLackOfNamesErrors = pushAllFullNamesToArrayAndReturnErrors(sheet, firstNameCol, secondNameCol);
    const lackOfNamesErrors = fullNamesAndLackOfNamesErrors.errors;
    const fullNames = fullNamesAndLackOfNamesErrors.fullNames;

    const matchErrors = returnArrayMatchErrors(fullNames);

    addPropertyToErrors(lackOfNamesErrors, 'col', firstNameCol + ' - ' + secondNameCol);
    addPropertyToErrors(matchErrors, 'col', firstNameCol + ' - ' + secondNameCol);

    return {
        lackOfNamesErrors: lackOfNamesErrors,
        matchErrors: matchErrors
    }
};

export default FullNameMatchAndLackCheck;