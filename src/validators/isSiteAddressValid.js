const isSiteAddressValid = (address) => {
    const re = /(^https?:\/\/)|(www\.)[a-z0-9~_\-\.]+\.[a-z]{2,9}(\/|:|\?[!-~]*)?$/i;

    return re.test(String(address));
};

export default isSiteAddressValid;