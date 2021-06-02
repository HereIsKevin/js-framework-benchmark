const child_process = require("child_process");
const path = require("path");

const frameworks = [
  "keyed/1more",
  "keyed/elm",
  "keyed/fluid",
  "keyed/hyperhtml",
  "keyed/imba",
  "keyed/incinerate",
  "keyed/inferno",
  "keyed/ivi",
  "keyed/lit-html",
  "keyed/sinuous",
  "keyed/solid",
  "keyed/svelte",
  "keyed/vanillajs",
];

const message = (value) =>
  console.log(
    `\x1b[30;47m${value}${" ".repeat(
      process.stdout.columns - value.length
    )}\x1b[0m`
  );

const error = (value) =>
  console.error(
    `\x1b[30;41m${value}${" ".repeat(
      process.stdout.columns - value.length
    )}\x1b[0m`
  );

const execute = (command, options) => {
  try {
    child_process.execSync(command, options);
  } catch {
    error(`FAILED ${command}`);
  }
};

if (process.argv.includes("build")) {
  for (const framework of frameworks) {
    message(`BUILDING ${framework}`);

    const options = {
      cwd: path.join(process.cwd(), "frameworks", framework),
      stdio: "inherit",
    };

    execute("npm install", options);
    execute("npm audit fix", options);
    execute("npm run build-prod", options);
  }
} else if (process.argv.includes("bench")) {
  const options = {
    cwd: path.join(process.cwd(), "webdriver-ts"),
    stdio: "inherit",
  };

  for (const framework of frameworks) {
    message(`RUNNING ${framework}`);
    execute(`npm run bench ${framework}`, options);
  }
} else if (process.argv.includes("results")) {
  const options = {
    cwd: path.join(process.cwd(), "webdriver-ts"),
    stdio: "inherit",
  };

  execute("npm run results", options);
}
