/* 
 * AndView Framework
 * Copyright © 2023 Anderson Bucchianico. All rights reserved.
 * 
*/

import AVutils from './AVutils.js'

export default class AVElement extends HTMLElement {

    #childrenComponentList = new Map();
    #componentpath = '';

    constructor() {
        super();
        this.#initializeComponent();
    }

    async #initializeComponent() {
        this.#doPreLoadContentActions();
        await this.#appendHTMLtoComponent();
        await this.#appendCSStoComponentBody();
        this.#doPostLoadContentActions();
        this.#reconstructComponentParentsMap();
        this.renderedCallback();
    }

    #doPreLoadContentActions() {
        if (!this._parentComponentsMap) {
            this._parentComponentsMap = new Map();
        }
        if (this.parentNode) {
            this.#catalogParentComponents(this.parentNode);
        }
        this.#constructComponentPath();
    }

    #catalogParentComponents(parentNode) {
        let nextParentNode = parentNode;
        if (!nextParentNode) {
            return false;
        } else if (nextParentNode.host) {
            this._parentComponentsMap.set(nextParentNode.host.localName, nextParentNode.host);
            this.#catalogParentComponents(nextParentNode.host);
        } else if (nextParentNode.localName.includes("html")) {
            return false;
        } else {
            this.#catalogParentComponents(nextParentNode.parentNode);
        }
    }

    #constructComponentPath() {
        let root = this.#constructComponentRootPath();
        this.#componentpath = {
            root : `${root}${this.constructor.name}`,
            html : `${root}${this.constructor.name}/${this.constructor.name}.html`,
            css  : `${root}${this.constructor.name}/${this.constructor.name}.css`,
            js   : `${root}${this.constructor.name}/${this.constructor.name}.js`,
        }
    }

    #constructComponentRootPath() {
        let root = window.location.pathname;
        let parentCompCopy = new Map(this._parentComponentsMap);
        for(let x=this._parentComponentsMap.size; x>0; x--) {
            root += `${this.#constructComponentClassName(AVutils.mapPopValue(parentCompCopy))}/`;
        }
        return root;
    }

    #constructComponentClassName(componentLocalName) {
        let className = '';
        componentLocalName.localName.replace("comp-",'').split('-').forEach( word => {
            className += word[0].toUpperCase() + word.slice(1);
        });
        return className;
    }

    async #appendHTMLtoComponent() {
        await this.#fetchContentWithPath(this.#componentpath.html).then( (responseText) => {
            let componentHTML = new DOMParser().parseFromString(responseText,"text/html");
            this.body = this.attachShadow({mode:'closed'});
            this.style.visibility = 'hidden';
            Array.from(componentHTML.querySelector("body").childNodes).forEach( node => {
                this.body.appendChild(node);
            })
            this.template = componentHTML.querySelector("head");
        });
    }

    async #appendCSStoComponentBody() {
        function removeCommentsAndBreakLines(cssText){
            return cssText.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'').replaceAll('\n','');
        }
        await this.#fetchContentWithPath(this.#componentpath.css).then( cssText => {
            let styleNode = document.createElement("style");
            styleNode.innerText = removeCommentsAndBreakLines(cssText);
            this.body.appendChild(styleNode);
        });
    }

    async #fetchContentWithPath(path) {
        let response = await fetch(path);
        if (response.status == 200 || response.statusText == 'OK') {
            return await response.text();
        } else {
            return `[ERROR] code ${response.status}: ${response.statusText}`;
        }
    }

    #doPostLoadContentActions() {
        this.#catalogChildrenComponents();
        this.#initializeAllPreDefinedChildrenComponents();
        if (this.localization) {
            let language = document.querySelector('html').lang;
            AVutils.translateComponentText(this.localization, this, language);
        }
        this.style.visibility = null;
    }

    #catalogChildrenComponents() {
        this.body.querySelectorAll("*").forEach( componentNode => {
            if (componentNode.tagName.includes("COMP-")){
                this.#childrenComponentList.set(componentNode.localName, componentNode);
            }
        })
    }

    #initializeAllPreDefinedChildrenComponents() {
        this.#childrenComponentList.forEach( componentElement => {
            this.importComponentDefinition(componentElement);
        })
    }

    importComponentDefinition(componentElement) {
        let className = this.#constructComponentClassName(componentElement);
        import(`${this.#componentpath.root}/${className}/${className}.js`)
        .then( classDefinition => {
            this.#defineCustomComponent(componentElement,classDefinition);
        });
    }

    #defineCustomComponent(htmlNode, classDefinition) {
        function isComponentNotDefined(classDefinition, node) {
            return classDefinition.default && !window.customElements.get(node.localName);
        }
        if (isComponentNotDefined(classDefinition, htmlNode)) {
            customElements.define(htmlNode.localName, classDefinition.default);
        }
    }

    #reconstructComponentParentsMap() {
        if (this._parentComponentsMap.size > 0) {
            if (!this._parentComponentsMap.get('comp-app').namespaceURI) {
                this.#catalogParentComponents(this.parentNode);
            }
        }
    }

    retraceParents(childTagName) {
        let classDefinition = customElements.get(childTagName);
        let parentMap = new Map([[this.localName, this ]]);
        AVutils.concatMaps(parentMap, this._parentComponentsMap);
        classDefinition.prototype._parentComponentsMap = parentMap;
    }

    async loadNewChildrenComponent(childTagName) {
        if (window.customElements.get(childTagName) == undefined) {
            let newComp = document.createElement(childTagName);
            let className = this.#constructComponentClassName(newComp);
            let classDefinition = await import(`${this.#componentpath.root}/${className}/${className}.js`);
            let parentMap = new Map([[this.localName, this ]]);
            AVutils.concatMaps(parentMap, this._parentComponentsMap);
            classDefinition.default.prototype._parentComponentsMap = parentMap;
            this.#defineCustomComponent(newComp,classDefinition);
        }
    }

    getParentComponent(localName) {
        if(!localName.includes('comp-')) {
            localName = `comp-${localName}`;
        }
        return this._parentComponentsMap.get(localName);
    }

    getChildComponent(localName) {
        if(!localName.includes('comp-')) {
            localName = `comp-${localName}`;
        }
        return this.#childrenComponentList.get(localName);
    }

    getAllChildrenComponents() {
        return this.#childrenComponentList.values();
    }

    getComponentRoot() {
        return this.#componentpath.root;
    }

    renderedCallback(){}
}