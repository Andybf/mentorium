import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class Select extends AVElement {

    renderedCallback() {
        this.fillQuestion();
    }

    fillQuestion() {
        let newCard = this.body.querySelector("section");
        this.body.querySelector("fieldset").style.borderColor = this.borderColor;
        newCard.querySelector("h3").innerText = this.questionData.question;
        this.getParentComponent().fillQuestionImageIfExists(newCard, this.questionData);
        let select = newCard.querySelector("select");
        let option = document.createElement("option");
        option.value = ' ';
        option.innerText = ' ';
        select.appendChild(option);
        for (let stt of this.questionData.statements) {
            let option = document.createElement("option");
            option.value = stt.isCorrect;
            option.innerText = stt.title;
            select.appendChild(option);
        }     
    }

    revealQuestion() {
        let select = this.body.querySelector("select");
            if (select.value == 'true') {
                select.style.background = 'green';
            } else {
                select.style.background = 'red';
            }
            select.value = 'true';
            select.style.color = 'white';
    }

    evaluateQuestion() {
        if (this.body.querySelector("select").value == 'true') {
            return 'pass';
        } else {
            return'failed';
        }
    }

}