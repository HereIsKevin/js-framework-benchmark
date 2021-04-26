class Template {
    constructor(strings, values) {
        this.strings = strings;
        this.values = values;
    }
    equalStrings(template) {
        if (this.strings.length !== template.strings.length) {
            return false;
        }
        for (let index = 0; index < this.strings.length; index++) {
            if (this.strings[index] !== template.strings[index]) {
                return false;
            }
        }
        return true;
    }
    generate() {
        let result = this.strings[0];
        for (let index = 1; index < this.strings.length; index++) {
            result += `<!--${index - 1}-->`;
            result += this.strings[index];
        }
        const cached = Template.cache[result];
        if (typeof cached == "undefined") {
            const template = document.createElement("template");
            template.innerHTML = result;
            const fragment = template.content;
            Template.cache[result] = fragment;
            return fragment.cloneNode(true);
        }
        else {
            return cached.cloneNode(true);
        }
    }
}
Template.cache = {};
function html(strings, ...values) {
    return new Template(strings, values);
}

class Compiler {
    constructor(template) {
        this.attributes = {};
        this.values = {};
        this.template = template;
        this.fragment = this.template.generate();
        this.compile(this.fragment);
    }
    compile(node) {
        if (node instanceof Element) {
            this.compileAttributes(node);
        }
        this.compileValues(node);
        for (const child of node.childNodes) {
            this.compile(child);
        }
    }
    matchAttribute(attribute) {
        const eventMatches = attribute.match(/^@(.+)$/);
        const toggleMatches = attribute.match(/^(.+)\?$/);
        if (eventMatches !== null && toggleMatches !== null) {
            throw new Error("attribute kind cannot be both event and toggle");
        }
        if (eventMatches !== null) {
            return { kind: "event", name: eventMatches[1] };
        }
        else if (toggleMatches !== null) {
            return { kind: "toggle", name: toggleMatches[1] };
        }
        else {
            return { kind: "value", name: attribute };
        }
    }
    compileAttributes(element) {
        for (const attribute of element.getAttributeNames()) {
            const value = element.getAttribute(attribute) ?? "";
            const matches = value.match(/^<!--([0-9]+)-->$/);
            if (matches !== null) {
                const index = Number(matches[1]);
                const { kind, name } = this.matchAttribute(attribute);
                this.attributes[index] = { kind, element, name };
                element.removeAttribute(attribute);
            }
        }
    }
    findComments(node) {
        const result = [];
        for (const child of node.childNodes) {
            if (child instanceof Comment) {
                result.push(child);
            }
        }
        return result;
    }
    matchValue(value) {
        if (Array.isArray(value)) {
            return "sequence";
        }
        else if (value instanceof Template) {
            return "template";
        }
        else {
            return "text";
        }
    }
    compileValues(node) {
        for (const comment of this.findComments(node)) {
            const value = comment.nodeValue ?? "";
            const matches = value.match(/^([0-9]+)$/);
            if (matches !== null) {
                const index = Number(matches[1]);
                const actual = this.template.values[index];
                const kind = this.matchValue(actual);
                const start = new Comment();
                const end = new Comment();
                this.values[index] = { kind, start, end };
                comment.replaceWith(start, end);
            }
        }
    }
}

const templates = new WeakMap();
const caches = new WeakMap();
const sequences = new WeakMap();
function clearElement(element) {
    while (element.firstChild) {
        element.firstChild.remove();
    }
}
function clearNodes(start, end) {
    let current = start.nextSibling;
    while (current !== null && current !== end) {
        current.remove();
        current = start.nextSibling;
    }
}
function renderSequence(startMarker, endMarker, oldTemplates, newTemplates) {
    if (typeof oldTemplates === "undefined" || oldTemplates.length === 0) {
        clearNodes(startMarker, endMarker);
        const sequence = [];
        for (const template of newTemplates) {
            const separator = new Comment();
            const start = new Comment();
            const end = new Comment();
            endMarker.before(separator, start, end);
            renderTemplate(start, end, undefined, template);
            sequence.push({ separator, start, end });
        }
        sequences.set(startMarker, sequence);
        return;
    }
    if (newTemplates.length === 0) {
        clearNodes(startMarker, endMarker);
        sequences.set(startMarker, []);
        return;
    }
    const sequence = sequences.get(startMarker);
    if (typeof sequence === "undefined") {
        throw new Error("sequence missing");
    }
    while (newTemplates.length < sequence.length) {
        const popped = sequence.pop();
        if (typeof popped === "undefined") {
            throw new Error("cannot align sequence length");
        }
        const { separator, start, end } = popped;
        clearNodes(start, end);
        separator.remove();
        start.remove();
        end.remove();
    }
    while (newTemplates.length > sequence.length) {
        const separator = new Comment();
        const start = new Comment();
        const end = new Comment();
        endMarker.before(separator, start, end);
        renderTemplate(start, end, undefined, newTemplates[sequence.length]);
        sequence.push({ separator, start, end });
    }
    for (let index = 0; index < sequence.length; index++) {
        const { start, end } = sequence[index];
        const oldTemplate = oldTemplates[index];
        const newTemplate = newTemplates[index];
        renderTemplate(start, end, oldTemplate, newTemplate);
    }
    sequences.set(startMarker, sequence);
}
function renderTemplate(start, end, oldTemplate, newTemplate) {
    if (typeof oldTemplate === "undefined" ||
        !oldTemplate.equalStrings(newTemplate)) {
        clearNodes(start, end);
        const compiler = new Compiler(newTemplate);
        const cache = {
            attributes: compiler.attributes,
            values: compiler.values,
        };
        start.after(compiler.fragment);
        for (let index = 0; index < newTemplate.values.length; index++) {
            const value = newTemplate.values[index];
            if (index in cache.attributes) {
                renderAttribute(cache.attributes[index], undefined, value);
            }
            else if (index in cache.values) {
                renderValue(cache.values[index], undefined, value);
            }
        }
        caches.set(start, cache);
        return;
    }
    const cache = caches.get(start);
    if (typeof cache === "undefined") {
        throw new Error("render cache is missing");
    }
    for (let index = 0; index < newTemplate.values.length; index++) {
        const oldValue = oldTemplate.values[index];
        const newValue = newTemplate.values[index];
        if (oldValue !== newValue) {
            if (index in cache.attributes) {
                renderAttribute(cache.attributes[index], oldValue, newValue);
            }
            else if (index in cache.values) {
                renderValue(cache.values[index], oldValue, newValue);
            }
        }
    }
}
function renderText(start, end, value) {
    const next = start.nextSibling;
    if (next instanceof Text && next.nextSibling === end) {
        next.nodeValue = value;
    }
    else {
        clearNodes(start, end);
        start.after(new Text(value));
    }
}
function renderValue({ kind, start, end }, oldValue, newValue) {
    if (kind === "sequence") {
        renderSequence(start, end, oldValue, newValue);
    }
    else if (kind === "template") {
        renderTemplate(start, end, oldValue, newValue);
    }
    else if (kind === "text") {
        renderText(start, end, String(newValue));
    }
}
function renderAttribute({ kind, name, element }, oldValue, newValue) {
    if (kind === "event") {
        if (typeof oldValue !== "undefined") {
            element.removeEventListener(name, oldValue);
        }
        element.addEventListener(name, newValue);
    }
    else if (kind === "toggle") {
        if (newValue) {
            element.setAttribute(name, "");
        }
        else {
            element.removeAttribute(name);
        }
    }
    else if (kind === "value") {
        element.setAttribute(name, String(newValue));
    }
}
function render(target, template) {
    if (!templates.has(target)) {
        clearElement(target);
        target.append(new Comment(), new Comment());
    }
    const start = target.firstChild;
    const end = target.lastChild;
    if (start instanceof Comment && end instanceof Comment) {
        renderTemplate(start, end, templates.get(target), template);
    }
    else {
        throw new Error("start or end markers missing");
    }
    templates.set(target, template);
}

export { Template, html, render };
