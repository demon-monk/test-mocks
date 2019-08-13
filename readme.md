# Test Mocks

## Monkey-patch
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

## Test Function Call
有时候我们不管要确定某个函数返回值是否有误，还要确定在被测代码中，某些以来库的使用方法是否正确。比如在`thumbwar.js`（line 8）中，即使我们在调用`utils.getWinner`时，只传入了一个参数`player1`，上面我们书写的测试用例依然能通过。但实现明显是错误的。因此我们需要确定代码在运行过程中，所mock的代码的调用方式必须正确。比如传入参数的个数、值、被调用的次数等。

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

### implement `jest.fn`
通过上面描述我们知道了jest中记录调用信息的原理，因此我们可以实现自己的`fn`。
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