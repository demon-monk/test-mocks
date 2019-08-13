const assert = require('assert')
const thumbwar = require('./thumbwar')
const utils = require('./utils')

const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')
