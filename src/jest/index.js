const pathUtils = require('path')

exports.fn = function fn(impl = () => {}) {
    const mockFn = (...args) => {
        mockFn.mock.calls.push(args)
        return impl(...args)
    }
    mockFn.mock = { calls: [] }
    mockFn.mockImplementation = (newImpl) => impl = newImpl
    return mockFn
}

exports.spyOn = function spyOn(obj, prop) {
    const originVal = obj[prop]
    obj[prop] = fn()
    obj[prop].mockRestore = () => {
        obj[prop] = originVal
    }
}

exports.mock = function mock(path, mockModuleFn) {
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