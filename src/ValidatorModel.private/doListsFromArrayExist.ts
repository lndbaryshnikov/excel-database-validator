const doesListExist = (list: number, sheetNames: string[] ): boolean => {
    if ( list > 0 && list <= sheetNames.length ) return true;
};

export const doListsFromArrayExist = (listsArray: number[], sheetNames: string[]): {result: boolean, error?: string} => {
    const createListError = (listNumber: string | number): string => {
        return `List No ${listNumber} doesn't exist`
    };
    let result: boolean = true;
    let error: string;

    for (let i = 0; i < listsArray.length; i++) {
        if (!doesListExist(listsArray[i], sheetNames)) {
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