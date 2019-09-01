import * as XLSX from "xlsx";

import {Config} from "./ValidatorModel";
import Observer from "../Observer";
import * as elements from "../ValidatorView.private/elements"
import {toggleElements} from "../ValidatorView.private/toggleElements";
import {doesHaveOnlyDigits} from "../doesHaveOnlyDigits";
import ErrorsView from "./Errors/ErrorsView";
import logView from "./Log/LogView";

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
    errorsArea: HTMLDivElement;
    logButton: null | HTMLElement;
}

interface renderValidatorUI {
    elements: Elements;
    renderUI(): void;
    renderErrors(errorsView: ErrorsView, logView: logView): Promise<void>,
    whenValidationStarted(callback: (workbook: XLSX.WorkBook, options: Config) => void): void;
}

export default class ValidatorView implements  renderValidatorUI {
    elements: Elements;
    config: Config;
    private _validationStartedSubject = new Observer();

    constructor() {
        const headerArea = elements.createHeaderArea();
        const settingsArea = elements.createSettingsArea();
        const errorsArea = document.createElement('div');
        const noErrorsMessage = elements.createNoErrorsMessage();

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
            errorsArea: errorsArea,
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
                    mode: this.elements.settingsArea.modeSelect.select.value as Config['mode'],
                    row: '2',
                    cols: {
                        firstCol: this.elements.settingsArea.colInputs.firstInput.value.trim(),
                        secondCol: this.elements.settingsArea.colInputs.secondInput.value.trim()
                    },
                    lists: this.elements.settingsArea.listInput.input.value.replace(/ /g, ''),
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

    async renderErrors(errorsView: ErrorsView, logView?: logView): Promise<void> {
        this.elements.root.append(this.elements.errorsArea);

        await errorsView.render(this.elements.errorsArea);

        if ( !!logView ) {
            this.elements.logButton = logView.html;

            logView.render(this.elements.settingsArea.wrapper);
        }

        this._toggleSettings('on');
    }

    showNoErrorsMessage() {
        elements.appendToElem(this.elements.root,
            this.elements.noErrorsMessage);

        this._toggleSettings('on');
    }

    processErrorMessage(error: string): void {
        alert(error);

        this._toggleSettings('on');
    }

    private _refreshSettingsArea() {
            const mode: string = this.elements.settingsArea.modeSelect.select.value;

            this.elements.settingsArea.runButton.disabled = !this._isSettingsCorrect();

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
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.firstInput.value.trim()) ) &&
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.secondInput.value.trim()) ) &&
                ( this._isListNumberCorrect() )
            );
        } else {
            return ( this.elements.settingsArea.fileInput.input.files[0] &&
                ( this.elements.settingsArea.modeSelect.select.selectedIndex !== 0 ) &&
                ( doesHaveOnlyDigits(this.elements.settingsArea.colInputs.firstInput.value.trim()) ) &&
                ( this._isListNumberCorrect() )
            );
        }
    }

    private _cleanPage() {
        if ( this.elements.root.contains(this.elements.errorsArea) ) {
            this.elements.errorsArea.remove();

            this.elements.errorsArea = document.createElement('div');
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