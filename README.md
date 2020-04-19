# dparse
A Typescript dice notation parser and evaluator. Originally created for my Discord dice bot, Rockfall, before being separated out into its own library.

## Installation
Run the following command to install this library:

```
npm install dparse
```

Or build it from source with the following steps:

1. Clone the Github repository.
2. Run `npm pack` to generate a tarball.
3. Run `npm install <tarball path>` in the project you wish to install in.

## API
The core of `dparse`'s functionality comes from two functions: `parseExpr` and `parseExprList`. The former parses a given expression and returns an `Expr`, and the latter parses a given comma-separated list of expressions and returns an `Expr[]`. Once you have an `Expr`, you can call `Expr#eval()` on it to retrieve a `Result`, which contains the evaluated result of the expression. 

**Subsequent calls to `Expr#eval()` are not guaranteed to return equivalent `Result` instances.** Since dice are inherently random, any expression involving dice may return a different `Result#value`. If the expression contains dice notation, the dice will be rolled in the process of evaluation, and the resulting `DiceResults` will be included in the `Result#rolls` array. 

## Supported Syntax
`dparse` supports most basic mathematical and dice notation. It is built around a full expression parser with extensions for dice notation, and as such can handle essentially any combination of the below by simply performing mathematical operations on the results of rolls, as opposed to the strict `NdS+M` format that many dice calculators use. All syntax is case- and whitespace-insensitive.

| Math function | Syntax | Description | Example
| :--- | :---: | :--- | :---
| Addition | `+` | Adds two numbers. | `3 + 2`
| Subtraction | `-` | Subtracts two numbers. | `3 - 2`
| Multiplication | `*` or `x` | Multiplies two numbers. | `3 * 2`
| Division | `/` | Divides two numbers, rounding down. | `3 / 2`
| Remainder | `%` | Divides two numbers and returns the remainder. | `3 % 2`
| Exponentiation | `^` | Raises a number to the power of another. | `3 ^ 2`
| Grouping | `()` | Overrides the standard order of operations. | `3 * (2 + 2)`
| Equation lists | `,` | Multiple expressions in one parse. Only works with `parseExprList`, not `parseExpr`. | `2+2, 3^2`

| Dice notation | Syntax | Description | Example
| :--- | :---: | :--- | :---
| Standard dice | `NdS` | `N` basic dice with `S` sides each. | `4d6`
| [Fate dice](https://en.wikipedia.org/wiki/Fudge_(role-playing_game_system)#Fudge_dice) | `NdF` | `N` Fate dice (can be -1, 0, or 1). | `4dF`
| Percentile dice | `Nd%` | `N` percentile dice (equivalent to `Nd100`). | `4d%`

### Dice Functions
Dice functions can be added after any dice notation and modify the results of the roll. The available dice functions are listed below. You can also chain dice functions, for example `4d6!adv dc20`.

| Dice function | Syntax | Description | Example
| :--- | :---: | :--- | :---
| Exploding dice | `!` | Recursively roll an extra die for each maximum roll. | `4d6!`
| Advantage | `adv` | Roll twice and take the higher total. | `4d6adv`
| Disadvantage | `dis` | Roll twice and take the lower total. | `4d6dis`
| Wild Magic | `wm` | A [random effect](http://dnd5e.wikidot.com/sorcerer:wild-magic) occurs on the lowest possible roll. | `4d6wm`
| Keep high | `khN` | Keep the highest `N` dice. | `4d6kh3`
| Keep low | `klN` | Keep the lowest `N` dice. | `4d6kl3`
| Reroll high | `rhN` | Reroll the highest `N` dice. | `4d6rh3`
| Reroll low | `rlN` | Reroll the lowest `N` dice. | `4d6rl3`
| Reroll above | `r>N` | Reroll any dice above or at a given threshold `N` once. | `4d6r>3`
| Reroll below | `r<N` | Reroll any dice below or at a given threshold `N` once. | `4d6r<3`
| Reroll above (recursive) | `r!>N` | Reroll any dice above or at a given threshold `N` until no dice meet the threshold. | `4d6r!>3`
| Reroll below (recursive) | `r!<N` | Reroll any dice below or at a given threshold `N` until no dice meet the threshold. | `4d6r!<3`

### Special Functions
Some dice functions can be applied to any expression, not just dice. This is to allow them to take things like modifiers into account - as such, they have the lowest precedence of any operator, and will always apply to as much of the overall equation as possible. This applies to both sides if applicable (for example, `1d20+3 dc 5+5` will be read as `(1d20+3) dc (5+5)`, not `(1d20)+(3 dc 5)+5`). If you need to work with the results of these functions themselves, you can use parentheses to explicitly define grouping. 

| Dice function | Syntax | Description | Example
| :--- | :---: | :--- | :---
| Difficulty class (DC) | `dcN` | Set a pass/fail threshold for the roll. | `1d20+3 dc15`
