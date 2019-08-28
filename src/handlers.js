import * as XLSX from "xlsx";
import getWorkbookErrors from "./getWorkbookErrors";
import renderErrors from "./renderErrors";
import {createErrorsBlock, createErrorsDownloadButton} from "./domElements";
import createLogText from "./createLogText";

const deleteElementFromDomIfItExists = (element) => {
    const className = element.getAttribute('class');
    const domElem = document.getElementsByClassName(className)[0];

    if ( !!domElem ) {
        domElem.remove();
    }
};

const toggleElements = (mode, ...elements) => {
    let result;

    if ( mode === 'on' ) {
        result = false;
    } else if ( mode ==='off' ) {
        result = true;
    } else {
        throw new Error('mode can be only "on" or "off"');
    }

    elements.forEach( element => element.disabled = result );
};

export const createHandlerForInputChange = (button, input, select, colInput) => {
    return () => {
         button.disabled = !(input.files[0] && (select.selectedIndex !== 0) && colInput.value !== "");
    }
};

export const createHandlerForSelectChange = (button, input, select, colInput) => {
    return () => {
        button.disabled = !(input.files[0] && (select.selectedIndex !== 0) && colInput.value !== "");
    }
};

export const createHandlerForColInput = (button, input, select, colInput) => {
    return () => {
        button.disabled = !(input.files[0] && (select.selectedIndex !== 0) && colInput.value !== "");
    }
};

export const createHandlerForRunButton = (input, button, select, colInput, settingsWrapper) => {
    return () => {
        // button.disabled = true;
        // input.disabled = true;
        // select.disabled = true;
        // colInput.disabled = true;

        toggleElements('off', button, input, select, colInput);

        deleteElementFromDomIfItExists(createErrorsDownloadButton());

        const config = select.value;
        const colNumber = Number(colInput.value);

        const files = input.files, file = files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});

            const errors = getWorkbookErrors(workbook, config, colNumber);

            const logText = createLogText(errors, file.name);


            const errorsBlock = createErrorsBlock();

            deleteElementFromDomIfItExists(errorsBlock);

            document.body.appendChild(errorsBlock);

            renderErrors(errors, errorsBlock)
                .then(() => {
                        button.disabled = false;
                        input.disabled = false;
                        select.disabled = false;
                        colInput.disabled = false;

                        if ( !logText ) {
                            settingsWrapper.append(createErrorsDownloadButton("report.txt", logText));
                        }

                    },
                      null);
        };
        reader.readAsArrayBuffer(file);
    }
};