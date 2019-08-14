const pathUtils = require('path')
mock('./utils')
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

function mock(path, mockModuleFn) {
    const utilsPath = require.resolve(path)
    if (mockModuleFn) {
        const mockModule = mockModuleFn()
        Object.keys(mockModule).forEach(key => {
            mockModule[key].mockReset = () => {
                delete require.cache[utilsPath]
            }
        })
        require.cache[utilsPath] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: mockModule
        }
    } else {
        const utilsPathArr = utilsPath.split('/')
        const targetPath = utilsPathArr.slice(0, utilsPathArr.length - 1).join('/')
        const targetFilename = utilsPathArr.slice(utilsPathArr.length - 1).join('/')
        const targetMockFile = pathUtils.join(targetPath, '__mocks_self__', targetFilename)
        const targetModule = require(targetMockFile)
        Object.keys(targetModule).forEach(key => {
            targetModule[key].mockReset = () => {
                delete require.cache[utilsPath]
            }
        })
        require.cache[utilsPath] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: targetModule
        }
    }
}

// spyOn(utils, 'getWinner')
// utils.getWinner.mockImplementation((p1, p2) => p1)
const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')
assert.deepStrictEqual(utils.getWinner.mock.calls, [             
    ["player1", "player2"], 
    ["player1", "player2"]
])
utils.getWinner.mockReset()