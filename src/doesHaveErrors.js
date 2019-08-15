const doesHaveErrors = (errors) => {
    let result = false;

    for (let i = 0; i < errors.length; i++) {
        if (errors[i].length !== 0) result = true;
    }

    return result;
};

export default  doesHaveErrors;