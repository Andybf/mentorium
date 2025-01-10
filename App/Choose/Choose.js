import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class Choose extends AVElement {

    renderedCallback() {
        this.fillQuestion();
    }

    fillQuestion() {
        let questionObj = this.questionData;
        this.body.querySelector("fieldset").style.borderColor = this.borderColor;
        let newCard = this.body.querySelector("section");
        newCard.querySelector("h3").innerText = questionObj.question;        
        this.getParentComponent().fillQuestionImageIfExists(newCard, questionObj);

        let list = newCard.querySelector("ul");
        for (let statement of questionObj.statements) {
            const listItem = document.createElement("li");
            let input = document.createElement("input");
            input.type = "checkbox";
            input.value = statement.isCorrect;
            input.id = statement.title;
            let label = document.createElement("label");
            label.innerText = statement.title;
            label.htmlFor = statement.title;
            listItem.appendChild(input);
            listItem.appendChild(label);
            list.appendChild(listItem);
        }
    }

    revealQuestion() {
        for (let input of Array.from(this.body.querySelectorAll('input'))) {
            if (input.value == 'true' && input.checked == true) {
                input.parentElement.style.background = 'green';
                input.parentElement.style.color = 'white';
            } else
            if (input.value == 'true' && input.checked == false) {
                input.parentElement.style.background = 'red';
                input.parentElement.style.color = 'white';
            }
        }
    }

    evaluateQuestion() {
        let trueStatementsCount = 0;
        for (let statement of this.questionData.statements) {
            if (statement.isCorrect) {
                trueStatementsCount++;
            }
        }
        let points = 0;
        for (let input of Array.from(this.body.querySelectorAll('input'))) {
            if (input.value == 'true' && input.checked == true) {
                points++;
            }
        }
        if (points >= trueStatementsCount) {
            return 'pass';
        } else
        if (points > 0) {
            return'warning';
        } else {
            return'failed';
        }
    }
}