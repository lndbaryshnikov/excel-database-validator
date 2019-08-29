export const cleanElement = (element: HTMLElement): void => {
    if ( element.children.length === 0 ) return;

    for (let i = 0; i < element.children.length; i++ ) {
        element.children[i].remove();
    }
};
