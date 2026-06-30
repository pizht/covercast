import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // ──────────────────────────────────────────────
  // Architecture boundary governance
  //
  // 定义 4 个架构层：
  //   domain  - 纯业务逻辑层（无 React、无 DOM、无 app 依赖）
  //   app     - 应用层（api, components, hooks, lib, pages）
  //   config  - 配置层（canvasPresets, fonts）
  //   shared  - 共享层（UI 组件库 + 工具函数）
  //
  // 依赖方向：
  //   domain  → domain, config
  //   app     → domain, app, config, shared
  //   config  → config
  //   shared  → shared
  // ──────────────────────────────────────────────
  {
    files: ['src/**/*'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: 'src/domain/**/*', mode: 'full' },
        { type: 'app', pattern: 'src/app/**/*', mode: 'full' },
        { type: 'config', pattern: 'src/config/**/*', mode: 'full' },
        { type: 'shared', pattern: 'src/shared/**/*', mode: 'full' },
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: { type: 'domain' },
              allow: { to: { type: ['domain', 'config'] } },
            },
            {
              from: { type: 'app' },
              allow: { to: { type: ['domain', 'app', 'config', 'shared'] } },
            },
            {
              from: { type: 'config' },
              allow: { to: { type: ['config'] } },
            },
            {
              from: { type: 'shared' },
              allow: { to: { type: ['shared'] } },
            },
          ],
        },
      ],
      'boundaries/no-unknown-files': 'error',
    },
  },

  // ──────────────────────────────────────────────
  // Domain layer: external dependencies & DOM globals
  //
  // domain/ 不能依赖 React/Next.js（外部依赖），不能使用 DOM globals。
  // 架构边界（domain → app 禁止等）由上面的 boundaries/dependencies 处理。
  // ──────────────────────────────────────────────
  {
    files: ['src/domain/**/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'domain/ must not depend on React. Keep domain layer pure (no UI).',
            },
            {
              name: 'react-dom',
              message: 'domain/ must not depend on React DOM. Keep domain layer pure (no UI).',
            },
            {
              name: 'react/jsx-runtime',
              message:
                'domain/ must not depend on React JSX runtime. Keep domain layer pure (no UI).',
            },
            {
              name: 'next',
              message: 'domain/ must not depend on Next.js. Keep domain layer pure.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'indexedDB',
      ],
    },
  },
])

export default eslintConfig
