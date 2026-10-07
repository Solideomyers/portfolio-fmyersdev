import { defineConfig, devices } from '@playwright/test';

// The Vercel adapter disables `astro preview` once a server route exists, so tests serve the
// static output directly (/api/contact is exercised by unit tests and mocked in e2e).
// Own port, never reused: a dev server or another worktree on 4321 must not be tested by mistake.
const PORT = 4329;

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && node scripts/serve-static.mjs .vercel/output/static ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
