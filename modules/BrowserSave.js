export default class BrowserSave {

    static checkAutoSave() {
        if (window.document.documentElement.getAttribute('auto-save') == 'true') {
            BrowserSave.saveOnBrowserStorage();
        }
    }

    static saveOnBrowserStorage(content) {
        if (window.localStorage) {
            window.localStorage.lastSave = JSON.stringify(content,null,4);
        } else {
            alert("Your browser does not support local storage feature. Please update your current browser.");
        }
    }

    static getSaveFromBrowserLocalStorage() {
        try {
            if (window.localStorage.lastSave) {
                return JSON.parse(window.localStorage.lastSave);
            }
        } catch (e) {
            console.error(e);
        }
    }

    static clearData() {
        try {
            if (window.localStorage.lastSave) {
                window.localStorage.lastSave = null;
            }
        } catch (e) {
            console.error(e);
        }
    }

}