// پس از build: فهرست همهٔ فایل‌های خروجی را در dist/sw.js می‌نویسد و برای هر ساخت نام کش یکتا می‌سازد.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name)
  return statSync(p).isDirectory() ? walk(p) : [p]
})

export default function precache() {
  let outDir = 'dist'
  return {
    name: 'precache-manifest',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir },
    closeBundle() {
      // sw.js و /data/ (شبکه‌اول) در Precache نیستند
      const files = walk(outDir).filter((f) => !f.endsWith('sw.js') && !f.includes(`${sep}data${sep}`)).sort()
      const hash = createHash('sha1')
      for (const f of files) { hash.update(f); hash.update(readFileSync(f)) }
      const urls = ['/', ...files.map((f) => '/' + relative(outDir, f).split(sep).join('/'))]
      const build = `${Date.now()}-${hash.digest('hex').slice(0, 8)}`
      const sw = join(outDir, 'sw.js')
      writeFileSync(sw, readFileSync(sw, 'utf8').replace('__BUILD__', build).replace('[/*PRECACHE*/]', JSON.stringify(urls)))
    },
  }
}
