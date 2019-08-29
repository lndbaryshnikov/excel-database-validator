const doErrorsExist = (errors: any[]): boolean => {
    if ( errors.length === 0 ) return false;

    for (let i = 0; i < errors.length; i++) {
        if ( !Array.isArray(errors[i]) ) {
            return true;
        } else if ( doErrorsExist(errors[i]) ) {
            return true;
        }
    }

    return false;
};