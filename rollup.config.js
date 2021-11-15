import clear from "rollup-plugin-clear";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import glslify from "rollup-plugin-glslify";
import typescript from "rollup-plugin-typescript2";
import {terser} from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  external: [],
  output: [
    {
      name: "banotils",
      file: "dist/index.esm.js",
      format: "esm",
    },
    {
      name: "banotils",
      file: "dist/index.js",
      format: "cjs",
    },
    {
      name: "banotils",
      file: "dist/index.iife.js",
      format: "iife",
    }
  ],
  plugins: [
    clear({
      targets: ["dist"]
    }),
    glslify({
      compress: true,
      exclude: "node_modules/**",
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
      tsconfig: "./tsconfig.json",
      module: "esnext"
    }),
    resolve(),
    commonjs({
      sourceMap: false,
      include: "./node_modules/**"
    }),
    terser(),
  ]
};
