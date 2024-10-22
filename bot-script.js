module.exports = (bot) => {
  // Respond to chat commands
  bot.on('chat', (username, message) => {
    if (username === bot.username) return; // Ignore bot's own messages

    // Ping command
    if (message === 'ping') {
      bot.chat('pong!');
    }

    // Teleport command: /tp <x> <y> <z>
    if (message.startsWith('/tp')) {
      const args = message.split(' ');
      if (args.length === 4) {
        const x = parseFloat(args[1]);
        const y = parseFloat(args[2]);
        const z = parseFloat(args[3]);

        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          bot.chat(`Teleporting to (${x}, ${y}, ${z})...`);
          bot.entity.position.set(x, y, z);
        } else {
          bot.chat('Invalid coordinates. Usage: /tp <x> <y> <z>');
        }
      } else {
        bot.chat('Invalid command. Usage: /tp <x> <y> <z>');
      }
    }

    // List online players
    if (message === '/players') {
      const players = Object.keys(bot.players).join(', ');
      bot.chat(`Online players: ${players}`);
    }

    // Fun command: /dance
    if (message === '/dance') {
      bot.chat('Let’s dance! 💃');
      // You can add a small animation here, or just a fun response.
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 1000); // Stop jumping after 1 second
    }

    // Greet the bot
    if (message === 'hello') {
      bot.chat(`Hello, ${username}! How can I assist you today?`);
    }
  });

  // Log when the bot spawns
  bot.on('spawn', () => {
    console.log('Custom bot script loaded and ready.');
    bot.chat('VoxelBot is now online and ready to assist!');
  });

  // Respond when the bot disconnects
  bot.on('end', () => {
    console.log('Bot has disconnected from the server.');
  });

  // Error handling
  bot.on('error', (err) => {
    console.error('Bot encountered an error:', err);
  });
};
