const thumbwar = require('../thumbwar')
const utils = require('../utils')

jest.mock('../utils.js')

test('get winner', () => {
    const winner = thumbwar('player1', 'player2')
    console.log(utils.getWinner.mock)
    expect(winner).toBe('player1')
    // expect(utils.getWinner).toHaveBeenCalledTimes(2)
    // expect(utils.getWinner).toHaveBeenCalledWith('player1', 'player2')
    // expect(utils.getWinner).toHaveBeenNthCalledWith(1, 'player1', 'player2')
    // expect(utils.getWinner).toHaveBeenNthCalledWith(2, 'player1', 'player2')
    expect(utils.getWinner.mock.calls).toEqual([             
        ["player1", "player2"], 
        ["player1", "player2"]
    ])
    utils.getWinner.mockReset()
})