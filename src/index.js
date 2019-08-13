const assert = require('assert')
const thumbwar = require('./thumbwar')
const utils = require('./utils')

function fn(impl = () => {}) {
    const mockFn = (...args) => {
        mockFn.mock.calls.push(args)
        return impl(...args)
    }
    mockFn.mock = { calls: [] }
    mockFn.mockImplementation = (newImpl) => impl = newImpl
    return mockFn
}

function spyOn(obj, prop) {
    const originVal = obj[prop]
    obj[prop] = fn()
    obj[prop].mockRestore = () => {
        obj[prop] = originVal
    }
}

spyOn(utils, 'getWinner')
utils.getWinner.mockImplementation((p1, p2) => p1)
const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')
assert.deepStrictEqual(utils.getWinner.mock.calls, [             
    ["player1", "player2"], 
    ["player1", "player2"]
])
utils.getWinner.mockRestore()