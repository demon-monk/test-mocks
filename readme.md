# Test Mocks
> 单元测试中有一个很重要的概念就是mock。意思是对于某些情况，测试中不会运行实际的代码，而是运行一段我们仅仅为测试准备的代码，用以提供某些特定的数据或者功能。 这段替换的代码就称为mock，也叫做test double。通过这种方式，我们可以消除测试的不确定性，包括逻辑的不确定性（比如使用了随机逻辑）和服务的不确定性（比如网络请求，可能会失败）；提高测试运行速度；将测试重心聚焦在我们自己书写的逻辑中。 测试框架（比如jest）还有一些专门的mock工具（比如sinon.js）都提供了我们在单元测试中mock所需的基本功能。在本文中，我们会以jest为例，搞明白mock工具的使用方法，然后以重写他们的方式搞清楚mock方法的基本原理。

本文中所有与代码相关标题都对应的源码链接，点击即可查看。

## [Monkey-patch](https://github.com/demon-monk/test-mocks/tree/af98d2cd5e402599cd64329af4bbb57bf15e73ac)
最简单的测试思路就是运行待测代码，将结果与预期结果相比，看是否一样。对于当前代码而言，我们要测试的模块是`thumbwar`。然而`thumbwar`给出的结果是个随机值，因此无论预期结果是什么，测试结果通过与否都是随机的。通过阅读代码发现，之所以会产生随机结果，是因为`utils.getWinner`函数引入了`Math.random`，使得结果不能确定。为了使测试结果通过，我们需要将`thumbwar`中依赖的函数`utils.getWinner`替换掉，使之产生一个确定的结果，这样才能保证测试代码必定通过或者通不过。

要实现上述目的，最简单的方法就是在测试代码运行前，动态替换`utils.getWinner`函数。然后**在测试完成后将其置回原来的值**。

```js
const originGetWinner = utils.getWinner
utils.getWinner = (p1, p2) => p1

const winner = thumbwar('player1', 'player2')
assert.strictEqual(winner, 'player1')

utils.getWinner = originGetWinner
```

这样以来，运行上述测试代码永远都会通过。这种在测试过程中手动替换某个功能模块的，使测试结果变得确定的行为通常被称为Monkey Patching.

## [Test Function Call](https://github.com/demon-monk/test-mocks/tree/c5e8fde90457249e391c4296f0219bbbac9b9838)
有时候我们不管要确定某个函数返回值是否有误，还要确定在被测代码中，某些引入库的使用方法是否正确。比如在`thumbwar.js`（line 8）中，即使我们在调用`utils.getWinner`时，只传入了一个参数`player1`，上面我们书写的测试用例依然能通过。但实现明显是错误的。因此我们需要确定代码在运行过程中，所mock的代码的调用方式必须正确。比如传入参数的个数、值、被调用的次数等。

使用jest时，有一个`jest.fn`方法。使用这个方法产生出的函数在被调用时能记录上面所提到的调用信息。在测试代码执行后，可以通过比对这些调用信息来确保被mock的方法被正确调用了。在测试用例中，可以通过如下方法获取函数调用信息
```js
test('get winner', () => {
    const originGetWinner = utils.getWinner
    utils.getWinner = jest.fn((p1, p2) => p1)
    const winner = thumbwar('player1', 'player2')
    console.log(utils.getWinner.mock)
    expect(winner).toBe('player1')
    expect(utils.getWinner).toHaveBeenCalledTimes(2)
    expect(utils.getWinner).toHaveBeenCalledWith('player1', 'player2')
    expect(utils.getWinner).toHaveBeenNthCalledWith(1, 'player1', 'player2')
    expect(utils.getWinner).toHaveBeenNthCalledWith(2, 'player1', 'player2')
    utils.getWinner = originGetWinner
})
```

注意在上述测试用例中我们打印了`utils.getWinner.mock`的值，其结果如下。
```js
{
  calls: [["player1", "player2"], ["player1", "player2"]],
  instances: [{ getWinner: [Function] }, { getWinner: [Function] }],
  invocationCallOrder: [1, 2],
  results: [
    { type: "return", value: "player1" },
    { type: "return", value: "player1" }
  ]
}
```
通过观察可以发现，调用信息正是存储在返回函数的`mock`属性中。所以我们上述测试用例可以简写为
```js
// code before
expect(utils.getWinner.mock.calls).toEqual([             ["player1", "player2"], 
    ["player1", "player2"]
])
// code after
```

### [implement `jest.fn`](https://github.com/demon-monk/test-mocks/tree/28a628a3eabd6b64407775e71c5e3823920bdd6f)
通过上面描述我们知道了jest中记录调用信息的原理，因此我们可以实现自己的`fn`。方式很简单，就是使fn返回的函数中添加一个mock属性，里面存放`calls`信息，并在每次被调用的时候讲调用的参数放进去。
```js
function fn(impl) {
    const mockFn = (...args) => {
        mockFn.mock.calls.push(args)
        return impl(...args)
    }
    mockFn.mock = { calls: [] }
    return mockFn
}
// code before
utils.getWinner = fn((p1, p2) => p1)
thumbwar('player1', 'player2')
assert.deepStrictEqual(utils.getWinner.mock.calls, [     ["player1", "player2"], 
    ["player1", "player2"]
])
//code after
```

## [`jest.spyOn`](https://github.com/demon-monk/test-mocks/tree/28724e085ada1e8c4dcee1d982bc29d1f31febd5)
在前面的测试用例中，我们必须要在测试前保存mock函数的原始实现，并在测试结束后手动恢复。这非常不方便，并且容易忘记。jest提供了`spyOn`方法。被'spy'过的函数可以通过`mockRestore`方法进行恢复，而不需要你声明一个变量去保存恢复。被'spy'的函数通过`mockImplementation`方法来mock任意的函数。
```js
jest.spyOn(utils, 'getWinner')
utils.getWinner.mockImplementation((p1, p2) => p1) // 这里用于替代utils.getWinner = jest.fn((p1, p2) => p1)
// testing...
utils.getWinner.mockrestore()
```

### [implement `spyOn`](https://github.com/demon-monk/test-mocks/tree/16535141177da4e6441dfc02029ce2aae6bbb481)

```js
function spyOn(obj, prop) {
    const originVal = obj[prop]
    obj[prop] = fn()
    obj[prop].mockRestore = () => {
        obj[prop] = originVal
    }
}
```
- `spyOn`需要在内部声明一个变量用于保存原始值；
- 被'spy'的函数需要能够保存调用信息，因此我们使用之前实现的`fn`函数来生成；
- 需要增加`mockRestore`方法，即将函数恢复成原来的值。

对于之前实现的`fn`函数也要做一定修改：
1. `fn`支持默认参数，默认为一个空函数
2. 所有`fn`生成函数应该有一个`mockImplementation`方法，用于给函数赋值一个新的mock实现

```js
function fn(impl = () => {}) {
    // ... previous code
    mockFn.mockImplementation = newImpl => impl = newImpl
    return mockFn
}
```

## So far. What's the problems
到目前为止，我们采用的方法本质上还是采用Monkey Patching。 区别仅在于我们使用了jest为我们提供的API。这种方法仅在CommonJS下才能使用。在ESModule中，模块的引入并不是动态的，所以Monkey Patching的方式将不能使用。

## [`jest.mock`](https://github.com/demon-monk/test-mocks/tree/0b4f32833bd30c6a6b4940b86cb5d1c2bfdce0c8)
`jest.mock`可以用来mock整个模块。在测试环境下，jest会控制模块系统，因此可以在ESModule中使用。用法如下
```js
jest.mock('../utils', () => ({
    getWinner: jest.fn((p1, p2) => p1)
}))
test('', () => {
    // testing without spyOn
    utils.getWinner.mockRest()
})
```

### [implement `jest.mock`](https://github.com/demon-monk/test-mocks/tree/f02e8348c60dd782887f558bfeb60226e524b83e)
首先我们来实现`mock`函数
```js
function mock(path, mockModuleFn) {
    const mockPath = require.resolve(path)
    const mockModule = mockModuleFn()
    Object.keys(mockModule).forEach(key => {
        mockModule[key].mockRest = () => {
            delete require.cache[mockPath]
        }
    })
    require.cache[mockPath] = {
        id: mockPath,
        filename: mockPath,
        loaded: true,
        exports: mockModule
    }
}
```

`mock`函数应该在`require`对应的模块之前执行。因为只有这样，在`require`时才能命中我们已经写好的cache。
```js
mock('./utils', () => ({ getWinner: fn(p1, p1) => p1 }))
// before require('./utils')
const winner = require('./utils')
// testing...
utils.getWinner.mockReset()
console.log(require('./utils')) // 真正的utilsmodule，不受mock影响
```
在jest测试用例中，我们并没有把mock操作放在require操作之前。这是因为jest runner在运行时会帮我们做这一步骤。

## [external mock](https://github.com/demon-monk/test-mocks/tree/35e7e0f967589e69ac8f4e041b78cfa91a662cf4)
对于同一个模块来说，通常不同的测试需要的是想通的mock实现。如果不希望在每个测试用例里面都写一遍mock实现，可以通过在被测模块同级目录下创建一个`__mocks__`目录，然后再其中创建相同名字的文件，在文件中直接导出要mock的内容。

在当前代码中即是创建`src/__mocks__/utils.js`，然后再其中写入：
```js
module.exports = {
    getWinner: jest.fn((p1, p2) => p1)
}
```
然后再测试用力中，直接使用
```js
jest.mock('../utils')
```
即可。

### [implement external mock](https://github.com/demon-monk/test-mocks/tree/8873d661dd373732e727d5e38b6c3b28d4245a77)
首先我们要创建一个`__mocks_self__`文件夹，其功能与jest中`__mocks__`文件夹一样，存放对同级模块的mock数据。

首先为`mock`函数增加一个分支，用来实现未传入mock实现的逻辑。其中我们将`mock`函数中传入的路径取出，找出其对应的mock数据路径（即刚才定义的`__mocks_self__`目录下的同名文件）。然后再`require.cache`中存入mock数据。这样在mock后，在require这个目录拿到的就是mock数据了。

具体实现方式可以参考具体代码。