import { memoized } from "../node_modules/boredom/dist/esm/index.js";

const { html, render } = memoized;

const adjectives = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];

const colors = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];

const nouns = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

let data = [];
let dataId = 1;
let selected = -1;

const add = () => {
  data.push(...buildData(1000));
  _render();
};

const run = () => {
  data = buildData(1000);
  _render();
};

const runLots = () => {
  data = buildData(10000);
  _render();
};

const clear = () => {
  data = [];
  _render();
};

const interact = (event) => {
  const cell = event.target.closest("td");
  const interaction = cell.getAttribute("data-interaction");
  const id = Number(cell.parentNode.id);

  if (interaction === "delete") {
    del(id);
  } else {
    select(id);
  }
};

const del = (id) => {
  const idIndex = data.findIndex((d) => d.id == id);
  data.splice(idIndex, 1);
  _render();
};

const select = (id) => {
  if (selected > -1) {
    data[selected].selected = false;
  }

  selected = data.findIndex((d) => d.id === id);
  data[selected].selected = true;
  _render();
};

const swapRows = () => {
  if (data.length > 998) {
    [data[998], data[1]] = [data[1], data[998]];
  }

  _render();
};

const update = () => {
  for (let index = 0; index < data.length; index += 10) {
    data[index].label += " !!!";
  }

  _render();
};

const buildData = (count) => {
  const data = [];

  for (let index = 0; index < count; index++) {
    data.push({
      id: dataId,
      label: `${adjectives[_random(adjectives.length)]} ${
        colors[_random(colors.length)]
      } ${nouns[_random(nouns.length)]}`,
      selected: false,
    });

    dataId++;
  }

  return data;
};

const _random = (max) => Math.round(Math.random() * 1000) % max;

const container = document.getElementById("container");

const _render = () => render(container, template());

const template = () => html`
  <div class="container">
    <div class="jumbotron">
      <div class="row">
        <div class="col-md-6">
          <h1>boreDOM</h1>
        </div>
        <div class="col-md-6">
          <div class="row">
            <div class="col-sm-6 smallpad">
              <button type="button" class="btn btn-primary btn-block" id="run">
                Create 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="runlots"
              >
                Create 10,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button type="button" class="btn btn-primary btn-block" id="add">
                Append 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="update"
              >
                Update every 10th row
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="clear"
              >
                Clear
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="swaprows"
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table class="table table-hover table-striped test-data" id="interact">
      <tbody>
        ${data.map(
          (item) => `
            <tr id="${item.id}"" class="${item.selected ? "danger" : ""}">
              <td class="col-md-1">${item.id}</td>
              <td class="col-md-4">
                <a>${item.label}</a>
              </td>
              <td data-interaction="delete" class="col-md-1">
                <a>
                  <span
                    class="glyphicon glyphicon-remove"
                    aria-hidden="true"
                  ></span>
                </a>
              </td>
              <td class="col-md-6"></td>
            </tr>
          `
        )}
      </tbody>
    </table>
    <span
      class="preloadicon glyphicon glyphicon-remove"
      aria-hidden="true"
    ></span>
  </div>
`;

_render();

document.getElementById("run").addEventListener("click", run);
document.getElementById("runlots").addEventListener("click", runLots);
document.getElementById("add").addEventListener("click", add);
document.getElementById("update").addEventListener("click", update);
document.getElementById("clear").addEventListener("click", clear);
document.getElementById("swaprows").addEventListener("click", swapRows);
document.getElementById("interact").addEventListener("click", interact);
