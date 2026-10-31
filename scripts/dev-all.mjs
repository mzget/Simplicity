import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Ensure dist directory exists for wrangler pages dev
const distDir = path.resolve(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
const indexHtml = path.resolve(distDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
  fs.writeFileSync(indexHtml, '<!DOCTYPE html><html><body>Simplicity Dev</body></html>', 'utf8');
}

const isWin = process.platform === 'win32';

console.log('\x1b[36m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m🚀 Simplicity Finance — Full-Stack Local Dev\x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m');
console.log('🌐 Frontend (Vite):          \x1b[34mhttp://localhost:5173\x1b[0m');
console.log('⚡ Backend API (Pages + D1): \x1b[35mhttp://127.0.0.1:8788\x1b[0m');
console.log('🔗 Host App (Oaktree):       \x1b[33mhttp://localhost:4321/finance\x1b[0m');
console.log('\x1b[36m====================================================\x1b[0m');
console.log('Press \x1b[1mCtrl+C\x1b[0m to stop both frontend and backend cleanly.\n');

// 1. Start Vite Frontend
const frontendCmd = 'npx vite --port 5173 --host';
const frontend = spawn(frontendCmd, {
  cwd: rootDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

// 2. Start Wrangler Backend
const backendCmd = 'npx wrangler pages dev dist --port 8788 --ip 127.0.0.1';
const backend = spawn(backendCmd, {
  cwd: rootDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

const pipeWithPrefix = (stream, prefix, colorCode) => {
  if (!stream) return;
  stream.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stdout.write(`${colorCode}${prefix}\x1b[0m ${line}\n`);
      }
    }
  });
};

pipeWithPrefix(frontend.stdout, '[frontend]', '\x1b[34m');
pipeWithPrefix(frontend.stderr, '[frontend:err]', '\x1b[31m');
pipeWithPrefix(backend.stdout, '[backend]', '\x1b[35m');
pipeWithPrefix(backend.stderr, '[backend:err]', '\x1b[33m');

// Cleanup handler
let isCleaningUp = false;
const cleanExit = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n\x1b[33mShutting down Simplicity Frontend and Backend...\x1b[0m');

  const killProc = (proc) => {
    if (!proc || !proc.pid) return;
    try {
      if (isWin) {
        spawn(`taskkill /pid ${proc.pid} /T /F`, { shell: true, stdio: 'ignore' });
      } else {
        proc.kill('SIGTERM');
      }
    } catch (_) {}
  };

  killProc(frontend);
  killProc(backend);

  setTimeout(() => {
    process.exit(0);
  }, 500);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);
