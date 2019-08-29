import * as XLSX from "xlsx";

import {ErrorObject, Config, FullNameSheetErrors} from "./ValidatorModel";
import Observer from "../Observer";
import * as elements from "../ValidatorView.private/elements"
import {toggleElements} from "../ValidatorView.private/toggleElements";
import {doesHaveOnlyDigits} from "../doesHaveOnlyDigits";

export interface Elements {
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
        const headerArea = elements.createHeaderArea();
        const settingsArea = elements.createSettingsArea();
        const noErrorsMessage = elements.createNoErrorsMessage();
        const errorsArea = elements.createErrorsArea();

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

        elements.appendToElem(this.elements.root,
            this.elements.headerArea.wrapper,
            this.elements.settingsArea.wrapper,
        );

        this.elements.settingsArea.fileInput.input.onchange =
            this.elements.settingsArea.modeSelect.select.onchange =
                this.elements.settingsArea.colInputs.firstInput.oninput =
                    this.elements.settingsArea.colInputs.secondInput.oninput =
                        this.elements.settingsArea.listInput.input.oninput = () => {
                            this._refreshSettingsArea();
                        };

        this.elements.settingsArea.runButton.addEventListener('click', () => {
            this._validationStartedSubject.notifyObservers();
        });
    }

    whenValidationStarted(callback: (workbook: XLSX.WorkBook, options: Config) => void): void {
        this._validationStartedSubject.addObserver(
            () => {
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

                this._toggleSettings('off');

                this._cleanPage();

                const files = this.elements.settingsArea.fileInput.input.files, file = files[0];
                const reader = new FileReader();

                const that = this;

                reader.onload = function (e) {
                    // @ts-ignore
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});

                    callback(workbook, that.config);
                };
                reader.readAsArrayBuffer(file);
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
                const errorsListBlock = elements.createListErrorsBlock(listName, list);

                elements.appendToElem(this.elements.errorsArea.wrapper,
                    errorsListBlock.wrapper);

                await this._renderListErrors(currentList, errorsListBlock.table, errorsListForm, numeration);
            }
        };

        elements.appendToElem(this.elements.root,
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
                elements.appendToElem(
                    this.elements.errorsArea.wrapper,
                    this.elements.errorsArea.anotherErrorsSign
                );

                await loopAndRenderErrors(lackOfNamesErrors, 'array', 'in-course');
            }
        } else {
            await loopAndRenderErrors(workbookErrors as ErrorObject[][], 'array', 'in-course');
        }

        this.elements.logButton = elements.createLogButton(log);

        elements.appendToElem(this.elements.settingsArea.wrapper,
            this.elements.logButton);

        this._toggleSettings('on');
    }

    private async _renderListErrors(errorsList: (ErrorObject | ErrorObject[])[], table: HTMLTableElement,
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

                const tableRow = elements.createRowForErrorsTable(
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
                            elements.appendToElem(table, row)
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
        elements.appendToElem(this.elements.root,
            this.elements.noErrorsMessage);
    }

    showErrorMessage(error: string): void {
        alert(error);
    }

    private _refreshSettingsArea() {
            const mode: string = this.elements.settingsArea.modeSelect.select.value;

            this.elements.settingsArea.runButton.disabled = this._isSettingsCorrect();

            if (mode !== 'fullName') {
                this.elements.settingsArea.colInputs.secondInput.style.display = 'none';
                this.elements.settingsArea.colInputs.firstInput.placeholder = 'Col';
            } else {
                this.elements.settingsArea.colInputs.secondInput.style.display = 'block';
                this.elements.settingsArea.colInputs.firstInput.placeholder = 'FN';
            }
    };

    private _isSettingsCorrect(): boolean {
        const mode: string = this.elements.settingsArea.modeSelect.select.value;

        if ( mode === 'fullName') {
            return ( this.elements.settingsArea.fileInput.input.files[0] &&
                ( this.elements.settingsArea.modeSelect.select.selectedIndex !== 0 ) &&
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.firstInput.value) ) &&
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.secondInput.value) ) &&
                ( this._isListNumberCorrect() )
            );
        } else {
            return ( this.elements.settingsArea.fileInput.input.files[0] &&
                ( this.elements.settingsArea.modeSelect.select.selectedIndex !== 0 ) &&
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.firstInput.value) ) &&
                ( this._isListNumberCorrect() )
            );
        }
    }

    private _cleanPage() {
        if ( this.elements.root.contains(this.elements.errorsArea.wrapper) ) {
            this.elements.errorsArea.wrapper.remove();

            this.elements.errorsArea = elements.createErrorsArea();
        }

        if ( this.elements.root.contains(this.elements.logButton) ) {
            this.elements.logButton.remove();

            this.elements.logButton = null;
        }

        if ( this.elements.root.contains(this.elements.noErrorsMessage) ) {
            this.elements.noErrorsMessage.remove();
        }
    }

    private _isListNumberCorrect(): boolean {
        const list = this.elements.settingsArea.listInput.input.value;

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
    }

    private _toggleSettings(mode: string): void {
        toggleElements(mode,
            this.elements.settingsArea.fileInput.input,
            this.elements.settingsArea.modeSelect.select,
            this.elements.settingsArea.colInputs.firstInput,
            this.elements.settingsArea.colInputs.secondInput,
            this.elements.settingsArea.listInput.input,
            this.elements.settingsArea.runButton);
    }
}