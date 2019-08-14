const jest = require('./jest')
const { mock, fn, spyOn} = jest
const path = require('path')
mock(path.join(__dirname, 'utils.js'))
const assert = require('assert')
const thumbwar = require('./thumbwar')
const utils = require('./utils')

const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')
assert.deepStrictEqual(utils.getWinner.mock.calls, [             
    ["player1", "player2"], 
    ["player1", "player2"]
])
utils.getWinner.mockReset()