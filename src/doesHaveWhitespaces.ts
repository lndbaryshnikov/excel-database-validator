const doesHaveWhitespaces = (string: string) => {
    return !(string === string.trim());
};

export default doesHaveWhitespaces;