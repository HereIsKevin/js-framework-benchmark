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
            throw new Error("can only toggle event updater to element");
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
        return (value) => {
            renderSequence(start, end, value);
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
    createId() {
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
                    id = this.createId();
                    element.setAttribute("data-fluid-id", id);
                }
                const index = Number(matches[1]);
                const eventMatches = attribute.match(/^@(.+)$/);
                const toggleMatches = attribute.match(/^(.+)\?$/);
                element.removeAttribute(attribute);
                if (eventMatches !== null) {
                    this.updaters[index] = { id, base: eventUpdater(eventMatches[1]) };
                }
                else if (toggleMatches !== null) {
                    this.updaters[index] = { id, base: toggleUpdater(toggleMatches[1]) };
                }
                else {
                    this.updaters[index] = { id, base: attributeUpdater(attribute) };
                }
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
                const id = this.createId();
                const node = document.createElement("span");
                node.setAttribute("data-fluid-id", id);
                node.setAttribute("data-fluid-replace", "");
                if (Array.isArray(actual)) {
                    this.updaters[index] = { id, base: sequenceUpdater() };
                }
                else if (actual instanceof Template) {
                    this.updaters[index] = { id, base: templateUpdater() };
                }
                else {
                    this.updaters[index] = { id, base: textUpdater() };
                }
                comment.replaceWith(node);
            }
        }
    }
}

const compilers = [];
class Instance {
    constructor(template) {
        this.updaters = {};
        this.template = template;
        this.compiler = this.getCompiler(this.template);
        this.fragment = this.compiler.fragment.cloneNode(true);
        this.instantiate();
    }
    getCompiler(template) {
        for (const compiler of compilers) {
            if (compiler.template.equalStrings(template)) {
                return compiler;
            }
        }
        const compiler = new Compiler(template);
        compilers.unshift(compiler);
        return compiler;
    }
    instantiate() {
        const targets = new Set();
        for (const key in this.compiler.updaters) {
            const { id, base } = this.compiler.updaters[key];
            const target = this.fragment.querySelector(`[data-fluid-id="${id}"]`);
            let node;
            if (target?.hasAttribute("data-fluid-replace")) {
                node = new Comment();
                target?.replaceWith(node);
            }
            else {
                node = target;
                targets.add(target);
            }
            this.updaters[key] = base(node);
        }
        for (const target of targets) {
            target.removeAttribute("data-fluid-id");
        }
    }
}

const rendered = new WeakMap();
const caches = new WeakMap();
const sequences = new WeakMap();
function clearNodes(start, end) {
    let current = start.nextSibling;
    while (current !== null && current !== end) {
        current.remove();
        current = start.nextSibling;
    }
}
function renderSequence(startMarker, endMarker, templates) {
    const sequence = sequences.get(startMarker);
    if (templates.length === 0) {
        clearNodes(startMarker, endMarker);
        if (typeof sequence !== "undefined") {
            sequence.length = 0;
        }
        return;
    }
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
    if (typeof cache === "undefined" || !cache.template.equalStrings(template)) {
        clearNodes(start, end);
        const instance = new Instance(template);
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
    let result = rendered.get(target);
    if (typeof result === "undefined") {
        const start = new Comment();
        const end = new Comment();
        target.append(start, end);
        result = { start, end };
        rendered.set(target, result);
    }
    renderTemplate(result.start, result.end, template);
}

export { Template, html, render };
