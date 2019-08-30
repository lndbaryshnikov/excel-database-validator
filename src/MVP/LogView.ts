import * as elements from "../ValidatorView.private/elements"
import {create} from "../ValidatorView.private/elements";
import {selfDownloadFile} from "../ValidatorView.private/selfDownLoadFile";

export default class LogView {
    html: HTMLButtonElement | null;
    text: string;

    constructor() {
        const button = create('button',
            ['class', 'button log-download-button']
        ) as HTMLButtonElement;

        button.innerHTML = 'Download Report';

        this.html = button;
    }

    set log(log: string) {
        this.text = log;
    }

    render(root: HTMLDivElement) {
        elements.appendToElem(root, this.html);
    }

    initialize(): void {
        this.html.onclick = () => {
            selfDownloadFile('report.txt', this.text);
        };
    }

    destroy(): void {
        this.disable();
        this.deleteFromDom();
    }

    disable(): void {
        this.html.onclick = null;
    }

    deleteFromDom(): void {
        this.html.remove();
    }


}