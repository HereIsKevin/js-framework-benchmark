class Template {
    constructor(strings, values) {
        this.strings = strings;
        this.values = values;
    }
    equals(template) {
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
        const template = document.createElement("template");
        template.innerHTML = result;
        return template.content;
    }
}
function html(strings, ...values) {
    return new Template(strings, values);
}

function eventUpdater(name) {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind event updater to element");
        }
        let last;
        return (value) => {
            if (typeof last !== "undefined") {
                node.removeEventListener(name, last);
            }
            last = value;
            node.addEventListener(name, last);
        };
    };
}
function toggleUpdater(name) {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind toggle updater to element");
        }
        return (value) => {
            if (value) {
                node.setAttribute(name, "");
            }
            else {
                node.removeAttribute(name);
            }
        };
    };
}
function propertyUpdater(name) {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind property updater to element");
        }
        return (value) => {
            Reflect.set(node, name, value);
        };
    };
}
function referenceUpdater() {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind reference updater to element");
        }
        return (value) => {
            value(node);
        };
    };
}
function styleUpdater() {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind style updater to element");
        }
        let oldValues = {};
        return (value) => {
            const element = node;
            const values = value;
            for (const key in values) {
                const oldValue = oldValues[key];
                const newValue = values[key];
                if (oldValue !== newValue) {
                    Reflect.set(element.style, key, newValue);
                }
            }
            oldValues = values;
        };
    };
}
function attributeUpdater(name) {
    return (node) => {
        if (!(node instanceof Element)) {
            throw new Error("can only bind attribute updater to element");
        }
        return (value) => {
            node.setAttribute(name, String(value));
        };
    };
}
function sequenceUpdater() {
    return (node) => {
        const start = new Comment();
        const end = new Comment();
        node.replaceWith(start, end);
        let keyed;
        return (value) => {
            if (typeof keyed === "undefined" &&
                Array.isArray(value) &&
                value.length > 0) {
                keyed = Array.isArray(value[0]);
            }
            if (keyed) {
                renderArrangement(start, end, value);
            }
            else {
                renderSequence(start, end, value);
            }
        };
    };
}
function templateUpdater() {
    return (node) => {
        const start = new Comment();
        const end = new Comment();
        node.replaceWith(start, end);
        return (value) => {
            renderTemplate(start, end, value);
        };
    };
}
function textUpdater() {
    return (node) => {
        const text = new Text();
        node.replaceWith(text);
        return (value) => {
            text.nodeValue = String(value);
        };
    };
}

class Compiler {
    constructor(template) {
        this.updaters = {};
        this.template = template;
        this.fragment = this.template.generate();
        this.id = 0;
        this.compile(this.fragment);
    }
    getId() {
        const id = String(this.id);
        this.id++;
        return id;
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
    compileAttributes(element) {
        let id;
        for (const attribute of element.getAttributeNames()) {
            const value = element.getAttribute(attribute) ?? "";
            const matches = value.match(/^<!--([0-9]+)-->$/);
            if (matches !== null) {
                if (typeof id === "undefined") {
                    id = this.getId();
                    this.updaters[id] = [];
                    element.setAttribute("data-fluid-id", id);
                }
                const index = Number(matches[1]);
                const eventMatches = attribute.match(/^@(.+)$/);
                const toggleMatches = attribute.match(/^(.+)\?$/);
                const propertyMatches = attribute.match(/^\.(.+)$/);
                element.removeAttribute(attribute);
                let base;
                if (eventMatches !== null) {
                    base = eventUpdater(eventMatches[1]);
                }
                else if (toggleMatches !== null) {
                    base = toggleUpdater(toggleMatches[1]);
                }
                else if (propertyMatches !== null) {
                    base = propertyUpdater(propertyMatches[1]);
                }
                else if (attribute === "ref") {
                    base = referenceUpdater();
                }
                else if (attribute === "style") {
                    if (typeof this.template.values[index] === "string") {
                        base = attributeUpdater("style");
                    }
                    else {
                        base = styleUpdater();
                    }
                }
                else {
                    base = attributeUpdater(attribute);
                }
                this.updaters[id].push({ index, base });
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
    compileValues(node) {
        for (const comment of this.findComments(node)) {
            const value = comment.nodeValue ?? "";
            const matches = value.match(/^([0-9]+)$/);
            if (matches !== null) {
                const index = Number(matches[1]);
                const actual = this.template.values[index];
                const id = this.getId();
                const node = document.createElement("span");
                node.setAttribute("data-fluid-id", id);
                let base;
                if (Array.isArray(actual)) {
                    base = sequenceUpdater();
                }
                else if (actual instanceof Template) {
                    base = templateUpdater();
                }
                else {
                    base = textUpdater();
                }
                this.updaters[id] = [{ index, base }];
                comment.replaceWith(node);
            }
        }
    }
}

class Instance {
    constructor(template) {
        this.updaters = {};
        this.template = template;
        this.compiler = this.getCompiler(this.template);
        this.fragment = this.compiler.fragment.cloneNode(true);
        this.instantiate();
    }
    getCompiler(template) {
        for (const compiler of Instance.compilers) {
            if (compiler.template.equals(template)) {
                return compiler;
            }
        }
        const compiler = new Compiler(template);
        Instance.compilers.push(compiler);
        return compiler;
    }
    instantiate() {
        for (const target of this.fragment.querySelectorAll("[data-fluid-id]")) {
            const id = Number(target.getAttribute("data-fluid-id"));
            for (const { index, base } of this.compiler.updaters[id]) {
                this.updaters[index] = base(target);
            }
            target.removeAttribute("data-fluid-id");
        }
    }
}
Instance.compilers = [];

const holes = new WeakMap();
const burrows = new WeakMap();
const caches = new WeakMap();
const sequences = new WeakMap();
function clearNodes(start, end) {
    let current = start.nextSibling;
    while (current !== null && current !== end) {
        current.remove();
        current = start.nextSibling;
    }
}
function renderArrangement(startMarker, endMarker, arrangements) {
    const burrow = burrows.get(startMarker);
    if (typeof burrow === "undefined" || burrow.length === 0) {
        const burrow = [];
        for (const [key, template] of arrangements) {
            const start = new Comment();
            const end = new Comment();
            endMarker.before(start, end);
            renderTemplate(start, end, template);
            burrow.push({ key, start, end });
        }
        burrows.set(startMarker, burrow);
        return;
    }
    if (arrangements.length === 0) {
        clearNodes(startMarker, endMarker);
        if (typeof burrow !== "undefined") {
            burrow.length = 0;
        }
        return;
    }
    const oldKeys = burrow.map((value) => value.key);
    const newKeys = arrangements.map((value) => value[0]);
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex <= oldKeys.length && newIndex <= newKeys.length) {
        const oldKey = oldKeys[oldIndex];
        const newKey = newKeys[newIndex];
        if (typeof oldKey === "undefined" && typeof newKey === "undefined") {
            break;
        }
        if (oldKey === newKey) {
            const { start, end } = burrow[oldIndex];
            const template = arrangements[newIndex][1];
            renderTemplate(start, end, template);
            oldIndex++;
            newIndex++;
        }
        else if (oldKeys.length < newKeys.length) {
            const marker = burrow[oldIndex]?.start ?? endMarker;
            const start = new Comment();
            const end = new Comment();
            marker.before(start, end);
            burrow.splice(oldIndex, 0, { key: newKey, start, end });
            oldKeys.splice(oldIndex, 0, newKey);
        }
        else {
            const { start, end } = burrow.splice(oldIndex, 1)[0];
            clearNodes(start, end);
            start.remove();
            end.remove();
            oldKeys.splice(oldIndex, 1);
        }
    }
}
function renderSequence(startMarker, endMarker, templates) {
    const sequence = sequences.get(startMarker);
    if (typeof sequence === "undefined" || sequence.length === 0) {
        const sequence = [];
        for (const template of templates) {
            const start = new Comment();
            const end = new Comment();
            endMarker.before(start, end);
            renderTemplate(start, end, template);
            sequence.push({ start, end });
        }
        sequences.set(startMarker, sequence);
        return;
    }
    if (templates.length === 0) {
        clearNodes(startMarker, endMarker);
        if (typeof sequence !== "undefined") {
            sequence.length = 0;
        }
        return;
    }
    if (templates.length < sequence.length) {
        const start = sequence[templates.length].start;
        const end = sequence[sequence.length - 1].end;
        clearNodes(start, end);
        start.remove();
        end.remove();
        sequence.length = templates.length;
    }
    while (templates.length > sequence.length) {
        const start = new Comment();
        const end = new Comment();
        endMarker.before(start, end);
        renderTemplate(start, end, templates[sequence.length]);
        sequence.push({ start, end });
    }
    for (let index = 0; index < sequence.length; index++) {
        const { start, end } = sequence[index];
        renderTemplate(start, end, templates[index]);
    }
}
function renderTemplate(start, end, template) {
    const cache = caches.get(start);
    if (typeof cache === "undefined" || !cache.template.equals(template)) {
        const instance = new Instance(template);
        clearNodes(start, end);
        start.after(instance.fragment);
        for (let index = 0; index < template.values.length; index++) {
            const updater = instance.updaters[index];
            const value = template.values[index];
            updater(value);
        }
        caches.set(start, { template, updaters: instance.updaters });
        return;
    }
    for (let index = 0; index < template.values.length; index++) {
        const oldValue = cache.template.values[index];
        const newValue = template.values[index];
        if (oldValue !== newValue) {
            const updater = cache.updaters[index];
            updater(newValue);
        }
    }
    cache.template = template;
}
function render(target, template) {
    let hole = holes.get(target);
    if (typeof hole === "undefined") {
        const start = new Comment();
        const end = new Comment();
        target.append(start, end);
        hole = { start, end };
        holes.set(target, hole);
    }
    renderTemplate(hole.start, hole.end, template);
}

export { Template, html, render };
