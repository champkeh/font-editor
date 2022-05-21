import {defineConfig} from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import babel from "@rollup/plugin-babel"
import pkg from './package.json'

const extensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx'
]

export default defineConfig([
        {
            input: 'src/entry/entry-cjs.ts',

            external: [],

            plugins: [
                resolve({ extensions }),
                babel({
                    extensions,
                    babelHelpers: 'bundled',
                    include: ['src/**/*']
                }),
            ],

            output: {
                file: pkg.main,
                format: 'cjs'
            },
        },
        {
            input: 'src/entry/entry-es.ts',

            external: [],

            plugins: [
                resolve({ extensions }),
                babel({
                    extensions,
                    babelHelpers: 'bundled',
                    include: ['src/**/*']
                }),
            ],

            output: [
                {
                    file: pkg.module,
                    format: 'es'
                },
                {
                    file: pkg.browser,
                    format: 'iife',
                    name: 'FontEditor'
                }
            ],
        }
    ]
)
