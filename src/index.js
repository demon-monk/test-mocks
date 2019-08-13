const assert = require('assert')
const thumbwar = require('./thumbwar')
const utils = require('./utils')

const originGetWinner = utils.getWinner
utils.getWinner = (p1, p2) => p1

const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')

utils.getWinner = originGetWinner