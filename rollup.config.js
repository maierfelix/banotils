import json from "@rollup/plugin-json";
import clear from "rollup-plugin-clear";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  external: [],
  output: [
    {
      name: "banotils",
      dir: "dist",
      format: "iife",
      globals: {"crypto": "crypto"},
    }
  ],
  plugins: [
    clear({
      targets: ["dist"]
    }),
    resolve(),
    json(),
    esbuild({
      minify: true,
      sourceMap: false,
    }),
    commonjs({
      sourceMap: false,
      include: "./node_modules/**"
    }),
  ]
};
