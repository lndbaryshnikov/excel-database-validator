import doesHaveErrors from "./doesHaveErrors";
import * as elements from "./domElements";
import {createListNumber} from "./domElements";
import {appendToElem} from "./domElements";
import {createTableHeader} from "./domElements";
import {createTableRow} from "./domElements";
import {createTableCell} from "./domElements";
import {createTable} from "./domElements";
import createLogText from "./createLogText";
import {createErrorsDownloadButton} from "./domElements";

const resultText = elements.createResultText();

const renderErrors = async (errors, root) => {

    if ( !doesHaveErrors(errors) ) {
        resultText.innerHTML = "Errors were not found";

        root.appendChild(resultText);

        return;
    }

    resultText.innerHTML = "Errors list:";

    root.appendChild(resultText);

    for (let i = 0; i < errors.length; i++) {
        const currentList = errors[i];

        if ( currentList.length === 0 ) continue;

        const table = createTable();

        appendToElem(table, createTableHeader());

        appendToElem(root,
            createListNumber(i+1, currentList[0].listName),
            table
        );

        for (let j = 0; j < currentList.length; j++) {
            const row = createTableRow();

            const appendRow = (row) => {
                appendToElem(row,
                    createTableCell(j + 1),
                    createTableCell(currentList[j].row),
                    createTableCell(currentList[j].value),
                    createTableCell(currentList[j].error)
                );

                return row;
            };

            const getFilledRowThroughTimeout = async() => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const newRow = appendRow(row);
                        resolve(newRow);
                    }
                    ,200);
                });
            };

            await getFilledRowThroughTimeout()
                .then(newRow => appendToElem(table, newRow),
                      null);
        }

    }
};

export default renderErrors;