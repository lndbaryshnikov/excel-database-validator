export const deleteElementFromDomIfItExists = (root: HTMLElement, element: HTMLElement): void => {
    if ( root.contains(element) ) {
        root.removeChild(element);
    }
};