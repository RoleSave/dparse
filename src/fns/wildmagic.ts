import { registerOp, DiceResult, Result } from "../core/expressions";
import { parseExpr } from "../core/parse";
import { randInt } from "../util/functions";

registerOp({
  name: 'wild_magic',
  type: 'postop',
  text: 'wm',
  prec: 3,
  display: ' wm',
  requireType: 'dice',
  eval: (op, _l) => {
    let l = _l as DiceResult
    if(l.value > l.rolls.length * (typeof l.minRoll !== 'undefined' ? l.minRoll : 1))
      return l

    let effect = wildMagicEffects[randInt(wildMagicEffects.length)],
        effectRolls: Result[] = []
    while(effect.indexOf('{') > -1) {
      let open = effect.indexOf('{'), close = effect.indexOf('}'),
          dieNot = effect.slice(open+1, close),
          dieRes = parseExpr(dieNot).eval()
      effect = effect.slice(0,open)+dieNot+effect.slice(close+1)
      effectRolls.push(dieRes)
    }

    return {
      ...l,
      statuses: [
        ...l.statuses||[],
        { fromOp: op.def.name,
          text: effect,
          results: effectRolls }
      ]
    }
  }
})

export const wildMagicEffects = [
  "Roll on this table at the start of each of your turns for the next minute, ignoring this result on subsequent rolls.",
  "A spectral shield hovers near you for the next minute, granting you a +2 bonus to AC and immunity to Magic Missile.",
  "For the next minute, you can see any invisible creature if you have line of sight to it.",
  "You are immune to being intoxicated by alcohol for the next {5d6} days.",
  "A modron chosen and controlled by the DM appears in an unoccupied space within 5 feet of you, then disappears 1 minute later.",
  "Your hair falls out but grows back within 24 hours.",
  "You cast Fireball as a 3rd-level spell centered on yourself.",
  "For the next minute, any flammable object you touch that isn't being worn or carried by another creature bursts into flame.",
  "You cast Magic Missile as a 5th-level spell.",
  "You regain your lowest-level expended spell slot.",
  "Roll {1d10}. Your height changes by a number of inches equal to the roll. If the roll is odd, you shrink. If the roll is even, you grow.",
  "For the next minute, you must shout when you speak.",
  "You cast Confusion centered on yourself.",
  "You cast Fog Cloud centered on yourself.",
  "For the next minute, you regain 5 hit points at the start of each of your turns.",
  "Up to three creatures you choose within 30 feet of you take {4d10} lightning damage.",
  "You grow a long beard made of feathers that remains until you sneeze, at which point the feathers explode out from your face.",
  "You are frightened by the nearest creature until the end of your next turn.",
  "You cast Grease centered on yourself.",
  "Each creature within 30 feet of you becomes invisible for the next minute. The invisibility ends on a creature when it attacks or casts a spell.",
  "Creatures have disadvantage on saving throws against the next spell you cast in the next minute that involves a saving throw.",
  "You gain resistance to all damage for the next minute.",
  "Your skin turns a vibrant shade of blue. A Remove Curse spell can end this effect.",
  "A random creature within 60 feet of you becomes poisoned for {1d4} hours.",
  "An eye appears on your forehead for the next minute. During that time, you have advantage on Wisdom (Perception) checks that rely on sight.",
  "You glow with bright light in a 30-foot radius for the next minute. Any creature that ends its turn within 5 feet of you is blinded until the end of its next turn.",
  "For the next minute, all your spells with a casting time of 1 action have a casting time of 1 bonus action.",
  "You cast Polymorph on yourself. If you fail the saving throw, you turn into a sheep for the spell's duration.",
  "You teleport up to 60 feet to an unoccupied space of your choice that you can see.",
  "Illusory butterflies and flower petals flutter in the air within 10 feet of you for the next minute.",
  "You are transported to the Astral Plane until the end of your next turn, after which time you return to the space you previously occupied or the nearest unoccupied space if that space is occupied.",
  "You can take one additional action immediately.",
  "Maximize the damage of the next damaging spell you cast within the next minute.",
  "Each creature within 30 feet of you takes 1d10 necrotic damage. You regain hit points equal to the sum of the necrotic damage dealt.",
  "Roll {1d10}. Your age changes by a number of years equal to the roll. If the roll is odd, you get younger (minimum 1 year old). If the roll is even, you get older.",
  "You cast Mirror Image.",
  "1d6 flumphs controlled by the DM appear in unoccupied spaces within 60 feet of you and are frightened of you. They vanish after 1 minute.",
  "You cast Fly on a random creature within 60 feet of you.",
  "You regain {2d10} hit points.",
  "You become invisible for the next minute. During that time, other creatures can't hear you. The invisibility ends if you attack or cast a spell.",
  "You turn into a potted plant until the start of your next turn. While a plant, you are incapacitated and have vulnerability to all damage. If you drop to 0 hit points, your pot breaks, and your form reverts.",
  "If you die within the next minute, you immediately come back to life as if by the Reincarnate spell.",
  "For the next minute, you can teleport up to 20 feet as a bonus action on each of your turns.",
  "Your size increases by one size category for the next minute.",
  "You cast Levitate on yourself.",
  "You and all creatures within 30 feet of you gain vulnerability to piercing damage for the next minute.",
  "A unicorn controlled by the DM appears in a space within 5 feet of you, then disappears 1 minute later.",
  "You are surrounded by faint, ethereal music for the next minute.",
  "You can't speak for the next minute. Whenever you try, pink bubbles float out of your mouth.",
  "You regain all expended sorcery points."
]
