const fs = require('fs');
const { Vec3 } = require('vec3');

// The bot actions it can take, including movement and interaction with entities
const actions = ['move_towards_player', 'jump', 'collect_item', 'attack_mob', 'mine_block'];

// Q-table to store state-action values (state-action -> reward value)
let Q = {};

// Learning parameters
const alpha = 0.1;   // Learning rate
const gamma = 0.9;   // Discount factor
const epsilon = 0.2; // Exploration rate (chance to take random actions)

// Helper function to pick a random action
const getRandomAction = () => actions[Math.floor(Math.random() * actions.length)];

// Q-Learning decision function
const chooseAction = (state) => {
  if (Math.random() < epsilon) {
    return getRandomAction(); // Exploration
  }

  if (Q[state]) {
    // Choose the best learned action for this state
    return Object.keys(Q[state]).reduce((a, b) => (Q[state][a] > Q[state][b] ? a : b));
  } else {
    return getRandomAction(); // Default to random action if no knowledge
  }
};

// Function to update the Q-table
const updateQ = (state, action, reward, nextState) => {
  if (!Q[state]) Q[state] = {};
  if (!Q[state][action]) Q[state][action] = 0;

  const maxNextQValue = Q[nextState] ? Math.max(...Object.values(Q[nextState])) : 0;
  Q[state][action] = Q[state][action] + alpha * (reward + gamma * maxNextQValue - Q[state][action]);
};

// Function to get the bot's current state based on what it sees
const getState = (bot) => {
  const pos = bot.entity.position;
  const health = bot.health;
  
  // Simplified state representation: health, position, nearby entities
  let nearbyEntities = bot.nearestEntity();
  let entityType = nearbyEntities ? nearbyEntities.name : 'none';
  
  return `health:${Math.floor(health)}_pos:${Math.floor(pos.x)}:${Math.floor(pos.z)}_entity:${entityType}`;
};

// Main function
module.exports = (bot) => {
  let previousState = getState(bot);
  let previousAction = chooseAction(previousState);

  const reward = {
    success: 10,   // Reward for successful action
    failure: -10,  // Penalty for failure
  };

  // "Vision": What the bot sees and detects nearby
  const detectEnvironment = () => {
    const nearbyEntity = bot.nearestEntity();
    if (nearbyEntity) {
      bot.chat(`I see a ${nearbyEntity.name} nearby!`);
      return nearbyEntity;
    }
    return null;
  };

  // Improved movement: Move towards a target player or entity
  const moveTowardsEntity = (entity) => {
    if (entity) {
      const position = entity.position;
      bot.navigate.to(position);  // Navigate to the entity
      bot.chat(`Moving towards ${entity.name}`);
    } else {
      bot.setControlState('forward', true); // Move randomly if no entity
    }
  };

  // Simulate learning on every tick
  bot.on('physicTick', () => {
    const currentState = getState(bot);
    const currentAction = chooseAction(currentState);

    // Detect surroundings and take an action based on the current state
    const nearbyEntity = detectEnvironment();
    
    // Execute actions
    if (currentAction === 'move_towards_player' && nearbyEntity) {
      moveTowardsEntity(nearbyEntity);
    } else if (currentAction === 'jump') {
      bot.setControlState('jump', true);
    } else if (currentAction === 'collect_item') {
      // Logic to collect nearby items (if any)
      bot.chat('Searching for items...');
    } else if (currentAction === 'attack_mob' && nearbyEntity) {
      bot.attack(nearbyEntity);
    } else if (currentAction === 'mine_block') {
      // Logic to mine blocks around (example)
      const targetBlock = bot.blockAt(new Vec3(Math.floor(bot.entity.position.x) + 1, bot.entity.position.y - 1, Math.floor(bot.entity.position.z)));
      if (targetBlock && bot.canDigBlock(targetBlock)) {
        bot.dig(targetBlock);
        bot.chat('Mining a block...');
      }
    }

    // Dummy success check (replace with actual logic based on actions)
    const isSuccess = Math.random() > 0.5;
    const currentReward = isSuccess ? reward.success : reward.failure;

    // Update the Q-table based on action's outcome
    updateQ(previousState, previousAction, currentReward, currentState);

    // Save the current state and action for the next iteration
    previousState = currentState;
    previousAction = currentAction;

    // Reset control states after actions
    setTimeout(() => {
      bot.setControlState('forward', false);
      bot.setControlState('jump', false);
    }, 1000);
  });

  // Handle bot spawn
  bot.on('spawn', () => {
    bot.chat('Q-Learning bot has spawned and is ready to learn with vision!');
  });

  // Save Q-table periodically
  setInterval(() => {
    fs.writeFileSync('q-table.json', JSON.stringify(Q, null, 2));
    bot.chat('Q-table saved to disk.');
  }, 60000); // Save every minute
};
