import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 844, height: 390 }, trace: process.env.CI ? 'retain-on-failure' : 'off', screenshot: process.env.CI ? 'only-on-failure' : 'off' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { ...devices['iPhone 13'], browserName: 'webkit', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'pnpm preview', port: 4173, reuseExistingServer: !process.env.CI, timeout: 30000 },
});
