export const getListsArray = (noWsListNumberFromConfig: string, sheetNames: string[])
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