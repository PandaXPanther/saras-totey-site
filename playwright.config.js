export default {
  use: {
    launchOptions: {
      executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
      args: ['--disable-gpu', '--disable-software-rasterizer', '--no-sandbox'],
    },
  },
};
