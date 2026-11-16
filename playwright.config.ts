import { defineConfig } from '@playwright/test';

// Locally the tests can use an installed browser: PW_CHANNEL=chrome (or msedge) npm run test:e2e
// In CI, `npx playwright install chromium` provides the bundled browser.
const channel = process.env.PW_CHANNEL || undefined;
const sizes = { phone: { width: 360, height: 780 }, 'tablet-portrait': { width: 768, height: 1024 }, 'tablet-landscape': { width: 1024, height: 768 }, desktop: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173/', locale: 'he-IL', channel, hasTouch: true },
  projects: Object.entries(sizes).map(([name, viewport]) => ({ name, use: { viewport } })),
  webServer: { command: 'npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
