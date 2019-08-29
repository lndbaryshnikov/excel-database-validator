export const toggleElements = (mode: string, ...elements: (HTMLInputElement |
    HTMLSelectElement | HTMLButtonElement)[]): void => {
    let result: boolean;

    if ( mode === 'on' ) {
        result = false;
    } else if ( mode ==='off' ) {
        result = true;
    } else {
        throw new Error('mode can be only "on" or "off"');
    }

    elements.forEach( element => element.disabled = result );
};