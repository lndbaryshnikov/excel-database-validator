import removeDiacritics from "../removeDiacritics";

export const isEmailValid = (trimmedEmail: string) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return re.test(trimmedEmail.toLowerCase());
};

export const isPhoneNumberValid = (trimmedPhone: string) => {
    const re = /^[0-9]{1,3} [0-9]+$/;

    const encodedPhone = encodeURIComponent(trimmedPhone)
        .replace('%C2%A0', '%20');

    trimmedPhone = decodeURIComponent(encodedPhone);

    return re.test(String(trimmedPhone));
};

export const isSiteAddressValid = (trimmedAddress: string) => {
    const re = /(^https?:\/\/)|(www\.)[a-z0-9~_\-\.]+\.[a-z]{2,9}(\/|:|\?[!-~]*)?$/i;

    return re.test(trimmedAddress);
};

export const isOnlyNumbersValid = (trimmedNumber: string) => {
    const re = /^[0-9]+$/;

    return re.test(trimmedNumber);
};

export const isNameValid = (trimmedValue: string) => {
    return /^[A-Za-z]+[A-Za-z -]+[A-Za-z]+$/.test(removeDiacritics(trimmedValue));
};

export const isCompanyNameValid = (trimmedCompanyName: string) => {
    return /^[A-Za-z ]+$/.test(trimmedCompanyName);
};
