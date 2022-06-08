import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'src/translator.js',
    output: {
      file: 'docs/js/translator.js',
      format: 'iife',
      name: 'Translator',
      sourcemap: false,
    },
    plugins: [
      babel(
        { babelHelpers: 'bundled',
          exclude: 'node_modules/**', 
          "presets": [
            ["env", {
              "modules": false,
              "targets": {
                "chrome": 65,
                "safari": 13,
                "firefox": 60
              }
            }]
          ]}),
      terser(),
      nodeResolve()
    ]
  },
  {
    input: 'src/api.js',
    output: {
      file: 'docs/js/api.js',
      format: 'iife',
      name: 'API',
      sourcemap: false,
    },
    plugins: [
      babel(
        { babelHelpers: 'bundled',
          exclude: 'node_modules/**', 
          "presets": [
            ["env", {
              "modules": false,
              "targets": {
                "chrome": 65,
                "safari": 13,
                "firefox": 60
              }
            }]
          ]}),
      terser(),
      nodeResolve()
    ]
  },
  {
    input: 'src/internationalize.js',
    output: {
      file: 'docs/js/internationalize.js',
      format: 'iife',
      name: 'Internationalize',
      sourcemap: false,
    },
    plugins: [
      babel(
        { babelHelpers: 'bundled',
          exclude: 'node_modules/**', 
          "presets": [
            ["env", {
              "modules": false,
              "targets": {
                "chrome": 65,
                "safari": 13,
                "firefox": 60
              }
            }]
          ]}),
      terser(),
      nodeResolve()
    ]
  }
]
