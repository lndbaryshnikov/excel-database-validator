import validateEmail from "./isEmailValid";

const myFunc = (workbook) => {
    var first_sheet_name = workbook.SheetNames[0];
    var address_of_cell = 'D1824';

    /* Get worksheet */
    var worksheet = workbook.Sheets[first_sheet_name];

    /* Find desired cell */
    var desired_cell = worksheet[address_of_cell];

    /* Get the value */
    var desired_value = (desired_cell ? desired_cell.v : undefined);
    desired_value = String(desired_value).trim();

    console.log(desired_value);
    console.log(typeof desired_value);
    console.log(validateEmail(String(desired_value)));
    console.log(validateEmail('info@trafileriedisangiovanni.it'));
};

export default myFunc;