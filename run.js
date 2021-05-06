const child_process = require("child_process");
const path = require("path");

const keyed = [
  "keyed/1more",
  "keyed/angular",
  "keyed/boredom",
  "keyed/fluid",
  "keyed/hyperhtml",
  "keyed/lit-html",
  "keyed/react",
  "keyed/solid",
  "keyed/vanillajs",
  "keyed/vue",
];

const nonKeyed = [
  "non-keyed/angular",
  "non-keyed/aurelia",
  "non-keyed/elm",
  "non-keyed/fluid",
  "non-keyed/lighterhtml",
  "non-keyed/lit-html",
  "non-keyed/react",
  "non-keyed/svelte",
  "non-keyed/vanillajs",
  "non-keyed/vue",
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

if (process.argv.includes("build-keyed")) {
  for (const framework of keyed) {
    message(`BUILDING ${framework}`);

    const options = {
      cwd: path.join(process.cwd(), "frameworks", framework),
      stdio: "inherit",
    };

    execute("npm install", options);
    execute("npm audit fix", options);
    execute("npm run build-prod", options);
  }
} else if (process.argv.includes("build-non-keyed")) {
  for (const framework of nonKeyed) {
    message(`BUILDING ${framework}`);

    const options = {
      cwd: path.join(process.cwd(), "frameworks", framework),
      stdio: "inherit",
    };

    execute("npm install", options);
    execute("npm audit fix", options);
    execute("npm run build-prod", options);
  }
} else if (process.argv.includes("bench-keyed")) {
  const options = {
    cwd: path.join(process.cwd(), "webdriver-ts"),
    stdio: "inherit",
  };

  for (const framework of keyed) {
    message(`RUNNING ${framework}`);
    execute(`npm run bench ${framework}`, options);
  }
} else if (process.argv.includes("bench-non-keyed")) {
  const options = {
    cwd: path.join(process.cwd(), "webdriver-ts"),
    stdio: "inherit",
  };

  for (const framework of nonKeyed) {
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
