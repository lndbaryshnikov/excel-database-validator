export const doesHaveOnlyDigits = (value: string): boolean => {
    return /^\d+$/.test(value);
};

