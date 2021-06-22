import { Signal, signal } from "@incinerate/runtime";

interface Row {
  id: number;
  label: Signal<string>;
  selected: Signal<boolean>;
}

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

const data = signal<Row[]>([]);

let dataId = 1;
let selected = -1;

function random(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

function add(): void {
  data.value.push(...buildData(1000));
  data.value = data.value;
}

function run(): void {
  data.value.length = 0;
  data.value = data.value;

  data.value.push(...buildData(1000));
  data.value = data.value;
}

function runLots(): void {
  data.value.length = 0;
  data.value = data.value;

  data.value.push(...buildData(10000));
  data.value = data.value;
}

function clear(): void {
  data.value.length = 0;
  data.value = data.value;
}

function interact(event: MouseEvent): void {
  const cell = (event.target as Element).closest("td")!;
  const interaction = cell.getAttribute("data-interaction");
  const id = Number((cell.parentNode as Element).id);

  if (interaction === "delete") {
    del(id);
  } else {
    select(id);
  }
}

function del(id: number): void {
  const idIndex = data.value.findIndex((d) => d.id === id);

  data.value.splice(idIndex, 1);
  data.value = data.value;
}

function select(id: number): void {
  if (selected > -1) {
    data.value[selected].selected.value = false;
  }

  selected = data.value.findIndex((d) => d.id === id);
  data.value[selected].selected.value = true;
}

function swapRows(): void {
  if (data.value.length > 998) {
    [data.value[998], data.value[1]] = [data.value[1], data.value[998]];
    data.value = data.value;
  }
}

function update(): void {
  for (let index = 0; index < data.value.length; index += 10) {
    const item = data.value[index];
    item.label.value = `${item.label.value} !!!`;
  }
}

function buildData(count: number): Row[] {
  const data = new Array(count);

  for (let index = 0; index < count; index++) {
    data[index] = {
      id: dataId,
      label: signal(
        `${adjectives[random(adjectives.length)]} ${
          colors[random(colors.length)]
        } ${nouns[random(nouns.length)]}`
      ),
      selected: signal(false),
    };

    dataId++;
  }

  return data;
}

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
                on:click={run}
              >
                Create 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="runlots"
                on:click={runLots}
              >
                Create 10,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="add"
                on:click={add}
              >
                Append 1,000 rows
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="update"
                on:click={update}
              >
                Update every 10th row
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="clear"
                on:click={clear}
              >
                Clear
              </button>
            </div>
            <div class="col-sm-6 smallpad">
              <button
                type="button"
                class="btn btn-primary btn-block"
                id="swaprows"
                on:click={swapRows}
              >
                Swap Rows
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table
      on:click={interact}
      class="table table-hover table-striped test-data"
    >
      <tbody>
        {data.value.map((item) => (
          <tr id={String(item.id)} class={item.selected.value ? "danger" : ""}>
            <td class="col-md-1">{item.id}</td>
            <td class="col-md-4">
              <a>{item.label.value}</a>
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
        ))}
      </tbody>
    </table>
    <span
      class="preloadicon glyphicon glyphicon-remove"
      aria-hidden="true"
    ></span>
  </div>
);

container!.appendChild(template);
