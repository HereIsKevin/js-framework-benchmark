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

const data = incinerate.observable([]);

let dataId = 1;
let selected = -1;

const add = () => {
  data([...data(), ...buildData(1000)]);
};

const run = () => {
  data(buildData(1000));
};

const runLots = () => {
  data(buildData(10000));
};

const clear = () => {
  data([]);
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

  data([...data().slice(0, idIndex), ...data().slice(idIndex + 1)]);
};

const select = (id) => {
  if (selected > -1) {
    data()[selected].selected(false);
  }

  selected = data().findIndex((d) => d.id === id);
  data()[selected].selected(true);
};

const swapRows = () => {
  if (data().length > 998) {
    data([
      data()[0],
      data()[998],
      ...data().slice(2, 998),
      data()[1],
      ...data().slice(999),
    ]);
  }
};

const update = () => {
  for (let index = 0; index < data().length; index += 10) {
    data()[index].label(`${data()[index].label()} !!!`);
  }
};

const buildData = (count) => {
  const data = [];

  for (let index = 0; index < count; index++) {
    data.push({
      id: dataId,
      label: incinerate.observable(
        `${adjectives[_random(adjectives.length)]} ${
          colors[_random(colors.length)]
        } ${nouns[_random(nouns.length)]}`
      ),
      selected: incinerate.observable(false),
    });

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
                onClick={run}
              >
                Create 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="runlots"
                onClick={runLots}
              >
                Create 10,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="add"
                onClick={add}
              >
                Append 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="update"
                onClick={update}
              >
                Update every 10th row
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="clear"
                onClick={clear}
              >
                Clear
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="swaprows"
                onClick={swapRows}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table onClick={interact} class="table table-hover table-striped test-data">
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
