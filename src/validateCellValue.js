import doesHaveWhitespaces from "./doesHaveWhitespaces";
import isEmailValid from "./validators/isEmailValid";
import isPhoneNumberValid from "./validators/isPhoneNumberValid";
import isSiteAddressValid from "./validators/isSiteAddressValid";
import isOnlyNumbersValid from "./validators/isOnlyNumbersValid";

const validateCellValue = (cellValue, _config)  => {
    let isValid;
    let error = false;
    const trimmedCellValue = String(cellValue).trim();

    const config = String(_config);

    if ( config === "email"   )  isValid = isEmailValid(trimmedCellValue);
    if ( config === "phone"   )  isValid = isPhoneNumberValid(trimmedCellValue);
    if ( config === "site"    )  isValid = isSiteAddressValid(trimmedCellValue);
    if ( config === "numbers" )  isValid = isOnlyNumbersValid(trimmedCellValue);
    if ( config === "ws"      )  isValid = true;

    if ( doesHaveWhitespaces(cellValue) || !isValid) {
        if (!isValid && doesHaveWhitespaces(cellValue)) {
            error = "incorrect/whitespaces";
        } else if (!isValid) {
            error = "incorrect";
        } else error = "whitespaces";
    }

    return error;
};

export default validateCellValue;