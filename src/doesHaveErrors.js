const doesHaveErrors = (errors) => {
    if ( errors.length === 0 ) return false;

    for (let i = 0; i < errors.length; i++) {
        if ( !Array.isArray(errors[i]) ) {
            return true;
        } else if ( doesHaveErrors(errors[i]) ) {
            return true;
        }
    }

    return false;
};

export default  doesHaveErrors;