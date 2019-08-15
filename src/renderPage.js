//Styles
import './styles/settings-wrapper.css'
import './styles/header.css';
import './styles/options_select.css'
import './styles/text-explanation.css'
import './styles/options_select-option.css'
import './styles/col-input.css'
import './styles/col-input-wrapper.css'
import './styles/input.css';
import './styles/input-wrapper.css';
import './styles/input-label.css';
import './styles/button.css';
import './styles/run-button.css';
import './styles/result-text.css';
import './styles/errors-block/errors-block.css';
import './styles/errors-block/errors-block__list-number.css';
import './styles/errors-block/errors-block__table.css';
import './styles/errors-block/errors-block__table-header.css';
import './styles/errors-block/errors-block__table-row.css';
import './styles/errors-block/errors-block__table-cell.css';
import './styles/errors-block/errors-block__download-button.css'


//Dom Elements
import * as elements from './domElements';

//Handlers
import * as handlers from './handlers'
import {createDivWithClassAndText} from "./domElements";

let header, input, colInput, select, runButton, wrapper, colInputWrapper, selectWrapper;

header = elements.createHeader();
input = elements.createInput();
select = elements.createOptionSelect();
runButton = elements.createRunButton();
wrapper = elements.createPageWrapper();
colInput = elements.createInputForChoosingCol();
colInputWrapper = elements.createDivWithClassAndText('col-input-wrapper', null);
selectWrapper = elements.createDivWithClassAndText('col-input-wrapper', null);


input.input.addEventListener('change', handlers.createHandlerForInputChange(runButton, input.input, select, colInput));
select.addEventListener('change', handlers.createHandlerForSelectChange(runButton, input.input, select, colInput));
runButton.addEventListener('click', handlers.createHandlerForRunButton(input.input, runButton, select, colInput, wrapper), false);
colInput.addEventListener('input', handlers.createHandlerForColInput(runButton, input.input, select, colInput));

elements.appendToElem(document.body, header);
elements.appendToElem(document.body, wrapper);

elements.appendToElem(colInputWrapper,
    createDivWithClassAndText('text-explanation', 'Type col number: '),
    colInput
);

elements.appendToElem(selectWrapper,
    createDivWithClassAndText('text-explanation', 'Check for: '),
    select
);

elements.appendToElem(wrapper,
    input.init,
    selectWrapper,
    colInputWrapper,
    runButton
);



