import selfDownloadFile from "./selfDownloadFile";

export const appendToElem = (root, ...elems) => {
    for (let i= 0; i < elems.length; i++) {
        root.append(elems[i]);
    }
};

export const createHeader = () => {
    const header = document.createElement('div');

    header.setAttribute("class", "header");
    header.innerHTML = "Exsel Database Validator";

    return header;
};

export const createInput = () => {
    const wrapper = document.createElement('div');
    const input = document.createElement('input');
    const label = document.createElement('label');

    wrapper.setAttribute('class', 'input-wrapper');

    input.setAttribute('class', 'input');
    input.setAttribute('id', 'input');

    label.setAttribute('class', 'input-label');
    label.setAttribute('for', 'input');

    const labelText = 'Choose a file (only .xlsx)...';
    label.innerHTML = labelText;

    input.addEventListener('change', () => {
        const file = input.files[0];
        if ( !!file ) {
            label.innerHTML = file.name;
        } else label.innerHTML = labelText;

    });

    input.type = "file";
    input.accept = ".xlsx";

    appendToElem(wrapper, input, label);

    return {
        init: wrapper,
        input: input
    };
};

export const createRunButton = () => {
    const runButton = document.createElement('button');

    runButton.innerHTML = "Analyze";
    runButton.setAttribute("class", "run-button button");
    runButton.disabled = true;

    return runButton;
};

export const createResultText = () => {
    const resultText = document.createElement('div');

    resultText.setAttribute('class', 'result-text');

    return resultText;
};

export const createListNumber = (number, name) => {
    const listNumber = document.createElement('div');

    listNumber.setAttribute('class', 'error-block__list-number');
    listNumber.innerHTML = `List No ${number} (${name})`;

    return listNumber;
};

export const createTableCell = (text) => {
    const cell = document.createElement('td');

    cell.setAttribute('class', 'error-block__table-cell');
    cell.innerHTML = text;

    return cell;
};


export const createTable = () => {
    const table = document.createElement('table');
    table.setAttribute('border', '1px');
    table.setAttribute('class', 'error-block__table');
    return table;
};

export const createTableHeader = () => {
    const tableHeader = document.createElement('tr');

    tableHeader.setAttribute('class', 'error-block__table-header');

    appendToElem(tableHeader,
        createTableCell('No'),
        createTableCell('ROW'),
        createTableCell('VALUE'),
        createTableCell('ERROR TYPE')
    );

    return tableHeader;
};

export const createTableRow = () => {
    const tr = document.createElement('tr');

    tr.setAttribute('class', 'error-block__table-tow')

    return tr;
};

export const createErrorsBlock = () => {
    const errorsBlock = document.createElement('div');

    errorsBlock.setAttribute('class', 'error-block');

    return errorsBlock;
};

export const createPageWrapper = () => {
    const wrapper = document.createElement('div');

    wrapper.setAttribute('class', 'settings-wrapper');

    return wrapper;
};

export const createErrorsDownloadButton = (filename, text) => {
    const button = document.createElement('button');

    button.setAttribute('class', 'error-block__download-button button');
    button.innerHTML = 'Download Report';

    button.addEventListener('click', () => {
        selfDownloadFile(filename, text);
    });

    return button;
};

export const createSelectOption = (value, text) => {
    const option = document.createElement('option');

    option.setAttribute('class', 'options_select-option');

    option.innerHTML = text;
    option.value = value;

    return option;
};

export const createOptionSelect = () => {
    const select = document.createElement('select');

    select.setAttribute('class', 'options_select');

    appendToElem(select,
        createSelectOption('none', 'Choose...'),
        createSelectOption('email', 'Email ValueWorkbookErrors'),
        createSelectOption('phone', 'Phone Number ValueWorkbookErrors'),
        createSelectOption('site', 'Site Address ValueWorkbookErrors'),
        createSelectOption('ws', 'Whitespaces'),
        createSelectOption('numbers', 'Only Numbers ValueWorkbookErrors')
    );

    return select;
};

export const createInputForChoosingCol = () => {
    const input = document.createElement('input');

    input.type = 'text';
    input.setAttribute('class', 'col-input');

    return input;
};

export const createDivWithClassAndText = (className, text) => {
    const elem = document.createElement('div');

    elem.setAttribute('class', className);
    elem.innerHTML = text;

    return elem;
};

