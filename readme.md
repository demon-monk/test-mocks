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
