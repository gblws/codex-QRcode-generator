const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const path = require('node:path')

const port = 5190
const root = path.join(__dirname, '..')
const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  env: { ...process.env, BROWSER: 'none' },
  stdio: ['ignore', 'pipe', 'pipe']
})

let output = ''
let settled = false
const finish = (error) => {
  if (settled) return
  settled = true
  clearTimeout(timeout)
  server.kill()
  if (error) {
    console.error(output)
    process.exitCode = 1
  }
}

server.stdout.on('data', (chunk) => {
  output += chunk.toString()
  if (output.includes(`http://127.0.0.1:${port}/`)) finish()
})
server.stderr.on('data', (chunk) => { output += chunk.toString() })
server.on('error', (error) => finish(error))
server.on('exit', (code) => {
  if (!settled && code !== null) finish(new Error(output || `dev server exited with ${code}`))
})

const timeout = setTimeout(() => {
  if (!settled) finish(new Error(`dev server did not start:\n${output}`))
}, 8000)
timeout.unref()

process.on('exit', () => assert.equal(settled, true, output))
