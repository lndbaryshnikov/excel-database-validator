import ValidatorModel from "./MVP/ValidatorModel";
import ValidatorView from "./MVP/ValidatorView";
import ValidatorPresenter from "./MVP/ValidatorPresenter";

import './styles/styles'

const model = new ValidatorModel();
const view = new ValidatorView();

const presenter = new ValidatorPresenter(model, view);

presenter.initialize();