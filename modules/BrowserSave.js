export default class BrowserSave {

    static checkAutoSave() {
        if (window.document.documentElement.getAttribute('auto-save') == 'true') {
            BrowserSave.saveOnBrowserStorage();
        }
    }

    static saveOnBrowserStorage() {
        if (window.localStorage) {
            const content = BrowserSave.generateBoardDataJson(window.document.querySelector("comp-app"));
            window.localStorage.lastSave = JSON.stringify(content,null,4);
        } else {
            alert("Your browser does not support local storage feature. Please update your current browser.");
        }
    }

    static generateBoardDataJson(rootAppComp) {
        let BoardNameInput = rootAppComp.body.querySelector("input");
        let BoardName = (BoardNameInput.value.length > 0) ? BoardNameInput.value : BoardNameInput.placeholder;
        let background =  document.firstElementChild.style.backgroundImage;
        background = background.substring(4, background.length-1);
        let content = {
            'name' : BoardName,
            'background' : background,
            'createdDate' : Date.now(),
            'columns' : []
        }
        Array.from(rootAppComp.body.querySelector("comp-board").boardList.children).forEach(element => {
            let stickerList = [];
            Array.from(element.querySelector("ul").children).forEach( item => {
                stickerList.push({
                    'stickynote-title' : item.firstElementChild.body.querySelector('input').value,
                    'content' : item.firstElementChild.body.querySelector('article').innerHTML,
                    'background-color' : item.firstElementChild.attributes['background-color'].nodeValue
                });
            });
            content.columns.push({
                'column-title' : element.querySelector("input").value,
                'stickers' : stickerList
            });
        });
        return content;
    }
}