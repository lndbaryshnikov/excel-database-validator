import ValidatorModel from "./ValidatorModel";
import ValidatorView from "./ValidatorView";
import ValidatorPresenter from "./ValidatorPresenter";

import './styles/styles'

const model = new ValidatorModel();
const view = new ValidatorView();

const presenter = new ValidatorPresenter(model, view);

presenter.initialize();