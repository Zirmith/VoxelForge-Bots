module.exports = (bot) => {
  bot.on('chat', (username, message) => {
    if (message === 'ping') {
      bot.chat('pong!');
    }
  });

  bot.on('spawn', () => {
    console.log('Custom bot script loaded and ready.');
  });
};
