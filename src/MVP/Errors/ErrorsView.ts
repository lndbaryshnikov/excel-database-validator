import {Config, ErrorObject, FullNameSheetErrors, ListObject} from "../ValidatorModel";
import * as elements from "../../ValidatorView.private/elements";
import {ConvertedFullNameErrors, ConvertedValidationResult} from "../ValidatorPresenter";
import Observer from "../../Observer";

export default class ErrorsView {
    validationResult: ConvertedFullNameErrors | (ErrorObject[] | ListObject)[];
    config: Config;
    root: HTMLElement;
    elements: {
        errorsArea: {
            wrapper: HTMLDivElement;
            anotherErrorsSign: HTMLDivElement;
        };
    };

    private _errorsRenderedSubject = new Observer();

    constructor() {
        const errorsArea = elements.createErrorsArea();

        this.elements = {
            errorsArea: {
                wrapper: errorsArea.wrapper,
                anotherErrorsSign: errorsArea.anotherErrorsSign
            }
        };
    }

    async render(root: HTMLElement) {
        this.root = root;

        if ( this.config.mode === 'fullName' ) {
            await this._renderFullNameErrors();
        }

        if ( this.config.mode === 'countCompanies' ) {
            await this._renderNonRepeatingCompanies();
        }
        if ( this.config.mode !== 'fullName' && this.config.mode !== 'countCompanies') {
            await this._renderSingleCellErrors();
        }

    }

    whenErrorsRendered() {
        this._errorsRenderedSubject.addObserver(() => {

        });
    }

    private async _renderSingleCellErrors(): Promise<void> {
        if ( !Array.isArray(this.validationResult) ) {
            throw new Error('WorkBook Errors are not assignable to required format');
        }

        elements.appendToElem(this.root,
            this.elements.errorsArea.wrapper);

        await this._loopAndRenderErrors(this.validationResult as ErrorObject[][], 'array', 'in-course');

        this._errorsRenderedSubject.notifyObservers();
    }

    private async _renderFullNameErrors() {
        if ( Array.isArray(this.validationResult) ) {
            throw new Error('WorkBook Errors are not assignable to required format');
        }

        const matchErrors = this.validationResult.matchErrors;
        const lackOfNamesErrors = this.validationResult.lackOfNamesErrors;

        elements.appendToElem(this.root,
            this.elements.errorsArea.wrapper);

        if (matchErrors !== false) {
            await this._loopAndRenderErrors(matchErrors, 'array-in-array', 'group');
        }

        if (lackOfNamesErrors !== false) {
            elements.appendToElem(
                this.elements.errorsArea.wrapper,
                this.elements.errorsArea.anotherErrorsSign
            );

            await this._loopAndRenderErrors(lackOfNamesErrors, 'array', 'in-course');
        }

        this._errorsRenderedSubject.notifyObservers();
    }

    private async _loopAndRenderErrors(workbookErrors: (ErrorObject[] | ErrorObject[][])[],
                              errorsListForm: 'array-in-array' | 'array',
                              numeration: 'group' | 'in-course'): Promise<void> {
        for (let i = 0; i < workbookErrors.length; i++) {
            const currentList = workbookErrors[i];

            if (currentList.length === 0) continue;

            let list, listName;
            if (Array.isArray(currentList[i])) {
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
    }

    private async _renderListErrors(errorsList: (ErrorObject | ErrorObject[])[], table: HTMLTableElement,
                                    listForm: 'array-in-array' | 'array', numeration: 'group' | 'in-course'): Promise<void> {
        const loopAndRenderErrorsArray = async (errors: ErrorObject[],
                                                table: HTMLTableElement, numeration: 'group' | 'in-course', numberToRender?: number | '') => {

            for (let i = 0; i < errors.length; i++) {
                const currentErrorObject = errors[i] as ErrorObject;

                let errorNumber;

                if (numeration === 'group' && !!numberToRender) {
                    errorNumber = numberToRender;
                }
                if (numeration === 'in-course' && !numberToRender) errorNumber = i + 1;

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

        if (listForm === 'array-in-array') {
            for (let i = 0; i < (errorsList as ErrorObject[][]).length; i++) {
                await loopAndRenderErrorsArray((errorsList as ErrorObject[][])[i], table, numeration, i + 1);
            }
        }

        if (listForm === 'array') {
            await loopAndRenderErrorsArray((errorsList as ErrorObject[]), table, numeration);
        }
    }

    private async _renderNonRepeatingCompanies() {
        const companies = this.validationResult as ListObject[];
        const sign = document.createElement('div');
        sign.setAttribute('class', 'error-area__sign');
        sign.innerHTML = 'Non-repeating companies:';

        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'error-area__wrapper');

        wrapper.append(sign);

        this.root.append(wrapper);

        for ( let i = 0; i < companies.length; i ++ ) {
            const list = document.createElement('div');
            list.setAttribute('class', 'list-companies-number');

            list.innerHTML = `List No ${companies[i].list} (${companies[i].listName}) - ${companies[i].data}`;

            const getElementThroughTimeout = async (element: HTMLElement) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(element);
                    }, 200);
                });
            };

            await getElementThroughTimeout(list)
                .then((list: HTMLElement) => {
                        elements.appendToElem(wrapper, list)
                    },
                    null);

        }
    }

    private _createElements(){
        const createListName = (numberOfList: string | number, nameOfList: string) => {
            const listName = document.createElement('div');

            listName.setAttribute('class', 'list-errors__list-name');
            listName.innerHTML = `List No ${numberOfList} (${nameOfList})`;

            return listName;
        };

        return {
            createListName: createListName
        }
    }
}
