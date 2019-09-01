import ValidatorModel from "./MVP/Validator/ValidatorModel";
import ValidatorView from "./MVP/Validator/ValidatorView";
import ValidatorPresenter from "./MVP/Validator/ValidatorPresenter";

import './styles/styles'

const model = new ValidatorModel();
const view = new ValidatorView();

const presenter = new ValidatorPresenter(model, view);

presenter.initialize();