import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class App extends AVElement {

    database;
    exams;
    examQuestions = 46;
    examMaxTime = 45;
    pointsPerQuestion = 1000/this.examQuestions;
    currentExam;
    intervalTime;
    
    renderedCallback() {
        this.body.querySelector("button#next").addEventListener("click", (event) => {
            this.nextQuestion(event);
        });
        this.body.querySelector("button#reveal").addEventListener("click", (event) => {
            this.evaluateQuestion()
            this.revealQuestion(event);
        });
        this.body.querySelector("#reveal").disabled = true;
        this.body.querySelector("#next").disabled = true;
        this.getDatabase().then( (resp) => {
            this.database = JSON.parse(resp)['questions'];
            let main = this.body.querySelector("main");
            let newCard = document.importNode(this.body.querySelector("template#start-exam-template").content,true);
            newCard.querySelector("button").onclick = () => {this.startExam()};
            main.appendChild(newCard);
            this.body.querySelector("#qty-questions").innerText = this.database.length;
        }).catch( (error) => {
            console.error(error);
        });
    }

    async getDatabase() {
        const response = await fetch(`./database/sc900.json`);
        if (response.status == 200 || response.statusText == 'OK') {
            return await response.text();
        } else {
            return `[ERROR] Database not found. code ${response.status}: ${response.statusText}`;
        }
    }

    selectNextQuestionFromDatabase() {
        let n;
        let repeated = false;
        if (this.currentExam.questionNumbers.length == this.database.length) {
            this.currentExam.questionNumbers = new Array();
        } else {
            do {
                repeated = false;
                n = Math.floor(Math.random()*this.database.length);
                for (let qn of this.currentExam.questionNumbers) {
                    if (n == qn) {
                        repeated = true;
                    }
                }
            } while (repeated == true);
        }
        return n;
    }

    tickCountdownClock() {
        let diff = new Date(this.currentExam.finalTime - new Date());
        let minutes = (diff.getMinutes() < 10 ) ? "0"+diff.getMinutes() : diff.getMinutes();
        let seconds = (diff.getSeconds() < 10 ) ? "0"+diff.getSeconds() : diff.getSeconds();
        let string = `00:${minutes}:${seconds}`;
        this.body.querySelector("#exam-time").innerText = string;
        if (diff.getMinutes() == 0 && diff.getSeconds() == 0) {
            clearInterval(this.intervalTime);
            this.gameover();
        }
    }

    startExam() {
        this.currentExam = {
            questionNumbers : [],
            currentQuestion : 0,
            points : 0,
            finalTime : 0
        };
        this.body.querySelector("#current-question").innerText = 0;
        this.body.querySelector("#total-questions").innerText = this.examQuestions;
        this.body.querySelector("#exam-progress").max = this.examQuestions;
        this.body.querySelector("#reveal").disabled = false;
        this.body.querySelector("#next").disabled = false;
        this.prepareNextQuestion();
        this.currentExam.finalTime = new Date().getTime()+ (this.examMaxTime * 60 * 1000);
        this.intervalTime = setInterval( () => {
            this.tickCountdownClock();
        }, 1000);
    }

    prepareNextQuestion() {
        this.currentExam.questionNumbers.push({
            id : this.selectNextQuestionFromDatabase(),
            selected : [],
            isRevealed : false
        });
        this.cleanQuestionCard();
        const index = this.currentExam.currentQuestion;
        this.body.querySelector("#current-question").innerText = index+1;

        const questionId = this.currentExam.questionNumbers[index].id;
        const questionType = this.database[questionId]['type'];
        if (questionType === 'select') {  
            this.fillQuestionSelect(questionId);
        } else
        if (questionType === 'choose') {
            this.fillQuestionChoose(questionId);
        } else
        if (questionType === 'multiple-YesNo') {
            this.fillQuestionMultipleYesNo(questionId);
        } else
        if (questionType === 'multiple-select') {
            this.fillQuestionMultipleSelect(questionId);
        }
        this.currentExam.currentQuestion++;
        this.body.querySelector("#exam-progress").value = this.currentExam.currentQuestion;
        this.body.querySelector("#question-id").innerText = this.currentExam.questionNumbers[index].id;
        
    }

    nextQuestion() {
        this.evaluateQuestion();
        if (this.currentExam.currentQuestion >= this.examQuestions) {
            this.gameover();
        } else {
            this.prepareNextQuestion();
        }         
    }

    evaluateQuestion() {
        const index = this.currentExam.currentQuestion-1;
        const questionId = this.currentExam.questionNumbers[index].id;
        const questionType = this.database[questionId]['type'];

        if (this.currentExam.questionNumbers[index].isRevealed) {
            return;
        }

        if (questionType === 'select') {
            if (this.body.querySelector("select").value == 'true') {
                this.currentExam.points += this.pointsPerQuestion;
            }
        } else
        if (questionType === 'choose') {
            let trueStatementsCount = 0;
            for (let statement of this.database[questionId].statements) {
                if (statement.isCorrect) {
                    trueStatementsCount++;
                }
            }
            let pointPerStatement = this.pointsPerQuestion/trueStatementsCount;
            for (let input of Array.from(this.body.querySelectorAll('input'))) {
                if (input.value == 'true' && input.checked == true) {
                    this.currentExam.points += pointPerStatement;
                }
            }
        } else
        if (questionType === 'multiple-YesNo') {
            let pointPerStatement = this.pointsPerQuestion/3;
            for (let input of Array.from(this.body.querySelectorAll('input'))) {
                if (input.value == 'true' && input.checked == true) {
                    this.currentExam.points += pointPerStatement;
                }
            }
        } else
        if (questionType === 'multiple-select') {
            const selectList = Array.from(this.body.querySelectorAll("select"));
            let pointPerStatement = this.pointsPerQuestion/selectList.length;
            for (let select of selectList) {
                if (select.value == select.answer) {
                    this.currentExam.points += pointPerStatement;
                }
            }    
        }
        let points = Math.round(this.currentExam.points);
        if (points < 100) {
            points = "000"+points;
        } else
        if (points < 100) {
            points = "00"+points;
        } else
        if (points < 1000) {
            points = "0"+points;
        }
        this.body.querySelector("#points").innerText = points;
    }

    revealQuestion() {
        const index = this.currentExam.currentQuestion-1;
        const questionId = this.currentExam.questionNumbers[index].id;
        const questionType = this.database[questionId]['type'];
        if (questionType === 'select') {
            let select = this.body.querySelector("select");
            if (select.value == 'true') {
                select.style.background = 'green';
            } else {
                select.style.background = 'red';
            }
            select.value = 'true';
            select.style.color = 'white';
        } else
        if (questionType === 'choose') {
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
        } else
        if (questionType === 'multiple-YesNo') {
            for (let input of Array.from(this.body.querySelectorAll('input'))) {
                if (input.value == 'true' && input.checked == false) {
                    input.parentElement.style.background = 'red';
                } else
                if (input.value == 'true' && input.checked == true) {
                    input.parentElement.style.background = 'green';
                }
            }
        } else
        if (questionType === 'multiple-select') {
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
        this.currentExam.questionNumbers[index].isRevealed = true;
    }

    gameover() {
        this.cleanQuestionCard();
        this.body.querySelector("button#next").disabled = true;
        this.body.querySelector("button#reveal").disabled = true;
        let main = this.body.querySelector("main");
        main.innerText = "Game Over";
    }

    cleanQuestionCard() {
        let main = this.body.querySelector("main");
        while (main.childElementCount > 0) {
            main.removeChild(main.firstElementChild);
        }
    }

    fillQuestionMultipleYesNo(index) {
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#multiple-YesNo").content,true);
        newCard.querySelector("h3").innerText = this.database[index].question;
        for (let i=0; i<3; i++) {
            newCard.querySelector("ul").children[i].firstElementChild.innerText = this.database[index].statements[i].title;
            for (let j=0; j<2; j++) {
                let div = document.createElement('div');
                let input = document.createElement('input');
                input.type = 'radio';
                input.name = i.toString();            
                if (this.database[index].statements[i].isCorrect == true && j == 0) {
                    input.value = true;
                } else
                if (this.database[index].statements[i].isCorrect == false && j == 1) {
                    input.value = true;
                } else {
                    input.value = false;
                }
                div.appendChild(input);
                newCard.querySelector("ul").children[i].appendChild(div);
            }
        }        
        main.appendChild(newCard);
    }

    fillQuestionChoose(index) {
        let questionObj = this.database[index];
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#choose").content,true);
        newCard.querySelector("h3").innerText = questionObj.question;

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
        main.appendChild(newCard);
    }

    fillQuestionSelect(index) {
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#select").content,true);
        newCard.querySelector("h3").innerText = this.database[index].question;
        let select = newCard.querySelector("select");
        let option = document.createElement("option");
        option.value = ' ';
        option.innerText = ' ';
        select.appendChild(option);
        for (let stt of this.database[index].statements) {
            let option = document.createElement("option");
            option.value = stt.isCorrect;
            option.innerText = stt.title;
            select.appendChild(option);
        }        
        main.appendChild(newCard);
    }

    fillQuestionMultipleSelect(index) {
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#multiple-select").content,true);
        let string = this.database[index].question.split("...");
        string.shift();

        newCard.querySelector("h3").innerText = "Select the appropriate values:";
        const statementLength = this.database[index].statements.length;
        for (let i=0; i<statementLength; i++ ) {
            let div = document.createElement("div");
            let select = document.createElement("select");
            select.answer = this.database[index].answers[i];
            let option = document.createElement("option");
            option.value = ' ';
            option.innerText = ' ';
            select.appendChild(option);
            for (let stt of this.database[index].statements) {
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
        main.appendChild(newCard);
    }
    
}