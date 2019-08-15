import * as XLSX from "xlsx";
import getWorkbookErrors from "./getWorkbookErrors";
import renderErrors from "./renderErrors";
import {createErrorsBlock} from "./domElements";

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
        button.disabled = true;
        input.disabled = true;
        select.disabled = true;
        colInput.disabled = true;

        const domDownloadButton = settingsWrapper.getElementsByClassName('errors-block__download-button')[0];

        if ( !!domDownloadButton ) domDownloadButton.remove();

        const config = select.value;

        const colNumber = Number(colInput.value);

        const files = input.files, f = files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});

            const emailErrors = getWorkbookErrors(workbook, config, colNumber);

            const newErrorsBlock = createErrorsBlock();

            const errorsBlockClass = newErrorsBlock.getAttribute('class');
            const domErrorsBlock = document.getElementsByClassName(errorsBlockClass)[0];

            if ( !!domErrorsBlock ) {
                domErrorsBlock.remove();
            }

            document.body.appendChild(newErrorsBlock);

            renderErrors(emailErrors, newErrorsBlock, f.name, settingsWrapper)
                .then(() => {
                        button.disabled = false;
                        input.disabled = false;
                        select.disabled = false;
                        colInput.disabled = false;
                    },
                      null);
        };
        reader.readAsArrayBuffer(f);
    }
};