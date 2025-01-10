import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class MultipleYesNo extends AVElement {

    renderedCallback() {
        this.fillQuestion();
    }

    fillQuestion() {
        let newCard = this.body.querySelector("section");
        this.body.querySelector("fieldset").style.borderColor = this.borderColor;
        newCard.querySelector("h3").innerText = this.questionData.question;
        this.getParentComponent().fillQuestionImageIfExists(newCard, this.questionData);
        let statementIndex = 0;
        for (let statement of this.questionData.statements) {
            let li = document.createElement("li");
            let label = document.createElement("label");
            label.innerText = statement.title;
            li.appendChild(label);
            for (let j=0; j<2; j++) {
                let div = document.createElement('div');
                let input = document.createElement('input');
                input.type = 'radio';
                input.name = statementIndex.toString();            
                if (statement.isCorrect == true && j == 0) {
                    input.value = true;
                } else
                if (statement.isCorrect == false && j == 1) {
                    input.value = true;
                } else {
                    input.value = false;
                }
                div.appendChild(input);
                li.appendChild(div);
            }
            newCard.querySelector('ul').appendChild(li);
            statementIndex++;
        }
    }

    revealQuestion() {
        for (let input of Array.from(this.body.querySelectorAll('input'))) {
            if (input.value == 'true' && input.checked == false) {
                input.parentElement.style.background = 'red';
            } else
            if (input.value == 'true' && input.checked == true) {
                input.parentElement.style.background = 'green';
            }
        }
    }

    evaluateQuestion() {
        let points = 0;
            for (let input of Array.from(this.body.querySelectorAll('input'))) {
                if (input.value == 'true' && input.checked == true) {
                    points++;
                }
            }
            if (points >= 3) {
                return'pass';
            } else
            if (points > 0) {
                return 'warning';
            } else {
                return 'failed';
            }
    }

}