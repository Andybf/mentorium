import AVElement from '/mentorium/modules/AVElement.js';
import BrowserSave from "/mentorium/modules/BrowserSave.js";

export default class MultipleSelect extends AVElement {

    renderedCallback() {
        this.fillQuestion();
    }

    fillQuestion() {
        let newCard = this.body.querySelector("section");
        let string = this.questionData.question;
        this.body.querySelector("fieldset").style.borderColor = this.borderColor;

        let title;
        if (this.questionData['pre-question']) {
            title = this.questionData['pre-question'];
        } else {
            title = "Selecione os valores apropriados:"
        }
        newCard.querySelector("h3").innerText = title;

        this.getParentComponent().fillQuestionImageIfExists(newCard, this.questionData);
        const statementLength = this.questionData.answers.length;
        for (let i=0; i<statementLength; i++ ) {
            let div = document.createElement("div");
            let select = document.createElement("select");
            select.answer = this.questionData.answers[i];
            let option = document.createElement("option");
            option.value = ' ';
            option.innerText = ' ';
            select.appendChild(option);
            for (let stt of this.questionData.statements) {
                let option = document.createElement("option");                
                option.value = stt.title;
                option.innerText = stt.title;
                select.appendChild(option);
            }
            div.appendChild(select);
            let label = document.createElement("label");
            label.innerText = string[i];
            div.appendChild(label);
            newCard.querySelector("fieldset").appendChild(div);
        }
    }

    revealQuestion() {
        for (let select of Array.from(this.body.querySelectorAll("select"))) {
            if (select.value == select.answer) {
                select.style.background = 'green';
            } else {
                select.style.background = 'red';
            }
            select.value = select.answer;
            select.style.color = 'white';
        }     
    }

    evaluateQuestion() {
        const selectList = Array.from(this.body.querySelectorAll("select"));
        let points = 0;
        for (let select of selectList) {
            if (select.value == select.answer) {
                points++;
            }
        }
        if (points >= selectList.length) {
            return'pass';
        } else
        if (points > 0) {
            return 'warning';
        } else {
            return 'failed';
        }
    }

}