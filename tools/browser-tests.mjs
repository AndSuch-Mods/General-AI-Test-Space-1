import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const args = process.argv.slice(2);
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', ...args], {
  stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: resolve('.local/browsers') },
});
process.exit(result.status ?? 1);
