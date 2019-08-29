export const addPropertyToErrors = (errors: any[], property: string, value: string) => {
    for (let i = 0; i < errors.length; i++) {
        if (errors[i] === undefined) continue;

        if (Array.isArray(errors[i])) {
            addPropertyToErrors(errors[i], property, value);

            continue;
        }
        errors[i][property] = value;
    }
};