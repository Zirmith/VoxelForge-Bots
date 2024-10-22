const fs = require('fs');

// Bot actions: evade, jump, counter-strike, retreat, etc.
const actions = ['dodge_left', 'dodge_right', 'jump', 'sprint_away', 'counter_attack'];

// Q-table to store state-action values (state-action -> reward value)
let Q = {};

// Learning parameters
const alpha = 0.1;   // Learning rate
const gamma = 0.9;   // Discount factor
const epsilon = 0.2; // Exploration rate (random actions)

// Helper function to choose random action
const getRandomAction = () => actions[Math.floor(Math.random() * actions.length)];

// Q-Learning decision function
const chooseAction = (state) => {
  if (Math.random() < epsilon) {
    return getRandomAction(); // Exploration: pick random action
  }
  if (Q[state]) {
    return Object.keys(Q[state]).reduce((a, b) => (Q[state][a] > Q[state][b] ? a : b)); // Best learned action
  } else {
    return getRandomAction(); // Default to random if no knowledge
  }
};

// Update Q-table
const updateQ = (state, action, reward, nextState) => {
  if (!Q[state]) Q[state] = {};
  if (!Q[state][action]) Q[state][action] = 0;

  const maxNextQValue = Q[nextState] ? Math.max(...Object.values(Q[nextState])) : 0;
  Q[state][action] = Q[state][action] + alpha * (reward + gamma * maxNextQValue - Q[state][action]);
};

// Function to get the bot's current state (based on health, nearby attackers, etc.)
const getState = (bot) => {
  const pos = bot.entity.position;
  const health = bot.health;
  const attacker = bot.nearestEntity((entity) => entity.type === 'mob' || entity.type === 'player' && entity.position.distanceTo(bot.entity.position) < 5);

  let attackerType = attacker ? attacker.name : 'none';
  return `health:${Math.floor(health)}_attacker:${attackerType}_distance:${attacker ? attacker.position.distanceTo(pos) : 'none'}`;
};

// Main Q-learning bot logic
module.exports = (bot) => {
  let previousState = getState(bot);
  let previousAction = chooseAction(previousState);

  const reward = {
    evade_success: 10,
    hit_received: -10,
    counter_strike: 15,
  };

  // Function to perform the chosen action
  const performAction = (action, attacker) => {
    switch (action) {
      case 'dodge_left':
        bot.setControlState('left', true);
        setTimeout(() => bot.setControlState('left', false), 500);
        bot.chat('Dodging left!');
        break;
      case 'dodge_right':
        bot.setControlState('right', true);
        setTimeout(() => bot.setControlState('right', false), 500);
        bot.chat('Dodging right!');
        break;
      case 'jump':
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        bot.chat('Jumping!');
        break;
      case 'sprint_away':
        bot.setControlState('sprint', true);
        bot.setControlState('back', true);
        setTimeout(() => {
          bot.setControlState('sprint', false);
          bot.setControlState('back', false);
        }, 1000);
        bot.chat('Sprinting away!');
        break;
      case 'counter_attack':
        if (attacker) {
          bot.attack(attacker);
          bot.chat('Counter-attacking!');
        }
        break;
    }
  };

  // On every game tick, decide what to do
  bot.on('physicTick', () => {
    const currentState = getState(bot);
    const currentAction = chooseAction(currentState);

    const attacker = bot.nearestEntity((entity) => entity.type === 'mob' || entity.type === 'player' && entity.position.distanceTo(bot.entity.position) < 5);

    // Perform chosen action based on current state
    performAction(currentAction, attacker);

    // Evaluate action's success (e.g., was bot hit or did it evade?)
    let currentReward = reward.evade_success;
    if (bot.health < bot.previousHealth) {
      currentReward = reward.hit_received;
    } else if (currentAction === 'counter_attack' && attacker) {
      currentReward = reward.counter_strike;
    }

    // Update Q-table
    updateQ(previousState, previousAction, currentReward, currentState);

    // Update state and action for the next tick
    previousState = currentState;
    previousAction = currentAction;

    bot.previousHealth = bot.health; // Track health for comparison
  });

  // When the bot is attacked, trigger evasive actions
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
      const attacker = bot.nearestEntity((e) => e.type === 'mob' || e.type === 'player');
      if (attacker) {
        const counterAction = chooseAction(getState(bot));
        performAction(counterAction, attacker);
      }
    }
  });

  // On bot spawn, initialize the bot and its health tracking
  bot.on('spawn', () => {
    bot.previousHealth = bot.health;
    bot.chat('Evasion bot loaded. I will dodge and counter-attack!');
  });

  // Save the Q-table periodically
  setInterval(() => {
    fs.writeFileSync('q-table-evade.json', JSON.stringify(Q, null, 2));
    bot.chat('Q-table saved!');
  }, 60000);
};
