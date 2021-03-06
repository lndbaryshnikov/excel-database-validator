import {Elements} from "../MVP/Validator/ValidatorView";
import {selfDownloadFile} from "./selfDownLoadFile";

const appendToElem = (root: HTMLElement, ...elements: HTMLElement[]): void => {
    elements.forEach(element => {
        root.append(element);
    });
};

const create = (name: string, ...properties: string[][]): HTMLElement => {
    const element = document.createElement(name);

    properties.forEach((property: string[]) => {
        element.setAttribute(property[0], property[1]);
    });

    return element;
};

const createDivWithClass = (className: string): HTMLDivElement => {
    return create('div',
        ['class', className]
    ) as HTMLDivElement;
};

const createHeaderArea = (): Elements['headerArea'] => {
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

const createCustomFileInput = (type: "main" | "second" = "main"): Elements['settingsArea']['mainFileInput'] => {
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

    const text = type === "main" ? "Choose a file (only .xlsx)..." : "Choose second file (only .xlsx)";

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

const createModeSelect = (): Elements['settingsArea']['modeSelect'] => {
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
        createOption('email', 'Email errors'),
        createOption('phone', 'Phone number errors'),
        createOption('site', 'Site address errors'),
        createOption('ws', 'Whitespaces'),
        createOption('numbers', 'Only Numbers'),
        createOption('fullName', 'FullName errors'),
        createOption('names', 'Names Errors'),
        createOption('companies', 'Companies errors'),
        createOption('countCompanies', 'Count companies'),
        createOption('matchingCompanies', 'Matching companies errors')
    );

    appendToElem(wrapper, sign, select);

    return {
        wrapper: wrapper,
        select: select
    }
};

const createColInputs = (): Elements['settingsArea']['colInputs'] => {
    const wrapper = createDivWithClass('col-inputs__wrapper');

    const sign = create('div',
        ['class', 'sign col-inputs__sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Type column: ';

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

const createListInput = (): Elements['settingsArea']['listInput'] => {
    const wrapper = createDivWithClass('lists-input__wrapper');

    const sign = create('div',
        ['class', 'sign lists-input__sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Type lists number:';

    const input = create('input',
        ['class', 'lists-input__input'],
        ['type', 'text']
    ) as HTMLInputElement;

    appendToElem(wrapper, sign, input);

    return {
        wrapper: wrapper,
        input: input
    }
};

const createDisabledRunButton = (): Elements['settingsArea']['runButton'] => {
    const runButton = create('button',
        ['class', 'button run-button'],
        ['disabled', 'disabled']
    ) as HTMLButtonElement;

    runButton.innerHTML = 'VALIDATE';

    return runButton;
};

const createSettingsArea = (): Elements['settingsArea'] => {
    const wrapper = createDivWithClass('settings-wrapper');

    const mainFileInput = createCustomFileInput();
    const secondFileInput = createCustomFileInput("second");
    const modeSelect = createModeSelect();
    const colInputs = createColInputs();
    const listInput = createListInput();
    const runButton = createDisabledRunButton();

    appendToElem(wrapper,
        mainFileInput.wrapper,
        secondFileInput.wrapper,
        modeSelect.wrapper,
        colInputs.wrapper,
        listInput.wrapper,
        runButton
    );

    return {
        wrapper: wrapper,
        mainFileInput: mainFileInput,
        secondFileInput: secondFileInput,
        modeSelect: modeSelect,
        colInputs: colInputs,
        listInput: listInput,
        runButton: runButton
    };
};

const createNoErrorsMessage = (): Elements['noErrorsMessage'] => {
    const message = create('div',
        ['class', 'no-errors-message']
    ) as HTMLDivElement;

    message.innerHTML = 'No errors were found.';

    return message;
};

const createAnotherErrorsSign = () => {
    const sign = create('div',
        ['class', 'errors-area__another-errors-sign']
    ) as HTMLDivElement;
    sign.innerHTML = 'Another errors found:';

    return sign;
};

const createErrorsArea = (): {wrapper: HTMLDivElement, anotherErrorsSign: HTMLDivElement} => {
    const wrapper = createDivWithClass('error-area__wrapper');

    const sign = create('div',
        ['class', 'error-area__sign']
    ) as HTMLDivElement;

    const anotherErrorsSign = createAnotherErrorsSign();

    sign.innerHTML = 'Result lists:';

    appendToElem(wrapper, sign);

    return {
        wrapper: wrapper,
        anotherErrorsSign: anotherErrorsSign
    };
};

const createListErrorsBlock = (nameOfList: string, numberOfList: string | number)
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

const createRowForErrorsTable = (number: string | number | null, row: string | number,
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

const createLogButton = (text: string): HTMLButtonElement => {
    const button = create('button',
        ['class', 'button log-download-button']
    ) as HTMLButtonElement;

    button.innerHTML = 'Download Report';

    button.addEventListener('click', () => {
        selfDownloadFile('report.txt', text);
    });

    return button;
};

export {
    appendToElem,
    create,
    createDivWithClass,
    createHeaderArea,
    createCustomFileInput,
    createModeSelect,
    createColInputs,
    createListInput,
    createDisabledRunButton,
    createSettingsArea,
    createNoErrorsMessage,
    createAnotherErrorsSign,
    createErrorsArea,
    createListErrorsBlock,
    createRowForErrorsTable,
    createLogButton
};
