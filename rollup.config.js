import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

export default {
  input: "./src/server.js",
  output: {
    dir: "dist",
    format: "cjs",
  },
  plugins: [
    resolve(), // Resolve external modules
    commonjs(), // Convert CommonJS modules to ES modules
    terser(), // Minify the output (optional)
    json(),
  ],
};
