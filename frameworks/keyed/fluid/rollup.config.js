import { nodeResolve } from "@rollup/plugin-node-resolve";
import minifyHTML from "rollup-plugin-minify-html-literals";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "iife",
  },
  plugins: [nodeResolve(), minifyHTML(), terser()],
};
