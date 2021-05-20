import * as incinerate from "@incinerate/runtime";

const _random = (max) => Math.round(Math.random() * 1000) % max;

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

const data = incinerate.signal([]);

let dataId = 1;
let selected = -1;

const add = () => {
  incinerate.push(data, ...buildData(1000));
};

const run = () => {
  incinerate.replace(data, buildData(1000));
};

const runLots = () => {
  incinerate.replace(data, buildData(10000));
};

const clear = () => {
  incinerate.clear(data);
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
  const idIndex = data().findIndex((d) => d.id === id);
  incinerate.splice(data, idIndex, 1);
};

const select = (id) => {
  if (selected > -1) {
    incinerate.get(data, selected).selected(false);
  }

  selected = data().findIndex((d) => d.id === id);
  incinerate.get(data, selected).selected(true);
};

const swapRows = () => {
  if (data().length > 998) {
    incinerate.swap(data, 1, 998);
  }
};

const update = () => {
  for (let index = 0; index < data().length; index += 10) {
    const item = incinerate.get(data, index);
    item.label(`${item.label()} !!!`);
  }
};

const buildData = (count) => {
  const data = new Array(count);

  for (let index = 0; index < count; index++) {
    data[index] = {
      id: dataId,
      label: incinerate.signal(
        `${adjectives[_random(adjectives.length)]} ${
          colors[_random(colors.length)]
        } ${nouns[_random(nouns.length)]}`
      ),
      selected: incinerate.signal(false),
    };

    dataId++;
  }

  return data;
};

const container = document.getElementById("container");
const template = (
  <div class="container">
    <div class="jumbotron">
      <div class="row">
        <div class="col-md-6">
          <h1>Incinerate</h1>
        </div>
        <div class="col-md-6">
          <div class="row">
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="run"
                onclick={run}
              >
                Create 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="runlots"
                onclick={runLots}
              >
                Create 10,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="add"
                onclick={add}
              >
                Append 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="update"
                onclick={update}
              >
                Update every 10th row
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="clear"
                onclick={clear}
              >
                Clear
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="swaprows"
                onclick={swapRows}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table onclick={interact} class="table table-hover table-striped test-data">
      <tbody>
        {incinerate.sequence(
          data,
          (item) => item.id,
          (item) => (
            <tr id={item.id} class={item.selected() ? "danger" : ""}>
              <td class="col-md-1">{item.id}</td>
              <td class="col-md-4">
                <a>{item.label()}</a>
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
          )
        )}
      </tbody>
    </table>
    <span
      class="preloadicon glyphicon glyphicon-remove"
      aria-hidden="true"
    ></span>
  </div>
);

container.appendChild(template);