import AVElement from '/simulado/modules/AVElement.js';
import BrowserSave from "/simulado/modules/BrowserSave.js";

export default class App extends AVElement {

    database;
    examQuestions = 0;
    currentExam;
    intervalTime;
    dashboardData;
    currentQuestionComp;

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
        this.body.querySelector("#explanation").style.display = 'none';
        this.body.querySelector("#question-map").disabled = true;
        this.body.querySelector("#next").disabled = true;
        
        let main = this.body.querySelector("main");
        let newCard = document.importNode(this.body.querySelector("template#start-exam-template").content,true);
        newCard.querySelector("select#start-exam").onchange = (event) => {
            this.configureExam(event.target.value);
        };
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
        this.loadNewChildrenComponent('comp-choose');
        this.loadNewChildrenComponent('comp-multiple-select');
        this.loadNewChildrenComponent('comp-multiple-yes-no');
        this.loadNewChildrenComponent('comp-select');
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
        button.style.borderColor = (this.database[index]['isGolden']) ? 'goldenrod' : '';
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
            this.body.querySelector("#explanation").style.display = null;
            this.body.querySelector("#question-map").disabled = false;
            this.body.querySelector("#next").disabled = false;
            this.prepareNextQuestion(this.currentExam.currentQuestion);
        }).catch( (error) => {
            console.error(error);
        });
    }

    goToQuestion(index) {
        clearInterval(this.intervalTime);
        this.prepareNextQuestion(index);
        this.toogleQuestionMap();
    }

    prepareNextQuestion(id) {
        this.cleanQuestionCard();
        this.currentExam.startTime = new Date().getTime();
        this.intervalTime = setInterval( () => {
            this.tickClock();
        }, 1000);

        this.currentExam.currentQuestion = (id >= this.database.length) ? 0 : id;

        const currentQuestion = this.currentExam.currentQuestion;        
        const questionType = this.database[currentQuestion]['type'];
        this.body.querySelector("#current-question").innerText = currentQuestion+1;

        let questionBorderColor = (this.database[currentQuestion]['isGolden']) ? 'goldenrod' : '';
        
        let compName = `comp-${questionType}`;
        this.currentQuestionComp = document.createElement(compName);
        this.currentQuestionComp.questionData = this.database[currentQuestion];
        this.currentQuestionComp.borderColor = questionBorderColor;
        this.body.querySelector("main").appendChild(this.currentQuestionComp);

        this.body.querySelector("#exam-progress").value = this.currentExam.currentQuestion;
        this.currentExam.isCurrentQuestionRevealed = false;
    }

    evaluateQuestion() {
        const questionId = this.currentExam.currentQuestion;
        this.updateDashboard(questionId, this.currentQuestionComp.evaluateQuestion());
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
        let successRate = ((1 - misses/(hits+misses + (parcials/2)) )*100);
        successRate = (successRate < 0) ? 0 : successRate;
        this.body.querySelector("#status-hits").innerText = hits;
        this.body.querySelector("#status-parcial").innerText = parcials;
        this.body.querySelector("#status-miss").innerText = misses;
        this.body.querySelector("#status-success-rate").innerText = successRate.toFixed(2)+'%';
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
        clearInterval(this.intervalTime);
        const questionId = this.currentExam.currentQuestion;
        this.currentQuestionComp.revealQuestion();
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
            newCard.insertBefore(img, newCard.querySelector("fieldset"));
        }
    }
    
}