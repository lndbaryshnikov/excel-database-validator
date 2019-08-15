const isOnlyNumbersValid = (value) => {
    const re = /^[0-9]+$/;

    return re.test(String(value));
};

export default isOnlyNumbersValid;


