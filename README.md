# dparse
A Typescript dice notation parser and evaluator. Originally created for my Discord dice bot, Rockfall, before being separated out into its own library.

## Installation
Installation through NPM will be available soon. For now, you can build and install the library manually.

1. Clone the Github repository.
2. Run `npm pack` in the project directory to generate a tarball (`.tgz`).
3. Navigate to the project in which you want to install the library.
4. Run `npm install <path>` with the path to the generated tarball.

## Supported Syntax

- Basic math operators (add `+`, subtract `-`, multiply `*`, divide `/`, remainder `%`, exponent `^`)
- Grouping (`()`, ex. `(4d6)d6`)
- Multiple equations (comma-separated, ex. `4d6, 1d20`)
- Standard dice notation (`NdS`, ex. `4d6` = four 6-sided dice)
- [Fate dice](https://en.wikipedia.org/wiki/Fudge_(role-playing_game_system)#Fudge_dice) (roll -1, 0, or 1; `NdF`, ex. `4dF` = four Fate dice)
- Percentile dice (100 sided; `Nd%`, ex. `4d%` = four 100-sided dice)

### Dice Functions
Dice functions can be added after any dice notation and modify the results of the roll. The available dice functions are listed below.

- Exploding dice (roll an extra die for each maxed roll; `!`, ex. `4d6!`)
- Advantage (roll twice and take the higher total; `adv`, ex. `1d20adv`)
- Disadvantage (roll twice and take the lower total; `dis`, ex. `1d20dis`)
- Wild magic (random effect occurs on lowest possible roll; `wm`, ex. `1d20wm`)
- You can also chain dice functions (ex. `4d6!adv dc20`)

### Filtering Functions
There are a number of different dice functions for filtering or rerolling specifically:

- Keep highest N dice (`khN`, ex. `4d6kh3`)
- Keep lowest N dice (`klN`, ex. `4d6kl3`)
- Keep any rolls at or above a threshold (`k>N`, ex. `4d6k>3`)
- Keep any rolls at or below a threshold (`k<N`, ex. `4d6k<3`)
- Reroll highest N dice (`rhN`, ex. `4d6rh3`)
- Reroll lowest N dice (`rlN`, ex. `4d6rl3`)
- Reroll any rolls at or above a threshold once (`r>N`, ex. `4d6r>3`)
- Reroll any rolls at or below a threshold once (`r<N`, ex. `4d6r<3`)
- Reroll any rolls at or above a threshold until none are left (`r!>N`, ex. `4d6r!>3`)
- Reroll any rolls at or below a threshold until none are left (`r!<N`, ex. `4d6r!<3`)

### Special Functions
Some dice functions can be applied to any expression, not just dice. This is to allow them to take things like modifiers into account - as such, they have the lowest precedence of any operator, and will always apply to as much of the overall equation as possible. This applies to both sides if applicable (for example, `1d20+3 dc 5+5` will be read as `(1d20+3) dc (5+5)`, not `(1d20)+(3 dc 5)+5`). If you need to work with the results of these functions themselves, you can use parentheses to explicitly define grouping. 

- DC (pass/fail threshold; `dcN`, ex. `1d20+3 dc15`)
