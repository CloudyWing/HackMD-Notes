import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default [
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    {
        files: ['**/*.{js,mjs,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
            },
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-v-html': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        ignores: [
            'node_modules/**',
            'docs/.vitepress/dist/**',
            'docs/.vitepress/cache/**',
            '.vitepress/dist/**',
            '.vitepress/cache/**',
            'dist/**',
            'coverage/**',
            'playwright-report/**',
            'test-results/**',
        ],
    },
]
