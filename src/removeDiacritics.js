const removeDiacritics = (str) => {
    return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default removeDiacritics;

// console.log(removeDiacritics('Frédéric Patrick Jérôme') === 'Frederic Patrick Jerome');