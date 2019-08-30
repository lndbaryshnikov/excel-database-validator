import {Elements} from "../MVP/ValidatorView";
import {selfDownloadFile} from "./selfDownLoadFile";

export const appendToElem = (root: HTMLElement, ...elements: HTMLElement[]): void => {
    elements.forEach(element => {
        root.append(element);
    });
};

export const create = (name: string, ...properties: string[][]): HTMLElement => {
    const element = document.createElement(name);

    properties.forEach((property: string[]) => {
        element.setAttribute(property[0], property[1]);
    });

    return element;
};

export const createDivWithClass = (className: string): HTMLDivElement => {
    return create('div',
        ['class', className]
    ) as HTMLDivElement;
};

export const createHeaderArea = (): Elements['headerArea'] => {
    const wrapper = createDivWithClass('header-area__wrapper');

    const name = create('div',
        ['class', 'header-area__name']
    ) as HTMLDivElement;
    name.innerHTML = 'Exsel Database Validator';

    appendToElem(wrapper, name);

    return {
        wrapper: wrapper,
        name: name
    };
};

export const createCustomFileInput = (): Elements['settingsArea']['fileInput'] => {
    const wrapper = createDivWithClass('file-input__wrapper');

    const input = create('input',
        ['class', 'file-input__input'],
        ['id', 'file-input__input'],
        ['type', 'file'],
        ['accept', '.xlsx']
    ) as HTMLInputElement;

    const label = create('label',
        ['class', 'file-input__label'],
        ['for', 'file-input__input']
    ) as HTMLLabelElement;

    const text = 'Choose a file (only .xlsx)...';

    label.innerHTML = text;

    input.addEventListener('change', () => {
        const file = (input as HTMLInputElement).files[0];

        if ( !!file ) label.innerHTML = file.name;
        else label.innerHTML = text;
    });

    appendToElem(wrapper, input, label);

    return {
        wrapper: wrapper,
        input: input
    };
};

export const createModeSelect = (): Elements['settingsArea']['modeSelect'] => {
    const wrapper = createDivWithClass('mode-select__wrapper');

    const sign = create('div',
        ['class', 'sign mode-select__sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Check for: ';

    const select = create('select',
        ['class', 'mode-select__select']
    ) as HTMLSelectElement;

    const createOption = (value: string, text: string): HTMLOptionElement => {
        const option = create('option',
            ['class', 'mode-select__option'],
            ['value', value]
        ) as HTMLOptionElement;

        option.innerHTML = text;

        return option;
    };

    appendToElem(select,
        createOption('none', 'Choose...'),
        createOption('email', 'Email Errors'),
        createOption('phone', 'Phone Number Errors'),
        createOption('site', 'Site Address Errors'),
        createOption('ws', 'Whitespaces'),
        createOption('numbers', 'Only Numbers Errors'),
        createOption('fullName', 'FullName Errors')
    );

    appendToElem(wrapper, sign, select);

    return {
        wrapper: wrapper,
        select: select
    }
};

export const createColInputs = (): Elements['settingsArea']['colInputs'] => {
    const wrapper = createDivWithClass('col-inputs__wrapper');

    const sign = create('div',
        ['class', 'sign col-inputs__sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Type column number: ';

    const firstInput = create('input',
        ['class', 'col-inputs__input'],
        ['type', 'text'],
        ['placeholder', 'Col']
    ) as HTMLInputElement;

    const secondInput = create('input',
        ['class', 'col-inputs__input'],
        ['type', 'text'],
        ['placeholder', 'SN']
    ) as HTMLInputElement;

    appendToElem(wrapper, sign, firstInput, secondInput);

    return {
        wrapper: wrapper,
        firstInput: firstInput,
        secondInput: secondInput
    }
};

export const createListInput = (): Elements['settingsArea']['listInput'] => {
    const wrapper = createDivWithClass('list-input__wrapper');

    const sign = create('div',
        ['class', 'sign list-input__sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Type lists number:';

    const input = create('input',
        ['class', 'list-input__input'],
        ['type', 'text']
    ) as HTMLInputElement;

    appendToElem(wrapper, sign, input);

    return {
        wrapper: wrapper,
        input: input
    }
};

export const createDisabledRunButton = (): Elements['settingsArea']['runButton'] => {
    const runButton = create('button',
        ['class', 'button run-button'],
        ['disabled', 'disabled']
    ) as HTMLButtonElement;

    runButton.innerHTML = 'VALIDATE';

    return runButton;
};

export const createSettingsArea = (): Elements['settingsArea'] => {
    const wrapper = createDivWithClass('settings-wrapper');

    const fileInput = createCustomFileInput();
    const modeSelect = createModeSelect();
    const colInputs = createColInputs();
    const listInput = createListInput();
    const runButton = createDisabledRunButton();

    appendToElem(wrapper,
        fileInput.wrapper,
        modeSelect.wrapper,
        colInputs.wrapper,
        listInput.wrapper,
        runButton
    );

    return {
        wrapper: wrapper,
        fileInput: fileInput,
        modeSelect: modeSelect,
        colInputs: colInputs,
        listInput: listInput,
        runButton: runButton
    };
};

export const createNoErrorsMessage = (): Elements['noErrorsMessage'] => {
    const message = create('div',
        ['class', 'no-errors-message']
    ) as HTMLDivElement;

    message.innerHTML = 'No errors were found.';

    return message;
};

export const createAnotherErrorsSign = () => {
    const sign = create('div',
        ['class', 'errors-area__another-errors-sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Another errors found:';

    return sign;
};

export const createErrorsArea = (): {wrapper: HTMLDivElement, anotherErrorsSign: HTMLDivElement} => {
    const wrapper = createDivWithClass('error-area__wrapper');

    const sign = create('div',
        ['class', 'error-area__sign']
    ) as HTMLDivElement;

    const anotherErrorsSign = createAnotherErrorsSign();

    sign.innerHTML = 'Errors list:';

    appendToElem(wrapper, sign);

    return {
        wrapper: wrapper,
        anotherErrorsSign: anotherErrorsSign
    };
};

export const createListErrorsBlock = (nameOfList: string, numberOfList: string | number)
    : {wrapper: HTMLDivElement, table: HTMLTableElement} => {

    const wrapper = createDivWithClass('list-errors__wrapper');
    const listName = createDivWithClass('list-errors__list-name');
    listName.innerHTML = `List No ${numberOfList} (${nameOfList})`;

    const table = create('table',
        ['class', 'list-errors__table'],
        ['border', '1px'],
    ) as HTMLTableElement;

    const header = create('tr',
        ['class', 'list-errors__table-header']
    ) as HTMLTableRowElement;

    const createHeaderCell = (text: string): HTMLTableCellElement => {
        const headerCell = create('td',
            ['class', 'list-errors__cell list-errors__header-cell']
        ) as HTMLTableCellElement;

        headerCell.innerHTML = text;

        return headerCell;
    };

    appendToElem(header,
        createHeaderCell('No'),
        createHeaderCell('ROW'),
        createHeaderCell('VALUE'),
        createHeaderCell('ERROR TYPE')
    );

    appendToElem(table, header);

    appendToElem(wrapper,
        listName,
        table);

    return {
        wrapper: wrapper,
        table: table
    }
};

export const createRowForErrorsTable = (number: string | number | null, row: string | number,
                                 value: string, error: string): HTMLTableRowElement => {
    const tableRow = create('tr',
        ['class', 'list-errors__table-row'],
    ) as HTMLTableRowElement;

    const createTableCell = (text: string | null): HTMLTableCellElement => {
        const tableCell = create('td',
            ['class', 'list-errors__cell list-errors__table-cell']
        ) as HTMLTableCellElement;

        if ( !!text ) {
            tableCell.innerHTML = text;
        }

        return tableCell;
    };

    appendToElem(tableRow,
        createTableCell(!number? null : String(number)),
        createTableCell(String(row)),
        createTableCell(value),
        createTableCell(error)
    );

    return tableRow;
};

export const createLogButton = (text: string): HTMLButtonElement => {
    const button = create('button',
        ['class', 'button log-download-button']
    ) as HTMLButtonElement;

    button.innerHTML = 'Download Report';

    button.addEventListener('click', () => {
        selfDownloadFile('report.txt', text);
    });

    return button;
};