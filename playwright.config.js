import { defineConfig } from 'playwright/test';

const localUrl = 'http://127.0.0.1:4174';
export default defineConfig({
  testDir: './scripts',
  workers: 1,
  use: {
    baseURL: process.env.BASE_URL || localUrl,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: localUrl,
    reuseExistingServer: !process.env.CI,
  },
});
