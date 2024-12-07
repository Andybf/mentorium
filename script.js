function initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").then( (registration) => {
            console.log("SW registred.");
        }).catch( (error) => {
            console.log(error);
        });
    }
}

function initializeAVframework() {
    import('./App/App.js').then( ( appClassDefinition) => {
        customElements.define("comp-app", appClassDefinition.default);
    });
}

initializeAVframework();
// initializeServiceWorker();