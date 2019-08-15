const doesHaveWhitespaces = (word) => {
    return !(String(word) === String(word).trim());
};

export default doesHaveWhitespaces;
