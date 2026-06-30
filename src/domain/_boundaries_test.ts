/**
 * ESLint 架构边界规则测试文件
 *
 * 用途：验证 eslint-plugin-boundaries + no-restricted-imports + no-restricted-globals
 *       是否正常工作。跑 `npx eslint src/domain/_boundaries_test.ts --no-cache` 应该报 6 个 error。
 *
 * 注意：此文件故意违规，不要修复。`npm run lint` 会因此失败，
 *       验证完后可以删除或重命名为 .backup 后缀。
 */

// ──────────────────────────────────────────────
// 测试 1: domain → app (runtime import)
// 预期 error: boundaries/dependencies
// ──────────────────────────────────────────────
import { useTemplateManager } from '@/app/hooks/useTemplateManager'

// ──────────────────────────────────────────────
// 测试 2: domain → app (type-only import)
// 预期 error: boundaries/dependencies
// 这是旧配置（no-restricted-imports patterns）漏掉的漏洞，新配置应该抓住
// ──────────────────────────────────────────────
import type { CustomSceneTemplate } from '@/app/hooks/useTemplateManager'

// ──────────────────────────────────────────────
// 测试 3: domain → app/components
// 预期 error: boundaries/dependencies
// ──────────────────────────────────────────────
import { SceneCanvas } from '@/app/components/SceneCanvas'

// ──────────────────────────────────────────────
// 测试 4: domain → shared/components
// 预期 error: boundaries/dependencies
// ──────────────────────────────────────────────
import { Button } from '@/shared/components/ui/button'

// ──────────────────────────────────────────────
// 测试 5: domain → react (外部依赖)
// 预期 error: no-restricted-imports (paths)
// ──────────────────────────────────────────────
import React from 'react'

// ──────────────────────────────────────────────
// 测试 6: domain → DOM global
// 预期 error: no-restricted-globals
// ──────────────────────────────────────────────
const storage = window.localStorage

// ──────────────────────────────────────────────
// 导出引用，避免 unused 警告干扰测试
// ──────────────────────────────────────────────
export const _test = {
  useTemplateManager,
  CustomSceneTemplate: null as unknown as CustomSceneTemplate,
  SceneCanvas,
  Button,
  React,
  storage,
}
