import * as XLSX from "xlsx";

import {ErrorObject, Config, FullNameSheetErrors} from "./ValidatorModel";
import Observer from "./Observer";
import doesHaveWhitespaces from "../doesHaveWhitespaces";
import selfDownloadFile from "../selfDownloadFile";

interface Elements {
    root: HTMLElement;
    headerArea: {
        wrapper: HTMLDivElement,
        name: HTMLDivElement;
    }
    settingsArea: {
        wrapper: HTMLDivElement;
        fileInput: {
            wrapper: HTMLDivElement;
            input: HTMLInputElement;
        };
        modeSelect: {
            wrapper: HTMLDivElement;
            select: HTMLSelectElement;
        };
        colInputs: {
            wrapper: HTMLDivElement;
            firstInput: HTMLInputElement;
            secondInput: HTMLInputElement;
        }
        listInput: {
            wrapper: HTMLDivElement;
            input: HTMLInputElement;
        }
        runButton: HTMLButtonElement;
    }
    noErrorsMessage: HTMLDivElement;
    errorsArea: {
        wrapper: HTMLDivElement;
        anotherErrorsSign: HTMLDivElement;
    };
    logButton: HTMLButtonElement | null;
}

interface renderValidatorUI {
    elements: Elements;
    renderUI(): void;
    renderErrors(workbookErrors: ErrorObject[][]): void,
    whenValidationStarted(callback: (workbook: XLSX.WorkBook, options: Config) => void): void;
}

export default class ValidatorView implements  renderValidatorUI {
    elements: Elements;
    config: Config;
    private _validationStartedSubject = new Observer();

    constructor() {
        const headerArea = this._createElements().createHeaderArea();
        const settingsArea = this._createElements().createSettingsArea();
        const noErrorsMessage = this._createElements().createNoErrorsMessage();
        const errorsArea = this._createElements().createErrorsArea();

        this.elements = {
            root: document.body,
            headerArea: {
                wrapper: headerArea.wrapper,
                name: headerArea.name,
            },
            settingsArea: {
                wrapper: settingsArea.wrapper,
                fileInput: {
                    wrapper: settingsArea.fileInput.wrapper,
                    input: settingsArea.fileInput.input,
                },
                modeSelect: {
                    wrapper: settingsArea.modeSelect.wrapper,
                    select: settingsArea.modeSelect.select
                },
                colInputs: {
                    wrapper: settingsArea.colInputs.wrapper,
                    firstInput: settingsArea.colInputs.firstInput,
                    secondInput: settingsArea.colInputs.secondInput
                },
                listInput: {
                    wrapper: settingsArea.listInput.wrapper,
                    input: settingsArea.listInput.input
                },
                runButton: settingsArea.runButton,
            },
            noErrorsMessage: noErrorsMessage,
            errorsArea: {
                wrapper: errorsArea.wrapper,
                anotherErrorsSign: errorsArea.anotherErrorsSign
            },
            logButton: null
        };
    }

    renderUI(): void {

        this.elements.settingsArea.colInputs.secondInput.style.display = 'none';

        this._appendToElem(this.elements.root,
            this.elements.headerArea.wrapper,
            this.elements.settingsArea.wrapper,
        );

        const handlers = this._createHandlers();

        handlers.setHandlerForSettingsChange();
        handlers.setHandlerForRunButtonClick();
    }

    whenValidationStarted(callback: (workbook: XLSX.WorkBook, options: Config) => void): void {
        this._validationStartedSubject.addObserver(
            (workbook: XLSX.WorkBook) => {
                this.config = {
                    mode: this.elements.settingsArea.modeSelect.select.value,
                    row: '2',
                    cols: {
                        firstCol: this.elements.settingsArea.colInputs.firstInput.value,
                        secondCol: this.elements.settingsArea.colInputs.secondInput.value
                    },
                    list: this.elements.settingsArea.listInput.input.value.replace(/ /g, ''),
                    fileName: this.elements.settingsArea.fileInput.input.files[0].name
                };

                callback(workbook, this.config);
            }
        );
    }

    async renderErrors(workbookErrors: ErrorObject[][] | FullNameSheetErrors[], log?: string): Promise<void> {
        const loopAndRenderErrors = async (workbookErrors: ErrorObject[][] | ErrorObject[][][],
                                           errorsListForm: 'array-in-array' | 'array', numeration: 'group' | 'in-course'): Promise<void> => {
            for (let i = 0; i < workbookErrors.length; i++) {
                const currentList = workbookErrors[i];

                if ( currentList.length === 0 ) continue;

                let list, listName;
                if ( Array.isArray(currentList[i]) ) {
                    list = (currentList as ErrorObject[][])[0][0].list;
                    listName = (currentList as ErrorObject[][])[0][0].listName;
                } else {
                    list = (currentList as ErrorObject[])[0].list;
                    listName = (currentList as ErrorObject[])[0].listName;
                }
                const errorsListBlock = this._createElements().createListErrorsBlock(listName, list);

                this._appendToElem(this.elements.errorsArea.wrapper,
                    errorsListBlock.wrapper);

                await this._renderListErrors(currentList, errorsListBlock.table, errorsListForm, numeration);
            }
        };

        this._appendToElem(this.elements.root,
            this.elements.errorsArea.wrapper);

        if ( this.config.mode === 'fullName' ) {
            const convertFullNameErrors = (errorsArray: FullNameSheetErrors[]):
                {lackOfNamesErrors: ErrorObject[][] | false; matchErrors: ErrorObject[][][] | false;} => {
                let lackOfNames: ErrorObject[][] | false = [];
                let match: ErrorObject[][][] | false = [];

                errorsArray.forEach( (errorObject) => {
                    if ( errorObject.lackOfNamesErrors !== false ) (lackOfNames as ErrorObject[][]).push(errorObject.lackOfNamesErrors);

                    if ( errorObject.matchErrors !== false ) (match as ErrorObject[][][]).push(errorObject.matchErrors);
                });

                if ( lackOfNames.length === 0 ) lackOfNames = false;
                if ( match.length === 0 ) match = false;

                return {
                    lackOfNamesErrors: lackOfNames,
                    matchErrors: match
                }
            };

            const errors = convertFullNameErrors(workbookErrors as FullNameSheetErrors[]);

            const matchErrors = errors.matchErrors;
            const lackOfNamesErrors = errors.lackOfNamesErrors;

            if ( matchErrors !== false ) {
                await loopAndRenderErrors(matchErrors, 'array-in-array', 'group');
            }

            if ( lackOfNamesErrors !== false ) {
                this._appendToElem(
                    this.elements.errorsArea.wrapper,
                    this.elements.errorsArea.anotherErrorsSign
                );

                await loopAndRenderErrors(lackOfNamesErrors, 'array', 'in-course');
            }
        } else {
            await loopAndRenderErrors(workbookErrors as ErrorObject[][], 'array', 'in-course');
        }

        this.elements.logButton = this._createElements().createLogButton(log);

        this._appendToElem(this.elements.settingsArea.wrapper,
            this.elements.logButton);

        this.toggleSettings('on');
    }

    private async _renderListErrors (errorsList: (ErrorObject | ErrorObject[])[], table: HTMLTableElement,
                                     listForm: 'array-in-array' | 'array', numeration: 'group' | 'in-course'): Promise<void> {
        const loopAndRenderErrorsArray = async (errors: ErrorObject[],
                                                table: HTMLTableElement, numeration: 'group' | 'in-course', numberToRender?: number | '') => {

            for (let i = 0; i < errors.length; i++) {
                const currentErrorObject = errors[i] as ErrorObject;

                let errorNumber;

                if ( numeration === 'group' && !!numberToRender ) {
                    errorNumber = numberToRender;
                }
                if ( numeration === 'in-course' && !numberToRender ) errorNumber = i + 1;

                const tableRow = this._createElements().createRowForErrorsTable(
                    errorNumber,
                    currentErrorObject.row,
                    currentErrorObject.value,
                    currentErrorObject.error
                );

                const getRowThroughTimeout = async (row: HTMLTableRowElement) => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(row);
                        }, 200);
                    });
                };

                await getRowThroughTimeout(tableRow)
                    .then((row: HTMLTableRowElement) => {
                            this._appendToElem(table, row)
                        },
                        null);

                numberToRender = undefined;
            }
        };

        if ( listForm === 'array-in-array' ) {
            for (let i = 0; i < (errorsList as ErrorObject[][]).length; i++) {
                await loopAndRenderErrorsArray((errorsList as ErrorObject[][])[i], table, numeration, i + 1);
            }
        }

        if ( listForm === 'array' ) {
            await loopAndRenderErrorsArray((errorsList as ErrorObject[]), table, numeration);
        }
    }

    showNoErrorsMessage() {
        this._appendToElem(this.elements.root,
            this.elements.noErrorsMessage);
    }

    private _createHandlers() {
        const isSettingsCorrect = (mode: string, fileInput: HTMLInputElement, modeSelect: HTMLSelectElement,
                                   firstColInput: HTMLInputElement, secondColInput: HTMLInputElement,
                                   listInput: HTMLInputElement): boolean => {
            const doesHaveOnlyDigits = (value: string): boolean => {
                return /^\d+$/.test(value);
            };

            const isListCorrect = (list: string): boolean => {
                if ( list === '' ) return true;

                const noWs = list.replace(/ /g, '');

                if ( doesHaveOnlyDigits(noWs) ) return true;

                if ( noWs.match(/,/) !== null ) {
                    if ( doesHaveOnlyDigits(noWs.replace(/,/g, '')) ) {
                        return true;
                    }
                }

                if ( (noWs.match(/-/).length === 1) ) {
                    if ( doesHaveOnlyDigits(noWs.replace(/-/, '')) ) {
                        return true;
                    }
                }

                return false;
            };

            if ( mode === 'fullName') {
                return ( fileInput.files[0] &&
                       ( modeSelect.selectedIndex !== 0 ) &&
                       ( doesHaveOnlyDigits(firstColInput.value) ) &&
                       ( doesHaveOnlyDigits(secondColInput.value) ) &&
                       ( isListCorrect(listInput.value) )
                );
            } else {
                return ( fileInput.files[0] &&
                       ( modeSelect.selectedIndex !== 0 ) &&
                       ( doesHaveOnlyDigits(firstColInput.value) ) &&
                       ( isListCorrect(listInput.value) )
                );
            }
        };

        const settingsChangeHandler = ():void => {

            const handler = () => {
                const fileInput = this.elements.settingsArea.fileInput.input;
                const modeSelect = this.elements.settingsArea.modeSelect.select;
                const firstColInput = this.elements.settingsArea.colInputs.firstInput;
                const secondColInput = this.elements.settingsArea.colInputs.secondInput;
                const listInput = this.elements.settingsArea.listInput.input;
                const runButton = this.elements.settingsArea.runButton;

                const mode: string = this.elements.settingsArea.modeSelect.select.value;

                runButton.disabled = !isSettingsCorrect(mode, fileInput, modeSelect, firstColInput, secondColInput,
                    listInput);

                if ( mode !== 'fullName' ) {
                    secondColInput.style.display = 'none';
                    firstColInput.placeholder = 'Col';
                } else {
                    secondColInput.style.display = 'block';
                    firstColInput.placeholder = 'FN';
                }
            };

            this.elements.settingsArea.fileInput.input.onchange =
              this.elements.settingsArea.modeSelect.select.onchange =
                this.elements.settingsArea.colInputs.firstInput.oninput =
                  this.elements.settingsArea.colInputs.secondInput.oninput =
                    this.elements.settingsArea.listInput.input.oninput = handler;
        };

        const runButtonClickHandler = (): void => {
            const handler = () => {
                this.toggleSettings('off');

                this._cleanPage();

                const files = this.elements.settingsArea.fileInput.input.files, file = files[0];
                const reader = new FileReader();

                const that = this;

                reader.onload = function (e) {
                    // @ts-ignore
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});

                    that._validationStartedSubject.notifyObservers(workbook as any);
                };
                reader.readAsArrayBuffer(file);
            };

            this.elements.settingsArea.runButton.addEventListener('click', handler);
        };

        return {
            setHandlerForSettingsChange: settingsChangeHandler,
            setHandlerForRunButtonClick: runButtonClickHandler
        }
    }

    private _cleanPage() {
        if ( this.elements.root.contains(this.elements.errorsArea.wrapper) ) {
            this.elements.errorsArea.wrapper.remove();

            this.elements.errorsArea = this._createElements().createErrorsArea();
        }

        if ( this.elements.root.contains(this.elements.logButton) ) {
            this.elements.logButton.remove();

            this.elements.logButton = null;
        }

        if ( this.elements.root.contains(this.elements.noErrorsMessage) ) {
            this.elements.noErrorsMessage.remove();
        }
    }

    private _createElements() {
        const createWithAttr = (name: string, ...properties: string[][]): HTMLElement => {
                const element = document.createElement(name);

                properties.forEach((property: string[]) => {
                    element.setAttribute(property[0], property[1]);
                });

                return element;
        };

        const createDivWithClass = (className: string): HTMLDivElement => {
            return createWithAttr('div',
                ['class', className]
            ) as HTMLDivElement;
        };

        const createHeaderArea = (): Elements['headerArea'] => {
            const wrapper = createDivWithClass('header-area__wrapper');

            const name = createWithAttr('div',
                ['class', 'header-area__name']
            ) as HTMLDivElement;
            name.innerHTML = 'Exsel Database Validator';

            this._appendToElem(wrapper, name);

            return {
                wrapper: wrapper,
                name: name
            };
        };

        const createCustomFileInput = (): Elements['settingsArea']['fileInput'] => {
            const wrapper = createDivWithClass('file-input__wrapper');

            const input = createWithAttr('input',
                ['class', 'file-input__input'],
                          ['id', 'file-input__input'],
                          ['type', 'file'],
                          ['accept', '.xlsx']
            ) as HTMLInputElement;

            const label = createWithAttr('label',
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

            this._appendToElem(wrapper, input, label);

            return {
                wrapper: wrapper,
                input: input
            };
        };

        const createModeSelect = (): Elements['settingsArea']['modeSelect'] => {
            const wrapper = createDivWithClass('mode-select__wrapper');

            const sign = createWithAttr('div',
                ['class', 'sign mode-select__sign']
            ) as HTMLDivElement;
            sign.innerHTML = 'Check for: ';

            const select = createWithAttr('select',
                ['class', 'mode-select__select']
            ) as HTMLSelectElement;

            const createOption = (value: string, text: string): HTMLOptionElement => {
                const option = createWithAttr('option',
                    ['class', 'mode-select__option'],
                    ['value', value]
                ) as HTMLOptionElement;

                option.innerHTML = text;

                return option;
            };

            this._appendToElem(select,
                createOption('none', 'Choose...'),
                createOption('email', 'Email Errors'),
                createOption('phone', 'Phone Number Errors'),
                createOption('site', 'Site Address Errors'),
                createOption('ws', 'Whitespaces'),
                createOption('numbers', 'Only Numbers Errors'),
                createOption('fullName', 'FullName Errors')
            );

            this._appendToElem(wrapper, sign, select);

            return {
                wrapper: wrapper,
                select: select
            }
        };

        const createColInputs = (): Elements['settingsArea']['colInputs'] => {
            const wrapper = createDivWithClass('col-inputs__wrapper');

            const sign = createWithAttr('div',
                ['class', 'sign col-inputs__sign']
            ) as HTMLDivElement;
            sign.innerHTML = 'Type column number: ';

            const firstInput = createWithAttr('input',
                ['class', 'col-inputs__input'],
                ['type', 'text'],
                ['placeholder', 'Col']
            ) as HTMLInputElement;

            const secondInput = createWithAttr('input',
                ['class', 'col-inputs__input'],
                ['type', 'text'],
                ['placeholder', 'SN']
            ) as HTMLInputElement;

            this._appendToElem(wrapper, sign, firstInput, secondInput);

            return {
                wrapper: wrapper,
                firstInput: firstInput,
                secondInput: secondInput
            }
        };

        const createListInput = (): Elements['settingsArea']['listInput'] => {
            const wrapper = createDivWithClass('list-input__wrapper');

            const sign = createWithAttr('div',
                ['class', 'sign list-input__sign']
            ) as HTMLDivElement;
            sign.innerHTML = 'Type lists number:';

            const input = this._createElements().create('input',
                ['class', 'list-input__input'],
                ['type', 'text']
            ) as HTMLInputElement;

            this._appendToElem(wrapper, sign, input);

            return {
                wrapper: wrapper,
                input: input
            }
        };

        const createDisabledRunButton = (): Elements['settingsArea']['runButton'] => {
            const runButton = createWithAttr('button',
                ['class', 'button run-button'],
                ['disabled', 'disabled']
            ) as HTMLButtonElement;

            runButton.innerHTML = 'VALIDATE';

            return runButton;
        };

        const createSettingsArea = (): Elements['settingsArea'] => {
            const wrapper = createDivWithClass('settings-wrapper');

            const fileInput = createCustomFileInput();
            const modeSelect = createModeSelect();
            const colInputs = createColInputs();
            const listInput = createListInput();
            const runButton = createDisabledRunButton();

            this._appendToElem(wrapper,
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

        const createNoErrorsMessage = (): Elements['noErrorsMessage'] => {
            const message = createWithAttr('div',
                ['class', 'no-errors-message']
            ) as HTMLDivElement;

            message.innerHTML = 'No errors were found.';

            return message;
        };

        const createAnotherErrorsSign = () => {
            const sign = createWithAttr('div',
                ['class', 'another-errors-sign']
            ) as HTMLDivElement;
            sign.innerHTML = 'Another errors found:';

            return sign;
        };

        const createErrorsArea = (): Elements['errorsArea'] => {
            const wrapper = createDivWithClass('error-area__wrapper');

            const sign = createWithAttr('div',
                ['class', 'error-area__sign']
            ) as HTMLDivElement;

            const anotherErrorsSign = createAnotherErrorsSign();

            sign.innerHTML = 'Errors list:';

            this._appendToElem(wrapper, sign);

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

            const table = createWithAttr('table',
                ['class', 'list-errors__table'],
                ['border', '1px'],
            ) as HTMLTableElement;

            const header = createWithAttr('tr',
                ['class', 'list-errors__table-header']
            ) as HTMLTableRowElement;

            const createHeaderCell = (text: string): HTMLTableCellElement => {
                const headerCell = createWithAttr('td',
                    ['class', 'list-errors__cell list-errors__header-cell']
                ) as HTMLTableCellElement;

                headerCell.innerHTML = text;

                return headerCell;
            };

            this._appendToElem(header,
                createHeaderCell('No'),
                createHeaderCell('ROW'),
                createHeaderCell('VALUE'),
                createHeaderCell('ERROR TYPE')
            );

            this._appendToElem(table, header);

            this._appendToElem(wrapper,
                listName,
                table);

            return {
                wrapper: wrapper,
                table: table
            }
        };

        const createRowForErrorsTable = (number: string | number | null, row: string | number,
                                         value: string, error: string): HTMLTableRowElement => {
            const tableRow = createWithAttr('tr',
                ['class', 'list-errors__table-row'],
            ) as HTMLTableRowElement;

            const createTableCell = (text: string | null): HTMLTableCellElement => {
                const tableCell = createWithAttr('td',
                    ['class', 'list-errors__cell list-errors__table-cell']
                ) as HTMLTableCellElement;

                if ( !!text ) {
                    tableCell.innerHTML = text;
                }

                return tableCell;
            };

            this._appendToElem(tableRow,
                createTableCell(!number? null : String(number)),
                createTableCell(String(row)),
                createTableCell(value),
                createTableCell(error)
            );

            return tableRow;
        };

        const createLogDownloadButton = (text: string): HTMLButtonElement => {
            const button = createWithAttr('button',
            ['class', 'button log-download-button']
            ) as HTMLButtonElement;

            button.innerHTML = 'Download Report';

            button.addEventListener('click', () => {
                this._selfDownloadFile('report.txt', text);
            });

            return button;
        };

        return {
            create: createWithAttr,
            createHeaderArea: createHeaderArea,
            createSettingsArea: createSettingsArea,
            createNoErrorsMessage: createNoErrorsMessage,
            createErrorsArea: createErrorsArea,
            createListErrorsBlock: createListErrorsBlock,
            createRowForErrorsTable: createRowForErrorsTable,
            createAnotherErrorsSign: createAnotherErrorsSign(),
            createLogButton: createLogDownloadButton
        }
    }

    private _selfDownloadFile(filename: string, text: string): void {
        const element = document.createElement('a');

        element.setAttribute('href',
            'data:text/plain;charset=utf-8,'
            + encodeURIComponent(text));

        element.setAttribute('download', filename);

        element.style.display = 'none';

        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    };

    private _appendToElem(root: HTMLElement, ...elements: HTMLElement[]): void {
        elements.forEach(element => {
            root.append(element);
        });
    }

    private _toggleElements(mode: string, ...elements: (HTMLInputElement |
        HTMLSelectElement | HTMLButtonElement)[]): void {
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

    private toggleSettings(mode: string): void {
        const fileInput = this.elements.settingsArea.fileInput.input;
        const modeSelect = this.elements.settingsArea.modeSelect.select;
        const firstColInput = this.elements.settingsArea.colInputs.firstInput;
        const secondColInput = this.elements.settingsArea.colInputs.secondInput;
        const listInput = this.elements.settingsArea.listInput.input;
        const runButton = this.elements.settingsArea.runButton;

        this._toggleElements(mode, runButton, fileInput, modeSelect, firstColInput, secondColInput, listInput);
    }

    private _deleteElementFromDomIfItExists(root: HTMLElement, element: HTMLElement): void {
        console.log('i\'m here');
        if ( root.contains(element) ) {
            console.log(true);
            root.removeChild(element);
        }
    };

    private _cleanElement(element: HTMLElement): void {
        if ( element.children.length === 0 ) return;

        for (let i = 0; i < element.children.length; i++ ) {
            element.children[i].remove();
        }
    }

    private _doErrorsExist(errors: any[]): boolean {
        if ( errors.length === 0 ) return false;

        for (let i = 0; i < errors.length; i++) {
            if ( !Array.isArray(errors[i]) ) {
                return true;
            } else if ( this._doErrorsExist(errors[i]) ) {
                return true;
            }
        }

        return false;
    }
}