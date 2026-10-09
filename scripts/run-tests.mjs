// اجرای تست‌ها بدون وابستگی جدید: esbuild (همراه Vite) تست‌ها را باندل می‌کند و اجراکنندهٔ داخلی Node آن‌ها را اجرا می‌کند.
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = join(root, 'tests')
const files = readdirSync(dir).filter((f) => f.endsWith('.test.ts')).map((f) => join(dir, f))
const out = mkdtempSync(join(tmpdir(), 'tagh-tests-'))
await build({ entryPoints: files, bundle: true, platform: 'node', format: 'esm', outdir: out, outExtension: { '.js': '.mjs' }, logLevel: 'error', loader: { '.json': 'json' }, banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" } })
const bundles = readdirSync(out).filter((f) => f.endsWith('.mjs')).map((f) => join(out, f))
process.exit(spawnSync(process.execPath, ['--test', ...bundles], { stdio: 'inherit' }).status ?? 1)
