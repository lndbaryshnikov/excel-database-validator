const isPhoneNumberValid = (phone) => {
    const re = /^[0-9]{1,3} [0-9]+$/;

    const newPhone = encodeURIComponent(String(phone)).replace('%C2%A0', '%20');
    phone = decodeURIComponent(newPhone);

    return re.test(String(phone));
};

export default isPhoneNumberValid;

