import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default {
  input: "./src/index.jsx",
  plugins: [
    babel({ babelHelpers: "bundled", plugins: ["@incinerate/babel-plugin"] }),
    nodeResolve(),
    terser(),
  ],
  output: {
    file: "./dist/index.js",
    format: "iife",
  },
};
