import { pickPokerAction } from '../poker/bot.js';

self.addEventListener('message', ({ data }) => {
  self.postMessage(pickPokerAction(data));
});
