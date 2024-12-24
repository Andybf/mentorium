import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class App extends AVElement {

    database;
    examQuestions = 0;
    currentExam;
    intervalTime;
    dashboardData;
    
    renderedCallback() {
        this.body.querySelector("button#next").addEventListener("click", (event) => {
            if (this.currentExam.isCurrentQuestionRevealed) {
                this.prepareNextQuestion(this.currentExam.currentQuestion+1);
                event.target.innerText = 'Verificar Questão';
            } else {
                this.evaluateQuestion();
                this.revealQuestion(event);                
                event.target.innerText = 'Próxima questão';
            }
        });
        this.body.querySelector("button#question-map").addEventListener("click", (event) => {
            this.toogleQuestionMap();
        });
        this.body.querySelector("section.background").addEventListener("click", (event) => {
            this.toogleQuestionMap();
        });
        this.toogleQuestionMap();
        this.body.querySelector("#question-map").disabled = true;
        this.body.querySelector("#next").disabled = true;
        
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#start-exam-template").content,true);
        for (let button of Array.from(newCard.querySelectorAll("button.start-exam"))) {
            button.onclick = (event) => {
                this.configureExam(event.target.value);
            };
        }
        newCard.querySelector("button#clear-data").onclick = () => {
            BrowserSave.clearData();
        };
        main.appendChild(newCard);
        this.currentExam = {
            name : '',
            currentQuestion : 0,
            isCurrentQuestionRevealed : false,
            startTime : 0
        };
    }

    async getDatabase(documentName) {
        const response = await fetch(`./database/${documentName}.json`);
        if (response.status == 200 || response.statusText == 'OK') {
            return await response.text();
        } else {
            return `[ERROR] Database not found. code ${response.status}: ${response.statusText}`;
        }
    }

    tickClock() {
        let diff = new Date(new Date() - this.currentExam.startTime);
        let minutes = (diff.getMinutes() < 10 ) ? "0"+diff.getMinutes() : diff.getMinutes();
        let seconds = (diff.getSeconds() < 10 ) ? "0"+diff.getSeconds() : diff.getSeconds();
        let string = `00:${minutes}:${seconds}`;
        this.body.querySelector("#exam-time").innerText = string;
    }

    createQuestionMapQuestionButton(index) {
        let button = document.createElement("button");
        button.innerText = index+1;
        if (this.dashboardData[index] != 'darkgrey') {
            button.style.background = this.dashboardData[index];
        }        
        button.value = index;
        button.addEventListener("click", (event) => {
            this.goToQuestion(Number(event.target.value));
        });
        return button;
    }

    configureExam(documentName) {
        this.body.querySelector("#certification").innerText = documentName;
        this.getDatabase(documentName).then( (resp) => {
            this.database = JSON.parse(resp)['questions'];
            this.examQuestions = this.database.length;
            this.currentExam.startTime = new Date().getTime();
            this.currentExam.name = documentName;
            let div = this.body.querySelector("#question-icons");
            this.dashboardData = BrowserSave.getSaveFromBrowserLocalStorage(this.currentExam.name);
            if (this.dashboardData) {
                for (let i=0; i<this.database.length; i++) {
                    let button = this.createQuestionMapQuestionButton(i);                
                    div.appendChild(button);
                    if (button.style.background == 'green') {
                        this.currentExam.currentQuestion++;
                    }                
                }
            } else {
                this.dashboardData = new Array();
                for (let i=0; i<this.database.length; i++) {
                    this.dashboardData[i] = '';
                    let button = this.createQuestionMapQuestionButton(i);  
                    div.appendChild(button);
                }
            }
            this.countStatus();
            this.body.querySelector("#current-question").innerText = 0;
            this.body.querySelector("#total-questions").innerText = this.examQuestions;
            this.body.querySelector("#exam-progress").max = this.examQuestions;
            this.body.querySelector("#question-map").disabled = false;
            this.body.querySelector("#next").disabled = false;
            this.prepareNextQuestion(this.currentExam.currentQuestion);
        }).catch( (error) => {
            console.error(error);
        });
        this.intervalTime = setInterval( () => {
            this.tickClock();
        }, 1000);
    }

    goToQuestion(index) {
        this.prepareNextQuestion(index);
        this.toogleQuestionMap();
    }

    prepareNextQuestion(id) {
        this.cleanQuestionCard();
        if (id >= this.database.length) {
            this.currentExam.currentQuestion = 0;
        } else {
            this.currentExam.currentQuestion = id;  
        }              
        const currentQuestion = this.currentExam.currentQuestion;        
        const questionType = this.database[currentQuestion]['type'];
        this.body.querySelector("#current-question").innerText = currentQuestion+1;
        if (questionType === 'select') {  
            this.fillQuestionSelect(currentQuestion);
        } else
        if (questionType === 'choose') {
            this.fillQuestionChoose(currentQuestion);
        } else
        if (questionType === 'multiple-YesNo') {
            this.fillQuestionMultipleYesNo(currentQuestion);
        } else
        if (questionType === 'multiple-select') {
            this.fillQuestionMultipleSelect(currentQuestion);
        }
        this.body.querySelector("#exam-progress").value = this.currentExam.currentQuestion;
        this.currentExam.isCurrentQuestionRevealed = false;
    }

    evaluateQuestion() {
        const questionId = this.currentExam.currentQuestion;
        const questionType = this.database[questionId]['type'];

        if (questionType === 'select') {
            if (this.body.querySelector("select").value == 'true') {
                this.updateDashboard(questionId, 'pass');
            } else {
                this.updateDashboard(questionId, 'failed');
            }
        } else
        if (questionType === 'choose') {
            let trueStatementsCount = 0;
            for (let statement of this.database[questionId].statements) {
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
                this.updateDashboard(questionId, 'pass');
            } else
            if (points > 0) {
                this.updateDashboard(questionId, 'warning');
            } else {
                this.updateDashboard(questionId, 'failed');
            }
        } else
        if (questionType === 'multiple-YesNo') {
            let points = 0;
            for (let input of Array.from(this.body.querySelectorAll('input'))) {
                if (input.value == 'true' && input.checked == true) {
                    points++;
                }
            }
            if (points >= 3) {
                this.updateDashboard(questionId, 'pass');
            } else
            if (points > 0) {
                this.updateDashboard(questionId, 'warning');
            } else {
                this.updateDashboard(questionId, 'failed');
            }
        } else
        if (questionType === 'multiple-select') {
            const selectList = Array.from(this.body.querySelectorAll("select"));
            let points = 0;
            for (let select of selectList) {
                if (select.value == select.answer) {
                    points++;
                }
            }
            if (points >= selectList.length) {
                this.updateDashboard(questionId, 'pass');
            } else
            if (points > 0) {
                this.updateDashboard(questionId, 'warning');
            } else {
                this.updateDashboard(questionId, 'failed');
            }
        } 
    }

    toogleQuestionMap() {
        let modal = this.body.querySelector("#modal-question-map").style;
        modal.display = (modal.display == '') ? 'none' : '';
    }

    countStatus() {
        let hits = 0;
        let parcials = 0;
        let misses = 0;
        for (let q of this.dashboardData) {
            if (q === 'green') {
                hits++;
            } else
            if (q === 'yellow') {
                parcials++;
            } else
            if (q === 'red') {
                misses++;
            }
        }
        this.body.querySelector("#status-hits").innerText = hits;
        this.body.querySelector("#status-parcial").innerText = parcials;
        this.body.querySelector("#status-miss").innerText = misses;
        this.body.querySelector("#status-success-rate").innerText = ((1 - misses/(hits + (parcials/2)) )*100).toFixed(2)+'%';
        this.body.querySelector("#status-total-answered").innerText = hits + parcials + misses;
    }

    updateDashboard(questionId, status) {
        let div = Array.from(this.body.querySelector("#question-icons").children);
        if (status == 'pass') {
            this.dashboardData[questionId] = 'green'
            div[questionId].style.background = this.dashboardData[questionId];
        } else 
        if (status == 'warning') {
            this.dashboardData[questionId] = 'yellow'
            div[questionId].style.background = this.dashboardData[questionId];
        } else
        if (status == 'failed') {
            this.dashboardData[questionId] = 'red'
            div[questionId].style.background = this.dashboardData[questionId];
        }
        BrowserSave.saveOnBrowserStorage(this.currentExam.name, this.dashboardData);
        this.countStatus();
    }

    revealQuestion() {
        const questionId = this.currentExam.currentQuestion;
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
        this.body.querySelector("section#explanation").innerText = this.database[questionId].explanation;
        this.currentExam.isCurrentQuestionRevealed = true;
    }

    cleanQuestionCard() {
        this.body.querySelector("section#explanation").innerText = "";
        let main = this.body.querySelector("main");
        while (main.childElementCount > 0) {
            main.removeChild(main.firstElementChild);
        }
    }

    fillQuestionImageIfExists(newCard, questionObj) {
        if (questionObj.attachment) {
            let img = document.createElement("img");
            img.src =  questionObj.attachment;
            newCard.querySelector("section").insertBefore(img, newCard.querySelector("fieldset"));
        }
    }

    fillQuestionMultipleYesNo(index) {
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#multiple-YesNo").content,true);
        newCard.querySelector("h3").innerText = this.database[index].question;
        this.fillQuestionImageIfExists(newCard, this.database[index]);
        let statementIndex = 0;
        for (let statement of this.database[index].statements) {
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
        main.appendChild(newCard);
    }

    fillQuestionChoose(index) {
        let questionObj = this.database[index];
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#choose").content,true);
        newCard.querySelector("h3").innerText = questionObj.question;        
        this.fillQuestionImageIfExists(newCard, questionObj);

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
        this.fillQuestionImageIfExists(newCard, this.database[index]);
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
        let string = this.database[index].question;

        let title;
        if (this.database[index]['pre-question']) {
            title = this.database[index]['pre-question'];
        } else {
            title = "Selecione os valores apropriados:"
        }
        newCard.querySelector("h3").innerText = title;

        this.fillQuestionImageIfExists(newCard, this.database[index]);
        const statementLength = this.database[index].answers.length;
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