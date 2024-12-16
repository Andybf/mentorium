export default class BrowserSave {

    static checkAutoSave() {
        if (window.document.documentElement.getAttribute('auto-save') == 'true') {
            BrowserSave.saveOnBrowserStorage();
        }
    }

    static saveOnBrowserStorage(key, value) {
        if (window.localStorage) {
            window.localStorage[key] = JSON.stringify(value,null,4);
        } else {
            alert("Your browser does not support local storage feature. Please update your current browser.");
        }
    }

    static getSaveFromBrowserLocalStorage(key) {
        try {
            if (window.localStorage[key]) {
                return JSON.parse(window.localStorage[key]);
            }
        } catch (e) {
            console.error(e);
        }
    }

    static clearData() {
        try {
            if (window.localStorage) {
                window.localStorage.clear();
            }
        } catch (e) {
            console.error(e);
        }
    }

}