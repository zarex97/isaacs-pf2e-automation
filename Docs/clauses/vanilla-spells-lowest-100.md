# Clauses — vanilla spells, the 100 lowest matches

*Spell tracker, clausified. The hundred pf2e spells the precedent lookup matched worst, after the low- and
mid-match tests: none automated yet, none automated by another module, each best precedent sharing one pattern
or none (`npm run precedent`). Ordered from the weakest match up. Tracked in issue #98.*

**Source:** pf2e 8.4.1's own spell text, as the sheet prints it (`npm run index:pf2e` writes it to
`build/data/pf2e-spell-text.json`).

## How a row is marked

| Mark | Meaning |
| :-- | :-- |
| ☐ | Not yet driven |
| ✅ | Driven live; the clause happened by itself |
| ⚠️ | Driven live; partially happens — the gap is named in **Evidence** |
| ❌ | Driven live; does not happen |
| 🔧 | Was ❌ or ⚠️, a fix has landed, awaiting re-drive |
| — | Nothing to automate (pure roleplaying / GM ruling) |

**Clause** is a verbatim fragment of the spell's text; `npm test` asserts it still is one. **Patterns** tags the
clause from `Docs/patterns.md`. **Must happen** is what the drive has to see. **Static check** names what guards
it offline; **Evidence** names what proved it in world `pf`. Clause IDs are the spell's ID and a letter.

## The spells

**Shares** is how many patterns the spell's best precedent shares with it.

| ID | Spell | Rank | Shares | Gist |
| :-- | :-- | :-- | :-- | :-- |
| VS-132 | `countless-eyes` | 4 | 0 | A touched creature can't be flanked; Seek successes crit |
| VS-133 | `create-earthen-facsimile` | cantrip | 0 | A crude soil figurine that crumbles after 10 minutes |
| VS-134 | `mindlink` | 1 | 0 | Ten minutes of information passed in an instant |
| VS-135 | `peaceful-rest` | 2 | 0 | A corpse kept from decay and undeath |
| VS-136 | `speak-with-animals` | 2 | 0 | Talk with animals and use Diplomacy on them |
| VS-137 | `telepathic-bond` | 5 | 0 | The caster and four others linked telepathically |
| VS-138 | `ventriloquism` | 1 | 0 | The caster's voice thrown up to 60 feet away |
| VS-139 | `animal-vision` | 3 | 1 | Sense through an animal's senses; Sustain to switch |
| VS-140 | `blind-eye` | 5 | 1 | An object warded against use for scrying |
| VS-141 | `secret-page` | 3 | 1 | A page's text disguised, with an optional password |
| VS-142 | `sending` | 5 | 1 | A 25-word message and reply, planet-wide |
| VS-143 | `casters-imposition` | 3 | 1 | On a failed Will save, no rituals or coven spells |
| VS-144 | `deep-breath` | cantrip | 1 | Breath held for the duration; speaking spends it |
| VS-145 | `environmental-endurance` | 2 | 1 | Protection from severe cold or heat, more by rank |
| VS-146 | `impart-empathy` | 2 | 1 | An animal open to Diplomacy: Impressions and Requests |
| VS-147 | `quick-sort` | 1 | 1 | Up to 200 light objects sorted into piles |
| VS-148 | `spontaneous-cartography` | 3 | 1 | A crude map of the land within a mile |
| VS-149 | `water-breathing` | 2 | 1 | Up to five creatures breathe underwater |
| VS-150 | `fates-travels` | 3 | 1 | A vision of a corpse's last travels |
| VS-151 | `stonesense` | 4 | 1 | Imprecise tremorsense 100 feet, through natural stone |
| VS-152 | `shape-stone` | 4 | 1 | Stone reshaped; creatures atop it may fall prone |
| VS-153 | `shape-wood` | 2 | 1 | A piece of unworked wood reshaped |
| VS-154 | `hypercognition` | 3 | 1 | Up to six Recall Knowledge actions in one cast |
| VS-155 | `umbral-journey` | 5 | 1 | Overland travel at three days' ground an hour |
| VS-156 | `read-omens` | 4 | 1 | A cryptic clue about an event within a week |
| VS-157 | `enhance-victuals` | 2 | 1 | Food or drink made fine; poisons in it counteracted |
| VS-158 | `glamorize` | cantrip | 1 | A cosmetic flourish; a +1 status bonus at the GM's call |
| VS-159 | `spell-immunity` | 4 | 1 | A named spell counteracted whenever it reaches the target |
| VS-160 | `web-of-influence` | 4 | 1 | Distance and direction to a magically connected creature |
| VS-161 | `detect-poison` | 1 | 1 | Whether a creature or object is poisonous or poisoned |
| VS-162 | `draw-moisture` | cantrip | 1 | Water drawn out of an object to dry it |
| VS-163 | `pack-attack` | 2 | 1 | Caster and an ally flank any enemy both are adjacent to |
| VS-164 | `enhance-senses` | 4 | 1 | Low-light vision or darkvision; imprecise senses doubled |
| VS-165 | `mud-pit` | 1 | 1 | A 15-ft burst of mud, difficult terrain for 1 minute |
| VS-166 | `shillelagh` | 1 | 1 | A held club or staff made +1 striking; three dice vs some |
| VS-167 | `bracing-tendrils` | 3 | 1 | Forced moves on the caster resisted at its spell DC |
| VS-168 | `telekinetic-haul` | 5 | 1 | An unattended object moved 20 feet, again on Sustain |
| VS-169 | `liberating-command` | 1 | 1 | A held ally may Escape at once as a reaction |
| VS-170 | `restyle` | 1 | 1 | A worn garment's look changed for good |
| VS-171 | `far-sight` | 3 | 1 | Distant sights seen as if near, for detail only |
| VS-172 | `invent-code` | 3 | 1 | A private language shared by the targets for 8 hours |
| VS-173 | `liminal-doorway` | 4 | 1 | A chalk door into a 20-ft extradimensional room |
| VS-174 | `sky-sight` | 1 | 1 | The sky seen through weather and obstructions |
| VS-175 | `blessing-of-vigor` | 1 | 1 | Fast healing 3 for 3 rounds, more by rank |
| VS-176 | `ghostly-weapon` | 3 | 1 | A weapon given ghost touch for 5 minutes |
| VS-177 | `air-bubble` | 1 | 1 | A reaction: air to breathe until the air is good again |
| VS-178 | `creation` | 4 | 1 | A temporary earthen or plant object; metal at rank 5 |
| VS-179 | `kings-castle` | 5 | 1 | The caster and a willing creature swap places |
| VS-180 | `rope-trick` | 4 | 1 | A rope up to a hidden extradimensional room for eight |
| VS-181 | `spiritual-renewal` | 4 | 1 | Fast healing 8 for 4 rounds, more by rank |
| VS-182 | `temporary-tool` | 1 | 1 | A simple tool in hand, gone after one use or a minute |
| VS-183 | `familiars-call` | 3 | 1 | The familiar teleported to the caster; farther by rank |
| VS-184 | `fires-pathway` | 5 | 1 | From one large fire to another, farther by rank |
| VS-185 | `natures-pathway` | 5 | 1 | From one large tree to another, farther by rank |
| VS-186 | `tremorsense` | 2 | 1 | Imprecise tremorsense 30 feet, longer by rank |
| VS-187 | `disguise-magic` | 1 | 1 | An item's or spell's aura hidden or misreported |
| VS-188 | `dome-of-tranquility` | 1 | 1 | A soundproof dome, dispersed by anything over 1 Bulk |
| VS-189 | `glowing-trail` | cantrip | 1 | A glowing path behind the caster that fades later |
| VS-190 | `message-rune` | 1 | 1 | A rune that plays a recorded message on a trigger |
| VS-191 | `reflected-beauty` | 4 | 1 | The caster disguised as a willing creature's desire |
| VS-192 | `shift-perspective` | 2 | 1 | Vision from a thrown object, switched by Sustain |
| VS-193 | `instant-parade` | 3 | 1 | An illusory crowd around the caster to Hide in |
| VS-194 | `acid-storm` | 5 | 1 | A lingering acid burst, basic Reflex at turn start |
| VS-195 | `approximate` | cantrip | 1 | A rounded count of a named kind of object |
| VS-196 | `breathe-fire` | 1 | 1 | A 15-ft cone of fire, a basic Reflex save |
| VS-197 | `cleanse-cuisine` | 1 | 1 | Food made fine, and cleaned of toxins by choice |
| VS-198 | `control-water` | 5 | 1 | Water raised or lowered; water creatures slowed |
| VS-199 | `dreaming-potential` | 5 | 1 | A night's sleep that counts as a day of retraining |
| VS-200 | `know-the-way` | cantrip | 1 | North, and the way back to a recent place |
| VS-201 | `magic-stone` | 1 | 1 | Stones made +1 striking disrupting sling bullets |
| VS-202 | `ritual-obstruction` | 5 | 1 | A 60-ft burst where no ritual can succeed |
| VS-203 | `timely-reminder` | 2 | 1 | An 8-word message delivered at a chosen time |
| VS-204 | `blazing-fissure` | 5 | 1 | A 120-ft line of magma; Reflex, prone on a failure |
| VS-205 | `circle-of-protection` | 3 | 1 | A ward around a touched creature against one alignment |
| VS-206 | `frozen-lungs` | 2 | 1 | Cold damage, then more for each auditory act or cast |
| VS-207 | `sigil` | cantrip | 1 | A mark on a creature or object, lasting longer by rank |
| VS-208 | `bind-undead` | 3 | 1 | A mindless undead made the caster's minion for a day |
| VS-209 | `blood-duplicate` | 2 | 1 | A blood copy of an object, for 1 HP, near the caster |
| VS-210 | `cradle-aloft` | 1 | 1 | A held object floats by the caster, snatchable by others |
| VS-211 | `detect-creator` | 4 | 1 | The direction to a destroyed undead's creator |
| VS-212 | `draw-ire` | 1 | 1 | Mental damage and a penalty to attack anyone else |
| VS-213 | `fated-healing` | 1 | 1 | Two foes heal each turn until one turns on the other |
| VS-214 | `friendfetch` | 1 | 1 | One or two willing creatures pulled to the caster |
| VS-215 | `guiding-star` | 2 | 1 | A creature nudged toward the casting spot by the stars |
| VS-216 | `secret-chest` | 5 | 1 | A container stashed in the Ethereal, recalled by Dismiss |
| VS-217 | `cozy-cabin` | 3 | 1 | A wooden cabin for 12 hours, ended if the caster leaves |
| VS-218 | `extract-poison` | 2 | 1 | A poison counteracted off an object onto a held weapon |
| VS-219 | `fishing-spot` | 1 | 1 | Fish a random d8 meal that grants a skill bonus |
| VS-220 | `glimpse-weakness` | cantrip | 1 | The first ally's hit on the target adds precision damage |
| VS-221 | `metal-merged` | 1 | 1 | The caster's weapon can't be dropped, and is hard to disarm |
| VS-222 | `threefold-aspect` | 3 | 1 | Change between three ages, with Deception to pass |
| VS-223 | `phantom-crowd` | 2 | 1 | An illusory crowd, difficult terrain to believers |
| VS-224 | `air-walk` | 4 | 1 | Walk on air, rising at up to 45 degrees |
| VS-225 | `allfood` | 2 | 1 | An object made edible for a day, more Bulk by rank |
| VS-226 | `animal-messenger` | 2 | 1 | A Tiny animal carries a note to a known place |
| VS-227 | `anticipate-peril` | 1 | 1 | A status bonus to the target's next initiative |
| VS-228 | `artistic-recollection` | cantrip | 1 | A painted image of something the caster has seen |
| VS-229 | `augury` | 2 | 1 | A secret flat check, then the GM's guess at an outcome |
| VS-230 | `breadcrumbs` | 1 | 1 | A glittering trail behind a willing creature |
| VS-231 | `claim-curse` | 3 | 1 | A target's curse carried by the caster for 5 minutes |

**Where it stands:** 407 clauses — 95 ✅, 20 —, 292 ☐. Batch 1 was the seventeen spells whose clauses proposed new patterns; batch 2 the next ten in the list.

### VS-132 · Countless Eyes

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-132a | "The subject can't be flanked for the spell's duration" | when:cast · reach:single · effect:flank-immune · ending:duration | The target is never off-guard from flanking for the minute | `countless-eyes.json` | ✅ | D1, flanked by ZZ Ally: off-guard, DC 31. With the effect: not off-guard, DC 33. pf2e's own *Spell Effect: Countless Eyes* left it off-guard, so the entry sets `flankable` false itself | D1, flanked by ZZ Ally: off-guard, DC 31. With the effect: not off-guard, DC 33. pf2e's own *Spell Effect: Countless Eyes* left it off-guard, so the entry sets `flankable` false itself |
| VS-132b | "when the subject succeeds when Seeking, it critically succeeds instead" | when:check-rolled · check:degree-shift | The target's successful Seek becomes a critical success | `countless-eyes.json` | ✅ | D1's Seek, 20 against DC 20: a success before, a critical success with the effect. pf2e's own effect spells its adjustment `adjusment` and changed nothing | D1's Seek, 20 against DC 20: a success before, a critical success with the effect. pf2e's own effect spells its adjustment `adjusment` and changed nothing |

### VS-133 · Create Earthen Facsimile

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-133a | "The soil transforms and hardens into a simple form of your choosing" | when:cast · check:caster-choice · effect:item-conjured | A note: the figurine's form is the table's | `create-earthen-facsimile.json` | ✅ | Asked the form at the cast, "A small clay horse": an item of that name in the caster's inventory, worth nothing |
| VS-133b | "the figurine is brittle and will crumble under pressure or turn back to mush at the end of the spell's duration" | effect:item-conjured · ending:spent · ending:duration | A note: the figurine crumbles under pressure or after 10 minutes | `create-earthen-facsimile.json` | ✅ | Its holder's own action crushed it, item and all; left alone, 10 minutes on it was gone |

### VS-134 · Mindlink

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-134a | "You link your mind to the target's mind and mentally impart to that target an amount of information in an instant that could otherwise be communicated in 10 minutes" | when:cast · reach:single · effect:message | A note: the information passed is the table's | `mindlink.json` | ✅ | The words written at the cast were whispered to the patient's players and the GM, as from the caster's mind |

### VS-135 · Peaceful Rest

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-135a | "The targeted corpse doesn't decay, nor can it be transformed into an undead" | when:cast · reach:filtered · ending:preparations | A note: the corpse is preserved until the next daily preparations | `peaceful-rest.json` | ✅ | A corpse at 0 Hit Points carries `peaceful rest` until the caster's daily preparations. Control: a living patient, the cast refused |
| VS-135b | "do not count the duration of peaceful rest against that time" | effect:gm-note | A note: the preserved time doesn't count toward Raise Dead's limit | `peaceful-rest.json` | — | No time limit after death is kept anywhere to pause |
| VS-135c | "This spell also prevents ordinary bugs and pests (such as maggots) from consuming the body" | effect:gm-note | A note: pests can't consume the body is the table's | `peaceful-rest.json` | — | Pests are the table's |
| VS-135d | "Heightened (5th) The spell's duration is unlimited" | scaling:from-rank · ending:permanent | From rank 5 the preservation has no end | `peaceful-rest.json` | ✅ | Rank 5: unlimited, not ended by preparations |
| VS-135e | "but the spell takes one more action to cast and requires a cost (embalming fluid worth 6 gp)" | scaling:from-rank · economy:requires · economy:action-cost | From rank 5 the cast takes one more action and 6 gp fluid | `peaceful-rest.json` | ✅ | Rank 5 took 6 gp, 10 to 4, and pf2e's card shows 3 actions. Control: with no coins the cast was refused |

### VS-136 · Speak with Animals

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-136a | "You can ask questions of, receive answers from, and use the Diplomacy skill with animals" | when:cast · reach:self · ending:duration | A note: the caster can talk with animals for an hour | `speak-with-animals.json` | ✅ | The caster: `speak with animals`, an hour, and its roll option for anything that asks |
| VS-136b | "The spell doesn't make them more friendly than normal" | effect:gm-note | A note: the animals' attitude is the table's | `speak-with-animals.json` | — | An animal's attitude is the table's |

### VS-137 · Telepathic Bond

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-137a | "The targets can communicate telepathically with any or all of the other targets from any point on the same planet" | when:cast · reach:up-to-n · effect:message · ending:duration | A note: the targets speak telepathically for 8 hours, planet-wide | `telepathic-bond.json` | ✅ | The caster, the patient and ZZ Ally each carry the bond and an action to speak: the caster's words reached the other two, and the patient's the caster and the ally. Ending it took the actions |

### VS-138 · Ventriloquism

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-138a | "Whenever you speak or make any other sound vocally, you can make your vocalization seem to originate from somewhere else within 60 feet, and you can change that apparent location freely as you vocalize" | when:cast · reach:self · ending:duration | A note: the voice's apparent source is the table's, for 10 minutes | `ventriloquism.json` | ✅ | Thrown onto the Target, the caster's in-character words bubbled over the Target, not the caster. Once the spell ended, over the caster again |
| VS-138b | "Any creature that hears the sound can attempt to disbelieve your illusion" | check:disbelieve | A note: a hearer's attempt to disbelieve is the table's | `ventriloquism.json` | ✅ | The GM was offered a button for each creature within 60 feet of the voice; the Target's Perception, a 20, saw through it |
| VS-138c | "Heightened (2nd) The spell's duration increases to 1 hour" | scaling:from-rank · ending:duration | From rank 2 the spell lasts an hour | `ventriloquism.json` | ✅ | Rank 2: an hour. Control: rank 1, 10 minutes |
| VS-138d | "you can also change the tone, quality, and other aspects of your voice" | scaling:from-rank · effect:gm-note | A note: from rank 2 the voice's tone is the table's | `ventriloquism.json` | — | The voice's tone is the speaker's to describe |
| VS-138e | "Before a creature can attempt to disbelieve your illusion, it must actively attempt a Perception check or otherwise use actions to interact with the sound" | scaling:from-rank · check:disbelieve | A note: from rank 2 disbelief needs an active Perception check | `ventriloquism.json` | ✅ | Rank 2: no card; the patient's own Perception check within 60 feet of the voice was its attempt |

### VS-139 · Animal Vision

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-139a | "You tap into the target's senses, allowing you to sense whatever it senses for the spell's duration" | when:cast · reach:filtered · effect:sense · ending:duration | An animal only; a note: what it senses for the hour is the table's | `animal-vision.json` | ✅ | On a hawk: an hour; a stand-in player of the caster's was given Observer on it, so its token's sight is theirs, and taken away after. Control: aimed at the patient, refused |
| VS-139b | "If the target wishes to prevent you from doing so, it can attempt a Will save, negating the spell on a success" | check:save · ending:save-ends | An animal that resists saves Will; a success ends the spell | `animal-vision.json` | ✅ | The hawk's Will save, a success, ended the caster's link; a failure kept it |
| VS-139c | "While tapping into the target's senses, you can't use your own body's senses" | reach:self · effect:gm-note | A note: the caster's own senses are off while linked | `animal-vision.json` | ✅ | The caster's own token's sight is off while linked, and back after |
| VS-139d | "you can change back and forth from your body's senses to the target's senses using a Sustain action" | when:sustain · effect:sense | Sustaining switches between the caster's senses and the animal's | `animal-vision.json` | ✅ | Sustaining switched to the caster's own senses and back: sight on and off, Observer off and on |

### VS-140 · Blind Eye

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-140a | "You enchant a single object, preventing it from being used for magical observation" | when:cast · reach:object · effect:forbid · ending:preparations | A note: the object can't scry until the next daily preparations | `blind-eye.json` | ✅ | The caster's own pouch, named at the cast, is under `blind eye` until preparations |
| VS-140b | "If you cast this spell on a non-magical item used to cast scrying spells, such as a spell component pouch or a spell focus, the item can't be used to cast the spell" | reach:object · effect:forbid | A note: the pouch or focus can't cast scrying spells | `blind-eye.json` | ✅ | Clairvoyance, a scrying spell, was refused while that pouch was the caster's only one. Control: with a second pouch, cast; with the effect ended, cast |
| VS-140c | "If you cast blind eye on a magical item that can be activated to scry (such as a Crystal Ball or Hag Eye), the item can't be activated for scrying effects" | reach:object · effect:forbid | A note: the magic item can't be activated to scry | `blind-eye.json` | ✅ | The patient's crystal ball, level 7, posted nothing under it; after the effect ended, it did |
| VS-140d | "Magical items that are twice blind eye's spell rank or more aren't blocked this way" | reach:filtered · scaling:level-cap | An item of level twice the rank or more is unaffected | `blind-eye.json` | ✅ | A level 12 orb under a rank 5 blind eye still posted |

### VS-141 · Secret Page

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-141a | "You change the target's text to different text entirely" | when:cast · reach:object · effect:text-changed · ending:permanent | A note: the page's new text is the table's, with no end | `secret-page.json` | ✅ | A journal page's text became what was chosen, with no end |
| VS-141b | "If the text is a spellbook or a scroll, you can change it to show a spell you know of secret page's level or lower" | check:caster-choice · effect:text-changed | A note: the shown spell, of its rank or lower, is the table's | `secret-page.json` | ✅ | Naming Deep Breath, a spell the caster knows at rank 1, showed its description. Control: Countless Eyes, rank 4 against a rank 3 cast, showed only the words |
| VS-141c | "The replacement spell cannot be cast or used to prepare a spell" | effect:gm-note | A note: the shown spell can't be cast or prepared | `secret-page.json` | — | A spell shown on a page is words: nothing casts or prepares from it |
| VS-141d | "You can also transform the text into some other text you have written or have access to" | check:caster-choice · effect:text-changed | A note: other replacement text is the table's | `secret-page.json` | ✅ | "Meet at the old mill." showed as written |
| VS-141e | "You can specify a password that allows a creature touching the page to change the text back and forth" | check:caster-choice · effect:text-changed | A note: the password and who uses it is the table's | `secret-page.json` | ✅ | A wrong password changed nothing; the right one swapped back to the original words, and again to the new |
| VS-141f | "You must choose the replacement text and the password, if any, when you Cast the Spell" | check:caster-choice | The text and password are chosen at the cast | `secret-page.json` | ✅ | The page, the text and the password were asked as it was cast |

### VS-142 · Sending

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-142a | "You send the creature a mental message of 25 words or fewer" | when:cast · reach:single · effect:message | A note: the 25-word message is the table's | `sending.json` | ✅ | Named by its actor, the patient got the first 25 of 30 words, whispered |
| VS-142b | "it can respond immediately with its own message of 25 words or fewer" | effect:message | A note: the 25-word reply is the table's | `sending.json` | ✅ | The reply button on the patient's card sent its answer back to the caster |

### VS-143 · Caster's Imposition

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-143a | "A magical interference prevents the target from contributing to any form of cooperative spellcasting" | when:cast · reach:single · check:save | The target rolls a Will save from the card | | ☐ | |
| VS-143b | "On a failed save, the target can't participate in any ritual unless they can cast the ritual alone" | check:save · effect:gm-note · ending:duration | A note: on a failure, ritual participation is barred for the minute | | ☐ | |
| VS-143c | "they can't access any spells provided by a coven or similar cooperative ability" | check:save · effect:forbid | On a failure, coven spells are refused while it lasts | | ☐ | |
| VS-143d | "Heightened (4th) Increase the duration to 1 hour" | scaling:from-rank · ending:duration | Rank 4 lasts 1 hour | | ☐ | |
| VS-143e | "Heightened (5th) Increase the duration to 1 day" | scaling:from-rank · ending:duration | Rank 5 lasts 1 day | | ☐ | |

### VS-144 · Deep Breath

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-144a | "You take an incredibly deep breath and can hold it for the spell's duration" | when:cast · reach:self · effect:gm-note · ending:duration | The caster carries the held breath for 10 minutes | `deep-breath.json` | ✅ | The caster: `deep breath`, 10 minutes | The caster: `deep breath`, 10 minutes |
| VS-144b | "You don't lose breath when hit, but you do lose all the air you inhaled if you speak (including to Cast a Spell)" | when:holder-acts · ending:on-speaking | Speaking or Casting a Spell ends the held breath | `deep-breath.json` | ✅ | Posting Demoralize ended it, and so did casting Countless Eyes. Control: Stride left it | Posting Demoralize ended it, and so did casting Countless Eyes. Control: Stride left it |
| VS-144c | "This spell doesn't create air; if you don't have air to breathe when you cast it, you get no benefit" | economy:requires · effect:gm-note | A note: no benefit without air at the cast is the table's | `deep-breath.json` | — | Whether there is air to breathe is the table's | Whether there is air to breathe is the table's |
| VS-144d | "Heightened (2nd) The duration increases to 1 hour, and you lose only 10 minutes of breath if you speak" | scaling:from-rank · ending:duration · ending:on-speaking | Rank 2 lasts 1 hour; speaking costs only 10 minutes | `deep-breath.json` | ✅ | Rank 2: 60 minutes; Demoralize took it to 50. Control: Stride left 50 | Rank 2: 60 minutes; Demoralize took it to 50. Control: Stride left 50 |
| VS-144e | "Heightened (4th) The duration increases to 8 hours, and you lose only 10 minutes of breath if you speak" | scaling:from-rank · ending:duration · ending:on-speaking | Rank 4 lasts 8 hours; speaking costs only 10 minutes | `deep-breath.json` | ✅ | Rank 4: 480 minutes; Demoralize took it to 470 | Rank 4: 480 minutes; Demoralize took it to 470 |

### VS-145 · Environmental Endurance

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-145a | "Choose severe cold or heat" | when:cast · reach:single · check:caster-choice | Cold or heat is chosen at the cast | | ☐ | |
| VS-145b | "The target is protected from the temperature you chose (but not extreme cold or heat)" | effect:gm-note · ending:preparations | A note: protection from the chosen severe temperature, until preparations | | ☐ | |
| VS-145c | "Heightened (3rd) The target is protected from severe cold and severe heat" | scaling:from-rank · effect:gm-note | From rank 3, both severe cold and severe heat | | ☐ | |
| VS-145d | "Heightened (5th) The target is protected from severe cold, severe heat, extreme cold, and extreme heat" | scaling:from-rank · effect:gm-note | From rank 5, severe and extreme cold and heat | | ☐ | |

### VS-146 · Impart Empathy

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-146a | "Any creature to which the target isn't unfriendly or hostile can use Diplomacy to Make an Impression on it and to make very simple Requests of it" | when:cast · reach:single · reach:filtered · effect:gm-note | An animal only; a note: Diplomacy with it is the table's | | ☐ | |
| VS-146b | "Heightened (4th) The spell can also target plants and fungi" | scaling:from-rank · reach:filtered | From rank 4 a plant or fungus can be targeted | | ☐ | |

### VS-147 · Quick Sort

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-147a | "You magically sort a group of objects into neat stacks or piles" | when:cast · reach:object · effect:gm-note | A note: the sorted objects are the table's | | ☐ | |
| VS-147b | "You can sort the objects in two different ways" | check:caster-choice · effect:gm-note | A note: sorting by look or by notation is chosen | | ☐ | |
| VS-147c | "The objects sort themselves throughout the duration, though it takes less time per object to sort a smaller number of objects, down to a single round for 30 or fewer objects" | effect:gm-note · ending:duration | A note: up to a minute, one round for 30 objects | | ☐ | |
| VS-147d | "Heightened (3rd) The spell can sort up to 500 objects in a minute, or 75 objects in a round" | scaling:targets-per-rank · effect:gm-note | From rank 3, 500 objects a minute or 75 a round | | ☐ | |

### VS-148 · Spontaneous Cartography

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-148a | "You concentrate on a blank piece of parchment in your possession and record the landscape and geographical features within range" | when:cast · economy:requires · effect:info | A note: the map of the land within a mile is the table's | | ☐ | |
| VS-148b | "The resulting map bears crude but recognizable symbols to represent structures, landmarks, and pathways but doesn't label them" | effect:info | A note: unlabelled symbols on the map are the table's | | ☐ | |
| VS-148c | "Heightened (6th) The range of this spell increases to 10 miles, and major landmarks are labeled" | scaling:from-rank · effect:range · effect:info | From rank 6, 10 miles and major landmarks labelled | | ☐ | |
| VS-148d | "A small star shows the spot where you are when the map is created" | scaling:from-rank · effect:info | From rank 6 the map marks the caster's spot | | ☐ | |

### VS-149 · Water Breathing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-149a | "The targets can breathe underwater" | when:cast · reach:up-to-n · effect:gm-note | Up to 5 targets carry the effect for an hour | | ☐ | |
| VS-149b | "Heightened (3rd) The duration increases to 8 hours" | scaling:from-rank · ending:duration | Rank 3 lasts 8 hours | | ☐ | |
| VS-149c | "Heightened (4th) The duration increases to until your next daily preparations" | scaling:from-rank · ending:preparations | From rank 4 it lasts until the next daily preparations | | ☐ | |

### VS-150 · Fate's Travels

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-150a | "You get a vision of the creature when it was alive, and its last 10 minutes of travel" | when:cast · reach:object · effect:info | A note: the corpse's last 10 minutes of travel is the table's | | ☐ | |
| VS-150b | "This vision gives you a clear impression of the route it took and locations it visited, if any, but not any creatures or hazards in those areas" | effect:info | A note: the route and places, without creatures or hazards | | ☐ | |
| VS-150c | "This information is enough to automatically succeed at Tracking the creature over that distance" | check:degree-shift · effect:gm-note | Tracking the creature over that route succeeds by itself | | ☐ | |
| VS-150d | "Heightened (6th) Your vision covers the creature's last hour of travel, and you gain an impression of the hazards, creature types, and number of creatures it encountered along the way, as well as a clear impression of how it died" | scaling:from-rank · effect:info | A note: from rank 6, the last hour, encounters and its death | | ☐ | |

### VS-151 · Stonesense

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-151a | "You gain tremorsense as an imprecise sense to a range of 100 feet" | when:cast · reach:self · effect:sense · ending:duration | The caster has imprecise tremorsense 100 ft for a minute | | ☐ | |
| VS-151b | "but you can only sense vibrations through natural stone (not masonry, adobe, or any other manufactured edifice)" | effect:gm-note | A note: only through natural stone is the table's | | ☐ | |

### VS-152 · Shape Stone

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-152a | "You shape the stone into a rough shape of your choice" | when:cast · reach:object · check:caster-choice · effect:gm-note | A note: the stone's new shape is the table's | | ☐ | |
| VS-152b | "Any creatures standing atop the stone when you reshape it must each attempt a Reflex save or Acrobatics check" | reach:filtered · check:save · check:skill-swap | Each creature on the stone rolls Reflex or Acrobatics | | ☐ | |
| VS-152c | "Success The creature is unaffected" | check:save | Nothing | | ☐ | |
| VS-152d | "Failure The creature falls Prone atop the stone" | check:save · effect:condition | Prone on a failure | | ☐ | |
| VS-152e | "Critical Failure The creature falls off the stone (if applicable) and lands Prone" | check:save · effect:condition · effect:gm-note | Prone; a note: falling off the stone is the table's | | ☐ | |

### VS-153 · Shape Wood

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-153a | "You shape the wood into a rough shape of your choice" | when:cast · reach:object · check:caster-choice · effect:gm-note | A note: the wood's new shape is the table's | | ☐ | |
| VS-153b | "You cannot use this spell to enhance the value of the wooden object you are shaping" | effect:gm-note | A note: no added value is the table's | | ☐ | |

### VS-154 · Hypercognition

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-154a | "You can instantly use up to 6 Recall Knowledge actions as part of Casting this Spell" | when:cast · reach:self · check:skill · economy:action-cost | Up to 6 Recall Knowledge checks are offered at no action cost | | ☐ | |
| VS-154b | "For these actions, you can't use any special abilities, reactions, or free actions that trigger when you Recall Knowledge" | effect:forbid | Abilities triggered by Recall Knowledge are refused for these checks | | ☐ | |

### VS-155 · Umbral Journey

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-155a | "Each hour, you cover roughly as much ground as you normally would in 3 days" | when:cast · reach:up-to-n · effect:gm-note · ending:duration | A note: travel at three days' ground an hour, for 8 hours | | ☐ | |
| VS-155b | "leaving you within a mile of your intended destination when you Dismiss the spell or its duration ends" | effect:gm-note · ending:dismiss | A note: arrival within a mile of the destination is the table's | | ☐ | |

### VS-156 · Read Omens

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-156a | "Choose a particular goal or activity you plan to engage in within 1 week, or an event you expect might happen within 1 week" | when:cast · check:caster-choice | A goal or event within a week is chosen at the cast | | ☐ | |
| VS-156b | "You learn a cryptic clue or piece of advice that could help with the chosen event, often in the form of a rhyme or omen" | effect:info · effect:gm-note | A note: the clue or advice is the table's | | ☐ | |

### VS-157 · Enhance Victuals

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-157a | "You transform the target into delicious fare, changing water into wine or another fine beverage or enhancing the food's taste and ingredients to make it a gourmet treat" | when:cast · reach:object · effect:gm-note | A note: the food or drink made fine is the table's | | ☐ | |
| VS-157b | "Prior to the transformation, the spell attempts to counteract any poisons in the food or water" | reach:object · check:counteract | A counteract check against poison in the food or water is rolled | | ☐ | |
| VS-157c | "The food turns back to normal if not consumed before the duration expires, though any poisons that were counteracted are still gone" | ending:duration · effect:gm-note | A note: uneaten food reverts after 1 hour; counteracted poison stays gone | | ☐ | |
| VS-157d | "Heightened (+1) The number of gallons of water you can target increases by 1, or the number of pounds of food you can target increases by 5" | scaling:dice-per-rank · reach:object | Rank 3: up to 2 gallons or 10 pounds | | ☐ | |

### VS-158 · Glamorize

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-158a | "you alter a minor detail of your appearance" | when:cast · reach:self · effect:gm-note | A note: the change to the caster's looks is the table's | | ☐ | |
| VS-158b | "create a small environmental effect that's confined to your person" | reach:self · effect:gm-note | A note: the small effect around the caster is the table's | | ☐ | |
| VS-158c | "While the spell is active, you can Sustain it to make further adjustments" | when:sustain · effect:gm-note | Sustaining allows a further adjustment, which the table rules on | | ☐ | |
| VS-158d | "The changes persist until the spell's duration ends" | ending:duration | The changes last 1 hour | | ☐ | |
| VS-158e | "At the GM's discretion, such alterations might grant a +1 status bonus to certain tasks, such as Impersonate or Perform" | effect:bonus · effect:gm-note | A note: a +1 status bonus to Impersonate or Perform is the GM's | | ☐ | |

### VS-159 · Spell Immunity

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-159a | "You ward a creature against the effects of a single spell" | when:cast · reach:single · ending:preparations | The target carries the ward until the next daily preparations | `spell-immunity.json` | ✅ | The patient: `spell immunity`, kept until the caster's daily preparations, as *Darkvision*'s | The patient: `spell immunity`, kept until the caster's daily preparations, as *Darkvision*'s |
| VS-159b | "Choose a spell and name it aloud as part of the verbal component" | check:caster-choice | The caster names one spell at the cast | `spell-immunity.json` | ✅ | The cast asked for the spell; "Frozen Lungs" was kept as `frozen-lungs` | The cast asked for the spell; "Frozen Lungs" was kept as `frozen-lungs` |
| VS-159c | "Spell immunity attempts to counteract that spell whenever spell immunity's target is the target of the named spell or in that spell's area" | reach:single · when:spell-received · check:counteract | The named spell targeting or catching the target triggers a counteract check | `spell-immunity.json` | ✅ | Frozen Lungs at the patient: the ward rolled 13 against DC 13, a success, and the card named no target. A natural 1 failed it, and the patient stayed. Control: Holy Light at the patient rolled no ward | Frozen Lungs at the patient: the ward rolled 13 against DC 13, a success, and the card named no target. A natural 1 failed it, and the patient stayed. Control: Holy Light at the patient rolled no ward |
| VS-159d | "Successfully counteracting a spell that targets an area or multiple targets with spell immunity negates the effects only for the target affected by spell immunity" | reach:single · when:spell-received · check:counteract | Only the warded creature escapes an area or multi-target spell | `spell-immunity.json` | ✅ | Warded against Noxious Vapors, the patient was dropped from the emanation; the caster and the Target were still caught | Warded against Noxious Vapors, the patient was dropped from the emanation; the caster and the Target were still caught |

### VS-160 · Web of Influence

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-160a | "You learn the location of the nearest creature to whom the target is connected in a magical manner" | when:cast · reach:single · effect:info | The caster is told where the nearest magically connected creature is | | ☐ | |
| VS-160b | "A creature sustaining a spell on the target is connected to it for the purposes of this spell, as are any creatures who are targets of a spell effect currently affecting the target" | effect:info | Sustainers and fellow targets of its spell effects count as connected | | ☐ | |
| VS-160c | "The GM is the final arbiter of whether a creature is magically connected to the target" | effect:gm-note | A note: whether a creature is connected is the GM's | | ☐ | |
| VS-160d | "If you already know individuals who are magically connected to the target, you can exclude them from the spell" | check:caster-choice · effect:info | Connected creatures the caster knows can be left out | | ☐ | |
| VS-160e | "This spell doesn't tell you anything about the nearest magically connected creature other than its current distance and direction" | effect:info | Only distance and direction are told | | ☐ | |
| VS-160f | "If the nearest creature is on a different plane the spell indicates this but doesn't reveal which plane" | effect:info | A creature on another plane is reported as elsewhere, the plane unnamed | | ☐ | |

### VS-161 · Detect Poison

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-161a | "You detect whether a creature is venomous or poisonous, or if an object is poison or has been poisoned" | when:cast · reach:single · reach:object · effect:info | The caster is told whether the target is poisonous or poisoned | | ☐ | |
| VS-161b | "You do not ascertain whether the target is poisonous in multiple ways, nor do you learn the type or types of poison" | effect:info | Rank 1 tells only yes or no | | ☐ | |
| VS-161c | "Certain substances, like lead and alcohol, are poisons and so mask other poisons" | effect:gm-note | A note: poisons masked by lead or alcohol are the table's | | ☐ | |
| VS-161d | "Heightened (2nd) You learn the number and types of poison" | scaling:from-rank · effect:info | Rank 2 names how many poisons and their types | | ☐ | |

### VS-162 · Draw Moisture

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-162a | "You draw up to a pint of water from the object; this dries objects of less than 1 Bulk" | when:cast · reach:object · effect:gm-note | A note: an object under 1 Bulk dried is the table's | | ☐ | |
| VS-162b | "The water collects in a globule floating in your hand, which you can direct into a nearby container as part of Casting the Spell; otherwise, it splashes to the ground" | effect:gm-note | A note: where the drawn water goes is the table's | | ☐ | |
| VS-162c | "You can use this spell in especially humid environments to condense drinkable water from the air, though typically, you can't draw more than a few cups before depleting the ambient moisture" | effect:gm-note | A note: water condensed from humid air is the table's | | ☐ | |

### VS-163 · Pack Attack

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-163a | "You and one other target gain an uncanny coordination that helps you take down foes" | when:cast · reach:self · reach:single · ending:duration | The caster and one willing ally carry the effect for 1 minute | `pack-attack.json` | ✅ | The caster and the patient each carry `pack attack`, naming the other | The caster and the patient each carry `pack attack`, naming the other |
| VS-163b | "You and the other target flank any enemy to which you are both adjacent, whether or not you are on opposite sides of the enemy's space" | reach:enemies · effect:flanking | An enemy adjacent to both is off-guard to them, wherever they stand | `pack-attack.json` | ✅ | The Target, adjacent to both: the caster's Club and the patient's at DC 13, not 15. Control: D2, far off, its own DC 20; after the effect ended, 15 | The Target, adjacent to both: the caster's Club and the patient's at DC 13, not 15. Control: D2, far off, its own DC 20; after the effect ended, 15 |
| VS-163c | "Heightened (5th) The spell can target you and up to 4 willing creatures touched" | scaling:from-rank · scaling:targets-per-rank · reach:up-to-n | Rank 5: the caster and up to 4 willing creatures | `pack-attack.json` | ✅ | Rank 5 on the patient and ZZ Ally: each of the three names the other two | Rank 5 on the patient and ZZ Ally: each of the three names the other two |

### VS-164 · Enhance Senses

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-164a | "The target gains low-light vision" | when:cast · reach:single · effect:sense · ending:duration | The target has low-light vision for 1 hour | | ☐ | |
| VS-164b | "all of the target's imprecise senses have their distances doubled" | effect:sense | Each imprecise sense's range is doubled | | ☐ | |
| VS-164c | "If the target already has low-light vision, they gain darkvision" | effect:sense | A target that already has low-light vision gets darkvision | | ☐ | |
| VS-164d | "Heightened (+2) The number of targets increases by 1" | scaling:targets-per-rank · reach:up-to-n | Rank 6: two targets | | ☐ | |

### VS-165 · Mud Pit

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-165a | "Thick, clinging mud covers the ground, 1 foot deep" | when:cast · reach:area/burst · area:placed-only · area:lingering | A 15-ft burst placed within 60 ft stays on the board for 1 minute | | ☐ | |
| VS-165b | "The mud is difficult terrain" | area:lingering · effect:terrain | Moving through the mud costs as difficult terrain | | ☐ | |

### VS-166 · Shillelagh

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-166a | "The target becomes a +1 striking weapon while in your hands, gaining a +1 item bonus to attack rolls and increasing the number of weapon damage dice to two" | when:cast · reach:weapon · economy:requires · effect:weapon-runes | The held club or staff: +1 to attack, two damage dice, 1 minute | | ☐ | |
| VS-166b | "as long as you are on your home plane, attacks you make with the target against aberrations, extraplanar creatures, and undead increase the number of weapon damage dice to three" | reach:filtered · effect:strike-damage · effect:gm-note | Three damage dice against aberrations, extraplanar creatures and undead | | ☐ | |

### VS-167 · Bracing Tendrils

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-167a | "Whenever you're on the ground and a creature or effect attempts to forcibly move you from your space, you can use your spell DC in place of your Fortitude DC as the DC of the check to move you" | when:cast · reach:self · check:maneuver · check:dc-swap · ending:duration | A Shove or Reposition on the caster uses its spell DC | `bracing-tendrils.json` | ✅ | The patient's Shove and Reposition at the caster: DC 10, its Fortitude DC, became 13, its spell DC. Control: Trip stayed 10 | The patient's Shove and Reposition at the caster: DC 10, its Fortitude DC, became 13, its spell DC. Control: Trip stayed 10 |
| VS-167b | "If a creature wouldn't normally need a check to move you, it must succeed at an appropriate check (usually an Athletics check for physical movement) against your spell DC or you are unmoved" | check:skill · effect:forced-move/push | A note: a checkless move needs Athletics against the spell DC | `bracing-tendrils.json` | ✅ | The patient's own action shoving the caster 5 feet: its Athletics, a 2, against DC 13 left the caster where it stood; a natural 20 moved it. Control: with no tendrils, it moved with no roll | A note on the card, "Left to the table": a check where none was needed |
| VS-167c | "if an effect wouldn't normally need a check to move you, it must counteract bracing tendrils or you are unmoved" | reach:self · check:counteract · effect:forced-move/push | A checkless forced-move effect must counteract the spell or fail | `bracing-tendrils.json` | ✅ | The patient's Hydraulic Push, rank 1, hit the caster: its counteract succeeded and still fell short of rank 3, and the caster stayed. A critical success moved it 10 feet | A note on the card, "Left to the table": an effect must counteract the spell |
| VS-167d | "When a creature fails to move you in this way, you can choose to have the tendrils lash back and push them 5 feet away from you" | check:caster-choice · effect:forced-move/push | On a failed attempt the caster may push the creature 5 feet | `bracing-tendrils.json` | ✅ | Each held move whispered the caster a lash-back button; clicking it pushed the patient 5 feet away. A failed Shove offered it too. Control: a successful Shove offered nothing | A note on the card, "Left to the table": the push of 5 feet |

### VS-168 · Telekinetic Haul

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-168a | "You move the target up to 20 feet, potentially suspending it in midair" | when:cast · reach:object · effect:object-moved · effect:elevation/lift | The object moves up to 20 feet, perhaps held aloft | `telekinetic-haul.json` | ✅ | A crate, a loot token, moved 20 feet east in the direction picked; a choice of height then left it 20 feet up. Control: aimed at a creature, the cast was refused | A note on the card, "Left to the table": where the object goes |
| VS-168b | "When you Sustain the Spell, you can do so again" | when:sustain · reach:object · effect:recast · effect:object-moved | Each Sustain moves the object up to 20 feet again | `telekinetic-haul.json` | ✅ | Sustaining moved the crate another 20 feet | Sustain posts the spell and the note again; the move is the table's |
| VS-168c | "or you can shift your telekinetic focus to a different eligible target within range, moving it instead" | when:sustain · reach:object · check:caster-choice · effect:object-moved | A Sustain may move a different eligible object instead | `telekinetic-haul.json` | ✅ | With a second crate targeted, Sustaining moved that one, and the first stayed | The same note: another object instead |

### VS-169 · Liberating Command

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-169a | "If the target is Grabbed, Immobilized, or Restrained, it can immediately use a reaction to attempt to escape" | when:cast · reach:filtered · economy:reaction · effect:hold/condition | A grabbed, immobilized or restrained target is offered an Escape at once | | ☐ | |

### VS-170 · Restyle

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-170a | "You permanently change the appearance of one piece of clothing currently worn by you or an ally to better fit your aesthetic sensibilities" | when:cast · reach:object · effect:gm-note · ending:permanent | A note: the garment's new look is the table's | | ☐ | |
| VS-170b | "You can change its color, texture, pattern, and other minor parts of its design, but the changes can't alter the clothing's overall shape, size, or purpose" | effect:gm-note | A note: what may change, and what may not, is the table's | | ☐ | |
| VS-170c | "The object's statistics also remain unchanged" | — | Nothing on the item's sheet changes | | ☐ | |

### VS-171 · Far Sight

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-171a | "You can view creatures, objects, and terrain features that are more than 30 feet away and up to 300 feet away as though they were only 30 feet away" | when:cast · reach:self · effect:sense · effect:gm-note | A note: detail out to 300 feet seen as at 30 is the table's | | ☐ | |
| VS-171b | "You can view creatures, objects, and terrain features that are 300 feet away or more as though they were only one-tenth as far away" | effect:sense · effect:gm-note | A note: beyond 300 feet, seen at a tenth the distance | | ☐ | |
| VS-171c | "it doesn't let you treat the objects as actually closer for the purposes of spells, ranged attacks, or otherwise" | — | Ranges of spells and attacks are unchanged | | ☐ | |

### VS-172 · Invent Code

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-172a | "You grant the targets the ability to understand a newly invented language" | when:cast · reach:up-to-n · effect:language · ending:duration | The caster and up to 3 willing creatures share a language for 8 hours | `invent-code.json` | ✅ | The caster, the patient and ZZ Ally each list `Invented code` among their languages; it was on none before, and is gone when the effect ends | The caster and two targets carry `invented code` for 8 hours; the language itself is the table's |
| VS-172b | "While those under the spell’s effects can comprehend each other’s speech, it sounds indecipherable to others" | effect:gm-note | A note: outsiders can't understand the code, the table's | `invent-code.json` | — | Who understands whom is the table's | Who understands whom is the table's |
| VS-172c | "The targets can also read and write in their new language, but they cease to understand the language once the spell’s duration has ended" | effect:gm-note · ending:duration | A note: reading and writing it too, until the spell ends | `invent-code.json` | — | Reading and writing it is the table's | Reading and writing it is the table's |
| VS-172d | "If the same caster targets the same group with another use of invent code, they can once again understand their previous codes while the spell is active" | effect:gm-note | A note: a recast restores the group's earlier codes, the table's | `invent-code.json` | — | Earlier codes are the table's | Earlier codes are the table's |
| VS-172e | "Translate doesn’t allow a caster to understand the language, but it does reveal that the language is magically coded" | effect:gm-note | A note: Translate reveals only that the language is coded | `invent-code.json` | — | What Translate reveals is the table's | What Translate reveals is the table's |
| VS-172f | "Dispel magic and other similar effects can revert written text to a random but translatable jumble of all the languages the caster of invent code knows" | effect:gm-note | A note: dispelled writing turns to a jumble, the table's | `invent-code.json` | — | What dispelled writing becomes is the table's | What dispelled writing becomes is the table's |

### VS-173 · Liminal Doorway

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-173a | "You draw a chalk doorway on an unbroken surface, which opens into an extradimensional space" | when:cast · effect:extradimensional · ending:duration | A note: the doorway and its room, for 8 hours, are the table's | `liminal-doorway.json` | ✅ | A 20-foot room of its own Scene, and a door Region beside the caster, for 8 hours | A note on the card, "Left to the table": the doorway and its room, 8 hours |
| VS-173b | "Any creature treating the drawing as an actual door can Interact to touch the doorknob and pass through" | effect:teleport · effect:extradimensional | Interacting with the door moves a creature into the room | `liminal-doorway.json` | ✅ | Two creatures stepping onto the door were in the room; one stepping onto its way out was back beside the door | The same note: passing through is the table's |
| VS-173c | "The warped, chalk-drawn room beyond the door is 20 feet in width, depth, and height" | effect:extradimensional | A note: the room's size and capacity are the table's | `liminal-doorway.json` | ✅ | The room is 400 by 400 pixels: 20 feet a side | The room's size is the table's |
| VS-173d | "If the drawing is scrubbed away, the underlying surface is broken, or a creature attempts to enter the space that would put it over capacity, the space begins to collapse" | ending:with-area · effect:extradimensional | A note: what starts the collapse is the table's | `liminal-doorway.json` | ✅ | Deleting the door began the collapse; a seventeenth creature in the room did too. Control: sixteen did not | The same note names what starts the collapse |
| VS-173e | "The space ejects one creature at random each round, depositing it on the nearest open ground, until all creatures are returned outside" | effect:teleport · effect:extradimensional | Each round of collapse, one random occupant is put back outside | `liminal-doorway.json` | ✅ | One creature was put back beside the door at once, the other a round later, and the room was deleted | The same note: one creature out each round |

### VS-174 · Sky Sight

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-174a | "You gaze up and see the sky clearly despite environmental conditions" | when:cast · reach:self · effect:gm-note · ending:duration | A note: the caster sees the sky clearly for 1 hour | | ☐ | |
| VS-174b | "You can see through weather and physical obstructions such as a forest canopy, building material, and cave walls" | effect:sense · effect:gm-note | A note: sky seen through canopy, roofs and rock is the table's | | ☐ | |
| VS-174c | "This can be used to spot flying creatures or navigate by the stars even when you otherwise couldn't see them" | effect:gm-note | A note: flyers and stars overhead may be seen, the table's | | ☐ | |

### VS-175 · Blessing of Vigor

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-175a | "The target gains fast healing 3" | when:cast · reach:single · effect:fast-healing · ending:duration | Fast healing 3 for 3 rounds | | ☐ | |
| VS-175b | "Heightened (+1) The fast healing increases by 3" | scaling:dice-per-rank · effect:fast-healing | Rank 2: fast healing 6 | | ☐ | |

### VS-176 · Ghostly Weapon

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-176a | "It gains the effects of the Ghost Touch property rune" | when:cast · reach:weapon · effect:weapon-runes · ending:duration | The weapon carries ghost touch for 5 minutes | | ☐ | |
| VS-176b | "meaning it is magical if it wasn't already" | effect:trait-gained | The weapon counts as magical | | ☐ | |
| VS-176c | "is especially effective against incorporeal creatures" | reach:filtered · effect:ignore-resistance | Its damage gets past an incorporeal creature's resistance | | ☐ | |
| VS-176d | "can be wielded by a corporeal or incorporeal creature" | effect:gm-note | A note: an incorporeal creature can wield it | | ☐ | |

### VS-177 · Air Bubble

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-177a | "Trigger A creature within range enters an environment where it can't breathe" | economy:reaction · reach:single | Cast as a reaction when a creature in range can't breathe | | ☐ | |
| VS-177b | "A bubble of pure air appears around the target's head, allowing it to breathe normally" | when:cast · reach:single · effect:gm-note · ending:duration | The target breathes normally for up to 1 minute | | ☐ | |
| VS-177c | "The effect ends as soon as the target returns to an environment where it can breathe normally" | effect:gm-note | A note: it ends once the air is breathable, the table's | | ☐ | |

### VS-178 · Creation

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-178a | "You conjure a temporary object from magical energy" | when:cast · effect:item-conjured · ending:duration | A note: the object conjured for 1 hour is the table's | `creation.json` | ✅ | Asked what to create, "Wooden ladder": an item of that name, worth nothing, in the caster's inventory for 1 hour, gone with the effect | A note on the card, "Left to the table": the object, earthen or plant, for 1 hour |
| VS-178b | "It must consist of earthen or plant-derived matter (such as wood, paper, brick, or stone) and be 5 cubic feet or smaller" | effect:gm-note | A note: earthen or plant matter, 5 cubic feet at most | `creation.json` | — | What it is made of is the table's | What it is made of is the table's |
| VS-178c | "It can't rely on intricate artistry or complex moving parts, never fulfills a cost or the like, and can't be made of precious materials or materials with a rarity of uncommon or higher" | effect:gm-note | A note: no fine work, costs or rare materials, the table's | `creation.json` | — | What it cannot be is the table's | What it cannot be is the table's |
| VS-178d | "It is obviously temporarily conjured, and thus can't be sold or passed off as a genuine item" | effect:gm-note | A note: it can't be sold or passed off as real | `creation.json` | — | That it cannot be sold is the table's | That it cannot be sold is the table's |
| VS-178e | "The spell gains the appropriate trait for the item created, typically earth, plant, or wood" | check:caster-choice · effect:trait-gained | The spell gains earth, plant or wood to match the item | `creation.json` | — | The spell's trait changes nothing in play | The spell's trait changes nothing in play |
| VS-178f | "Heightened (5th) The item is metal and can include common minerals, like feldspar or quartz" | scaling:from-rank · effect:gm-note | Rank 5: the object may be metal or common minerals | `creation.json` | — | The material is part of what the caster names; the prompt says metal and minerals come at rank 5 | The same note: metal or minerals from rank 5 |
| VS-178g | "The spell gains the metal trait if used to create a metal object" | scaling:from-rank · effect:trait-gained | Rank 5, a metal object: the spell gains the metal trait | `creation.json` | — | The spell's trait changes nothing in play | The spell's trait changes nothing in play |

### VS-179 · King's Castle

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-179a | "You and a willing creature swap places. You appear in the target's former space, and the target appears in your former space" | when:cast · reach:self · reach:single · effect:teleport | The caster and the target exchange spaces | | ☐ | |
| VS-179b | "You and your target must each be able to fit in the new spaces within range; otherwise, the spell fails" | economy:requires · reach:filtered | A swap where either cannot fit, or is out of range, fails | | ☐ | |

### VS-180 · Rope Trick

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-180a | "You cause the target rope to rise vertically into the air" | when:cast · reach:object · effect:gm-note · ending:duration | A note: the rope stands upright for 8 hours, the table's | | ☐ | |
| VS-180b | "Where it ends, an extradimensional space opens, connected to the top of the rope" | effect:gm-note | A note: the space at the rope's top is the table's | | ☐ | |
| VS-180c | "This space can be reached only by climbing the rope" | effect:gm-note | A note: only climbing the rope reaches it | | ☐ | |
| VS-180d | "The entrance to the space can't be seen, and it can be pinpointed only by the presence of the rope" | effect:gm-note | A note: the entrance is unseen, found only by the rope | | ☐ | |
| VS-180e | "The rope can't be removed or hidden, though it can be detached from the extradimensional space by pulling it with 16,000 pounds of weight, critically succeeding at an Athletics check against the spell's DC, or destroying the rope" | check:skill · effect:gm-note | A critical success at Athletics against the spell DC detaches the rope | | ☐ | |
| VS-180f | "The space holds up to eight Medium creatures and their gear. A Large creature counts as two Medium creatures, a Huge creature counts as four Medium creatures, and a Gargantuan creature fills the space on its own" | effect:gm-note | A note: capacity eight Medium; Large two, Huge four, Gargantuan all | | ☐ | |
| VS-180g | "If the rope is detached or destroyed, or if a creature attempts to enter the space that would put it over its capacity, the space begins to unravel" | effect:gm-note | A note: what starts the unravelling is the table's | | ☐ | |
| VS-180h | "It disappears in 1d4 rounds, depositing the creatures within safely on the ground below" | ending:duration · effect:teleport · effect:gm-note | After 1d4 rounds the space ends and its occupants land below | | ☐ | |

### VS-181 · Spiritual Renewal

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-181a | "The target gains fast healing 8" | when:cast · reach:filtered · effect:fast-healing · ending:duration | A living target has fast healing 8 for 4 rounds | | ☐ | |
| VS-181b | "Heightened (+1) The fast healing increases by 2" | scaling:dice-per-rank · effect:fast-healing | Rank 5: fast healing 10 | | ☐ | |

### VS-182 · Temporary Tool

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-182a | "You conjure a temporary simple tool, such as a shovel or rope into your hands" | when:cast · reach:self · effect:item-conjured | A note: the conjured tool the caster holds is the table's | `temporary-tool.json` | ✅ | Chose Rope: a Rope granted into the caster's inventory. Chose Crowbar: a Crowbar. Ending the effect took the Rope away | Chose Rope: a Rope granted into the caster's inventory. Chose Crowbar: a Crowbar. Ending the effect took the Rope away |
| VS-182b | "It lasts until it's used for a single activity or for 1 minute, whichever comes first, after which it disappears" | ending:spent · ending:duration | The tool is gone after one activity or 1 minute | `temporary-tool.json` | ✅ | 1 minute, and the holder's own action spends it: used, the effect and the Rope were gone | The effect, and its tool, last 1 minute; ending it after one use is the table's |
| VS-182c | "The tool is obviously temporarily conjured and thus can't be sold or passed off as a genuine item" | effect:gm-note | A note: the tool can't be sold is the table's | `temporary-tool.json` | — | That it cannot be sold is the table's | That it cannot be sold is the table's |

### VS-183 · Familiar's Call

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-183a | "Your familiar dissolves and rematerializes in your space" | when:cast · reach:companion · effect:teleport | The caster's familiar moves to a space by the caster | `familiars-call.json` | ✅ | The caster's familiar, 40 feet away, landed 5 feet from it. Control: aimed at the patient, the cast was refused | The caster's familiar, 40 feet away, landed 5 feet from it. Control: aimed at the patient, the cast was refused |
| VS-183b | "Heightened (5th) You can call your familiar so long as your familiar is on the same planet as you" | scaling:from-rank · reach:companion · effect:teleport | From rank 5 a familiar anywhere on the planet answers | `familiars-call.json` | ✅ | The familiar on another scene was taken off it and set down 5 feet from the caster. The world has no miles: every scene is in reach | A note on the card, "Left to the table": a familiar off this scene is the table's |
| VS-183c | "Heightened (7th) You can call your familiar so long as your familiar is on the same plane of existence as you" | scaling:from-rank · reach:companion · effect:teleport | From rank 7 a familiar anywhere on the plane answers | `familiars-call.json` | ✅ | The same: a familiar on any scene answers | The same note |
| VS-183d | "Heightened (9th) You can call your familiar even if the familiar is on a different plane of existence" | scaling:from-rank · reach:companion · effect:teleport | From rank 9 a familiar on another plane answers | `familiars-call.json` | ✅ | The same | The same note |

### VS-184 · Fire's Pathway

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-184a | "You step into a blazing fire that's big enough for you to fit inside and instantly teleport to any other fire within 5 miles that also has a sufficiently large size" | when:cast · reach:self · economy:requires · effect:teleport | From inside a large fire, the caster teleports to another within 5 miles | | ☐ | |
| VS-184b | "Once you enter the first fire, you instantly know the rough locations of other sufficiently large fires within range" | effect:info | A note: the large fires in range are the table's to tell | | ☐ | |
| VS-184c | "can exit from the original fire, if you prefer" | check:caster-choice | The caster may step back out where they entered | | ☐ | |
| VS-184d | "You can't carry extradimensional spaces with you; if you attempt to do so, the spell fails" | economy:requires | Carrying an extradimensional space makes the spell fail | | ☐ | |
| VS-184e | "Heightened (6th) The fire you exit can be up to 50 miles away" | scaling:from-rank · effect:range | Rank 6 reaches a fire 50 miles away | | ☐ | |
| VS-184f | "Heightened (8th) The fire you exit can be up to 500 miles away" | scaling:from-rank · effect:range | Rank 8 reaches a fire 500 miles away | | ☐ | |
| VS-184g | "Heightened (9th) The fire you exit can be anywhere on the same planet" | scaling:from-rank · effect:range | Rank 9 reaches any fire on the planet | | ☐ | |

### VS-185 · Nature's Pathway

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-185a | "You step into a living tree with a trunk big enough for you to fit inside it and instantly teleport to any tree within 5 miles that also has a sufficiently large trunk" | when:cast · reach:self · economy:requires · effect:teleport | From inside a large tree, the caster teleports to another within 5 miles | | ☐ | |
| VS-185b | "Once you enter the first tree, you instantly know the rough locations of other sufficiently large trees within range" | effect:info | A note: the large trees in range are the table's to tell | | ☐ | |
| VS-185c | "can exit from the original tree, if you prefer" | check:caster-choice | The caster may step back out where they entered | | ☐ | |
| VS-185d | "You can't carry extradimensional spaces with you; if you attempt to do so, the spell fails" | economy:requires | Carrying an extradimensional space makes the spell fail | | ☐ | |
| VS-185e | "Heightened (6th) The tree you exit can be up to 50 miles away" | scaling:from-rank · effect:range | Rank 6 reaches a tree 50 miles away | | ☐ | |
| VS-185f | "Heightened (8th) The tree you exit can be up to 500 miles away" | scaling:from-rank · effect:range | Rank 8 reaches a tree 500 miles away | | ☐ | |
| VS-185g | "Heightened (9th) The tree you exit can be anywhere on the same planet" | scaling:from-rank · effect:range | Rank 9 reaches any tree on the planet | | ☐ | |

### VS-186 · Tremorsense

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-186a | "You gain tremorsense as an imprecise sense with a range of 30 feet" | when:cast · reach:self · effect:sense · ending:duration | The caster has imprecise tremorsense 30 ft for 10 minutes | | ☐ | |
| VS-186b | "you can detect a creature only if it's on the same surface as you and only if the subject is moving along (or burrowing through) the surface" | reach:filtered · effect:sense | Only creatures moving on the caster's surface are sensed | | ☐ | |
| VS-186c | "Heightened (3rd) The spell's duration is 1 hour" | scaling:from-rank · ending:duration | From rank 3 it lasts an hour | | ☐ | |
| VS-186d | "Heightened (5th) The spell's duration is 8 hours" | scaling:from-rank · ending:duration | From rank 5 it lasts 8 hours | | ☐ | |

### VS-187 · Disguise Magic

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-187a | "You alter how an item's or spell's magical aura appears to effects like detect magic" | when:cast · reach:object · effect:gm-note | Detection reads the target's aura as disguised, until preparations | | ☐ | |
| VS-187b | "You can hide the auras entirely, have an item register as a common item of lower level, or make a spell register as a common spell of the same or lower rank" | check:caster-choice · effect:gm-note | The caster's chosen disguise is recorded for the table | | ☐ | |
| VS-187c | "You can Dismiss the spell" | ending:dismiss | The caster can Dismiss it | | ☐ | |
| VS-187d | "A caster using Detect Magic or Read Aura of a higher rank than disguise magic can attempt to disbelieve the illusion using the skill matching the tradition of the spell" | reach:filtered · check:skill | A higher-rank detector may roll its tradition's skill to disbelieve | | ☐ | |
| VS-187e | "Further attempts by the same caster get the same result as the initial check to disbelieve" | check:result-kept | A detector's first disbelief result stands for its later tries | | ☐ | |
| VS-187f | "Heightened (2nd) You can Cast this Spell on a creature, disguising all items and spell effects on it" | scaling:from-rank · reach:single · effect:gm-note | From rank 2 a creature can be the target | | ☐ | |

### VS-188 · Dome of Tranquility

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-188a | "The air around you falls still and blocks out the sounds of the outside world" | when:cast · reach:area/burst · area:lingering · ending:duration | A 30-ft burst stays on the board for the hour | `dome-of-tranquility.json` | ✅ | A 30-foot burst placed in range, lasting 1 hour | A 30-foot burst placed in range, lasting 1 hour |
| VS-188b | "While you can clearly hear anything within this isolated dome, you can't hear anything outside of it. The opposite is also true, with no one outside of your dome being able to hear what's within" | when:while-inside · effect:sense | A note: no sound crosses the dome's edge is the table's | `dome-of-tranquility.json` | ✅ | 24 walls on the dome's edge stop sound and nothing else: a sound test from its centre outward is blocked. Control: with the dome gone, it is not | A note on the card, "Left to the table": no sound crosses the dome's edge |
| VS-188c | "If anything larger than 1 Bulk passes through it, the dome is automatically dispersed" | ending:crossed | A creature crossing the dome's edge ends the spell | `dome-of-tranquility.json` | ✅ | D2 moving in across the edge dispersed it, with a word why. Control: D2 moving 5 feet outside left it; the creatures inside when it was cast did not end it | D2 moving in across the edge dispersed it, with a word why. Control: D2 moving 5 feet outside left it; the creatures inside when it was cast did not end it |
| VS-188d | "You can Dismiss this spell" | ending:dismiss | The caster can Dismiss it | `dome-of-tranquility.json` | ✅ | The caster's Dismiss ended it | The caster's Dismiss ended it |
| VS-188e | "Heightened (3rd) The duration increases to 8 hours" | scaling:from-rank · ending:duration | From rank 3 it lasts 8 hours | `dome-of-tranquility.json` | ✅ | Rank 3: 8 hours. Control: rank 1, 1 hour | Rank 3: 8 hours. Control: rank 1, 1 hour |
| VS-188f | "Heightened (5th) The duration increases to 24 hours" | scaling:from-rank · ending:duration | From rank 5 it lasts 24 hours | `dome-of-tranquility.json` | ✅ | Rank 5: 24 hours | Rank 5: 24 hours |

### VS-189 · Glowing Trail

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-189a | "Your movements leave a vague glowing path behind you" | when:self-moves · area:trail | A note: the path along the caster's movement is the table's | `glowing-trail.json` | ✅ | Each move of the caster left a mark where it started, at its elevation | The caster carries `glowing trail` for 1 hour; A note on the card, "Left to the table": the path |
| VS-189b | "The path fades after 10 minutes" | area:trail · ending:duration | Each stretch of path fades 10 minutes after it is laid | `glowing-trail.json` | ✅ | Five minutes on, both marks stood; ten minutes on, they were gone | The same note: each stretch fades after 10 minutes |
| VS-189c | "You can Dismiss this spell at any time, but the path fades normally" | ending:dismiss · area:trail | Dismissing stops new path; the laid path still fades on time | `glowing-trail.json` | ✅ | Dismissed, a move left no new mark; the one laid before stayed until its time | The same note |
| VS-189d | "The path can be visible or Invisible" | check:caster-choice | The caster chooses visible or invisible at the cast | `glowing-trail.json` | ✅ | Asked at the cast: invisible marks are hidden Drawings, visible ones shown | The same note: visible or invisible |
| VS-189e | "While visible, it appears as a faintly glowing mist in a color of your choosing but sheds no light beyond its area" | check:caster-choice | A note: the mist's colour is the table's; it lights nothing | `glowing-trail.json` | ✅ | The colour asked for at the cast, `#ff3366`, is the marks' colour | Its colour is the table's |
| VS-189f | "While invisible, you can still detect the path, but it gives off no light" | reach:self · effect:sense | Only the caster can see an invisible path | `glowing-trail.json` | ✅ | An invisible mark is hidden, and authored by the caster's player — who, with the GM, is the only one to see it | The same note |
| VS-189g | "Heightened (3rd) The glowing trail fades after 1 day" | scaling:from-rank · ending:duration | From rank 3 the path lasts a day | `glowing-trail.json` | ✅ | Rank 3: a mark lasts a day. Control: rank 1, 10 minutes | The same note: longer from rank 3 |
| VS-189h | "Heightened (5th) The glowing trail fades after 1 week" | scaling:from-rank · ending:duration | From rank 5 the path lasts a week | `glowing-trail.json` | ✅ | Rank 5: a week | The same note |
| VS-189i | "Heightened (7th) The glowing trail fades after 1 month" | scaling:from-rank · ending:duration | From rank 7 the path lasts a month | `glowing-trail.json` | ✅ | Rank 7: 30 days | The same note |
| VS-189j | "Heightened (9th) The glowing trail fades after 1 year" | scaling:from-rank · ending:duration | From rank 9 the path lasts a year | `glowing-trail.json` | ✅ | Rank 9: a year | The same note |

### VS-190 · Message Rune

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-190a | "You record a message up to 5 minutes long and inscribe a special rune on any flat unattended surface or small object within reach" | when:cast · reach:object · effect:gm-note | A note: the rune and its message are kept for the table | | ☐ | |
| VS-190b | "You also specify a trigger that creatures must meet to activate the rune" | check:caster-choice · effect:gm-note | The caster's trigger is recorded with the rune | | ☐ | |
| VS-190c | "For the duration of the spell, creatures that meet the criteria of the trigger can touch the rune to hear the recorded message in their head as though you were speaking to them telepathically" | reach:filtered · effect:gm-note · ending:duration | A note: who meets the trigger and hears it is the table's | | ☐ | |
| VS-190d | "You know when someone is listening to the message, but you don't know who's listening to it" | effect:info | The caster is told when the message plays, not by whom | | ☐ | |
| VS-190e | "You can Dismiss the spell" | ending:dismiss | The caster can Dismiss it | | ☐ | |
| VS-190f | "Heightened (+2) The duration increases for every 2 ranks, becoming 1 week, 1 month, 1 year, or unlimited respectively" | scaling:dice-per-rank · ending:duration · ending:permanent | Rank 3 lasts a week, 5 a month, 7 a year, 9 unlimited | | ☐ | |

### VS-191 · Reflected Beauty

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-191a | "When you cast reflected beauty, choose a willing creature that's the same size as you and that you can see within 30 feet" | when:cast · reach:single · reach:filtered | A willing, same-size, seen creature within 30 ft is chosen | | ☐ | |
| VS-191b | "The spell then disguises you with a realistic illusion, as if via Illusory Disguise heightened to 3rd rank, but includes tactile and olfactory sensation in addition to visual and voice" | reach:self · effect:gm-note | The caster carries a rank-3 Illusory Disguise for the hour | | ☐ | |
| VS-191c | "The appearance of the illusion that disguises you includes any changes to sex characteristics or other aspects needed to match the target creature's heart's desire" | effect:gm-note | A note: what the disguise looks like is the table's | | ☐ | |
| VS-191d | "If you're ever more than 30 feet from the subject you're reflecting, reflected beauty immediately ends" | ending:out-of-range | More than 30 ft from the subject ends the spell | | ☐ | |
| VS-191e | "You can Dismiss this spell" | ending:dismiss | The caster can Dismiss it | | ☐ | |

### VS-192 · Shift Perspective

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-192a | "You throw one item of light Bulk or less that you're holding to a location within range that you can see, then gain temporary vision from where that object lands" | when:cast · reach:object · economy:requires · effect:sense | A held light item lands at a seen point; the caster sees from it | | ☐ | |
| VS-192b | "The object sees in all directions with your normal visual senses" | effect:sense | The view from the object uses the caster's own senses | | ☐ | |
| VS-192c | "You can Sustain this spell to switch between the thrown object's perspective and your regular vision while the spell is active, but you can only see through one perspective at a time" | when:sustain · effect:sense | Each Sustain switches the caster's view between the two | | ☐ | |
| VS-192d | "You can Dismiss this spell" | ending:dismiss | The caster can Dismiss it | | ☐ | |

### VS-193 · Instant Parade

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-193a | "An illusory parade with dozens of participants and performers appears around you, following you as you move" | when:cast · reach:area/emanation · area:aura/region · ending:duration | A 10-ft emanation follows the caster for 10 minutes | | ☐ | |
| VS-193b | "The parade is lively and noisy, providing enough cover and distraction to hide among the crowd. You and other creatures can Hide and Sneak inside the crowd" | when:while-inside · effect:cover | Creatures inside can Hide and Sneak as though in cover | | ☐ | |
| VS-193c | "though creatures that disbelieve the illusion still see creatures within as normal" | reach:filtered · effect:gm-note | A note: who has disbelieved is the table's | | ☐ | |
| VS-193d | "You can choose to send the parade off with a 2-action activity, which has the concentrate trait" | economy:granted-action | A 2-action concentrate activity sends the parade off | | ☐ | |
| VS-193e | "When you do so, the parade no longer follows you and instead continues traveling in the direction of your choice" | check:caster-choice · area:drifts | The area stops following and moves in the chosen direction | | ☐ | |
| VS-193f | "The parade travels 100 feet over 1 round and then disappears as the spell is Dismissed" | area:drifts · ending:duration | It travels 100 ft over a round, then the spell ends | | ☐ | |
| VS-193g | "You can otherwise Dismiss the spell normally if you prefer" | ending:dismiss | The caster can Dismiss it | | ☐ | |

### VS-194 · Acid Storm

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-194a | "You evoke a storm of acid rain that pelts the area for the spell's duration" | when:cast · reach:area/burst · area:lingering · ending:duration | A 20-ft burst within 120 ft stays for 1 minute | | ☐ | |
| VS-194b | "A creature that begins its turn in the area takes 3d8 acid damage (basic Reflex save)" | when:turn-start · check:basic-save · effect:damage | Starting a turn inside: basic Reflex against 3d8 acid | | ☐ | |
| VS-194c | "Heightened (+2) The damage increases by 1d8" | scaling:dice-per-rank · effect:damage | Rank 7 deals 4d8 | | ☐ | |

### VS-195 · Approximate

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-195a | "Name a particular type of object you're looking for within the area" | when:cast · reach:object · check:caster-choice | The caster names an object type in a 1-cubic-foot area | | ☐ | |
| VS-195b | "You gain an instant estimate of the quantity of the chosen objects that are clearly visible within the target area. The number is rounded to the largest digit" | effect:info | A note: the rounded count is the table's to tell | | ☐ | |
| VS-195c | "the distinguishing features must be obvious at a glance, and the spell is fooled by objects disguised as other objects" | effect:gm-note | A note: what fools the count is the table's | | ☐ | |

### VS-196 · Breathe Fire

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-196a | "A gout of flame sprays from your mouth" | when:cast · reach:area/cone | A 15-ft cone aimed from the caster's edge | | ☐ | |
| VS-196b | "You deal 2d6 fire damage to creatures in the area with a basic Reflex save" | check:basic-save · effect:damage | Each creature caught saves basic Reflex against 2d6 fire | | ☐ | |
| VS-196c | "Heightened (+1) The damage increases by 2d6" | scaling:dice-per-rank · effect:damage | Rank 2 deals 4d6 | | ☐ | |

### VS-197 · Cleanse Cuisine

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-197a | "You transform all food and beverages in the area into delicious fare" | when:cast · reach:object · effect:gm-note | A note: the food in the cubic foot improved is the table's | | ☐ | |
| VS-197b | "You can also choose to remove all toxins and contaminations from the food" | check:caster-choice · effect:gm-note | A note: the food freed of toxins is the table's | | ☐ | |
| VS-197c | "Heightened (+2) Add another cubic foot to the area, which must be contiguous with the rest" | scaling:area-per-rank · effect:gm-note | Rank 3 covers two contiguous cubic feet | | ☐ | |

### VS-198 · Control Water

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-198a | "you can raise or lower the level of water in the chosen area by 10 feet" | when:cast · reach:area/square · check:caster-choice · effect:gm-note | A note: a 50-ft square's water moved 10 ft is the table's | | ☐ | |
| VS-198b | "Creatures that have the water trait and that are in the area when you Cast the Spell must attempt a Fortitude save, with the effects of the Slow spell" | reach:filtered · check:save · effect:condition · ending:duration | Water-trait creatures inside save Fortitude; slowed as Slow's degrees say | | ☐ | |

### VS-199 · Dreaming Potential

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-199a | "You draw the target into a lucid dream" | when:cast · reach:single · ending:duration | The touched sleeper carries the dream for 8 hours | | ☐ | |
| VS-199b | "If it sleeps the full 8 hours uninterrupted, when it wakes, it counts as having spent a day of downtime retraining" | effect:gm-note | A note: a day of retraining after unbroken sleep is the table's | | ☐ | |
| VS-199c | "it can't use dreaming potential for any retraining that would require either an instructor or specialized knowledge it can't access within the dream" | effect:gm-note | A note: retraining that needs a teacher is the table's to refuse | | ☐ | |

### VS-200 · Know the Way

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-200a | "You immediately know which direction is north (if it exists at your current location)" | when:cast · reach:self · effect:info | A note: which way is north is the table's to tell | | ☐ | |
| VS-200b | "you can choose a location you were at within the last 24 hours and learn what direction it lies" | check:caster-choice · effect:info | A note: the direction to the chosen place is the table's | | ☐ | |
| VS-200c | "Heightened (3rd) You can choose a location you were at within the last week" | scaling:from-rank · effect:info | From rank 3 a place from the last week can be chosen | | ☐ | |
| VS-200d | "Heightened (7th) You can choose a location you were at regardless of how long ago you were there" | scaling:from-rank · effect:info | From rank 7 any place ever visited can be chosen | | ☐ | |

### VS-201 · Magic Stone

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-201a | "You can target 1 non-magical stone or sling bullet for every action you use Casting this Spell" | when:cast · reach:object · scaling:per-action | One stone per action spent, up to 3 | | ☐ | |
| VS-201b | "The stones must be unattended or carried by you or a willing ally" | economy:requires | Only unattended stones, or the caster's or a willing ally's | | ☐ | |
| VS-201c | "The stones become +1 striking disrupting Sling Bullets" | effect:weapon-runes · ending:duration | Each stone is a +1 striking disrupting sling bullet for 1 minute | | ☐ | |
| VS-201d | "Each stone can be used only once, after which it crumbles to dust" | ending:spent | A stone is gone after one Strike | | ☐ | |

### VS-202 · Ritual Obstruction

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-202a | "You establish a zone of magical feedback that makes it impossible to succeed at rituals of this spell's rank or lower in the area" | when:cast · reach:area/burst · area:lingering · ending:duration | A 60-ft burst stays on the board for a day | | ☐ | |
| VS-202b | "Ritual obstruction ignores all cover, including walls and ceilings, to the extent of its area" | effect:cover-reduced | Walls and ceilings do not cut the area short | | ☐ | |
| VS-202c | "Anyone attempting to cast a ritual within the area knows, when they begin to cast the ritual, the area is cursed to impede rituals" | when:while-inside · effect:info | A ritual caster inside is told the area is cursed | | ☐ | |
| VS-202d | "Any ritual cast in the area can't have a final result better than failure" | when:while-inside · reach:filtered · check:degree-shift | A ritual of its rank or lower inside ends no better than failure | | ☐ | |

### VS-203 · Timely Reminder

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-203a | "You send a message to yourself that's delivered at a delayed time of your choosing. Whisper a message no longer than 8 words and concentrate on a date and time within the next year" | when:cast · reach:self · check:caster-choice | The message and a date within a year are recorded | `timely-reminder.json` | ✅ | The cast asked for a message and a delay: "Buy more rope", 10 minutes, kept for 600 seconds on | The cast asked for a message and a delay: "Buy more rope", 10 minutes, kept for 600 seconds on |
| VS-203b | "At the chosen moment, a gentle chime will sound in your head, followed by the message repeated twice in an average, steady tone" | when:at-time · effect:info | At the chosen world time the caster is told the message | `timely-reminder.json` | ✅ | Five minutes on, nothing. Ten minutes on, a whisper: the chime, then the message twice; the effect ended | Five minutes on, nothing. Ten minutes on, a whisper: the chime, then the message twice; the effect ended |
| VS-203c | "This spell can be Dismissed at any time" | ending:dismiss | The caster can Dismiss it | `timely-reminder.json` | ✅ | The caster's Dismiss ended it | The caster's Dismiss ended it |
| VS-203d | "If a new casting of timely reminder is used, the first message is erased as soon as the new message is created" | ending:replaces-previous | A new casting erases the earlier message | `timely-reminder.json` | ✅ | A second cast left only "Second note" | A second cast left only "Second note" |
| VS-203e | "Heightened (5th) You send the reminder message to another willing creature you know" | scaling:from-rank · reach:single | From rank 5 a known willing creature receives the message | `timely-reminder.json` | ✅ | Rank 5 at the patient: the patient carries it, the caster nothing | Rank 5 at the patient: the patient carries it, the caster nothing |
| VS-203f | "If the creature isn't on the same plane of existence when you Cast this Spell, the spell fails" | reach:filtered · effect:gm-note | A note: a recipient on another plane makes it fail | `timely-reminder.json` | — | Another plane is the table's | Another plane is the table's |

### VS-204 · Blazing Fissure

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-204a | "Each creature along the line and on solid ground takes 4d6 bludgeoning damage and 6d6 fire damage with a Reflex save" | when:cast · reach:area/line · reach:filtered · check:save · effect:damage | A 120-ft line catches grounded creatures; Reflex against 4d6 bludgeoning and 6d6 fire | | ☐ | |
| VS-204b | "Critical Success The creature is unaffected" | check:save | Nothing | | ☐ | |
| VS-204c | "Success The creature takes half damage" | check:save · effect:damage | Half damage | | ☐ | |
| VS-204d | "Failure The creature takes full damage, and it falls Prone" | check:save · effect:damage · effect:condition | Full damage and prone | | ☐ | |
| VS-204e | "Critical Failure The creature takes double damage, and it falls prone" | check:save · effect:damage · effect:condition | Double damage and prone | | ☐ | |
| VS-204f | "Heightened (+1) The damage increases by 1d6 bludgeoning and 1d6 fire" | scaling:dice-per-rank · effect:damage | Rank 6 deals 5d6 bludgeoning and 7d6 fire | | ☐ | |

### VS-205 · Circle of Protection

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-205a | "You ward a creature and those nearby against a specified alignment" | when:cast · reach:area/emanation · area:aura/pf2e · area:from-target | A 10-ft emanation around the touched creature moves with it | | ☐ | |
| VS-205b | "Choose chaotic, evil, good, or lawful; this spell gains the opposing trait" | check:caster-choice · effect:trait-gained | The chosen alignment is kept; the spell gains its opposite | | ☐ | |
| VS-205c | "Creatures in the area gain a +1 status bonus to AC against attacks by creatures of the chosen alignment and to saves against effects from such creatures" | when:while-inside · effect:bonus | Inside: +1 status to AC and saves against that alignment | | ☐ | |
| VS-205d | "This bonus increases to +3 against effects from such creatures that directly control the target and attacks made by summoned creatures of the chosen alignment" | reach:filtered · effect:bonus | +3 against control effects and summoned attackers of that alignment | | ☐ | |
| VS-205e | "Summoned creatures of the chosen alignment can't willingly enter the area without succeeding at a Will save" | when:on-entering · reach:filtered · check:save · effect:approach-barred | A summoned creature of it must succeed at Will to enter | | ☐ | |
| VS-205f | "repeated attempts use the first save result" | check:result-kept | Its first Will result stands for later attempts | | ☐ | |
| VS-205g | "Heightened (4th) The duration increases to 1 hour" | scaling:from-rank · ending:duration | From rank 4 it lasts an hour | | ☐ | |

### VS-206 · Frozen Lungs

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-206a | "Freezing cold water pools within the lungs of the target, dealing 2d8 cold damage with a Fortitude save" | when:cast · reach:single · check:save · effect:damage | The target saves Fortitude against 2d8 cold | `frozen-lungs.json` | ✅ | The card rolls `2d8` cold with the Fortitude save | The card rolls `2d8` cold with the Fortitude save |
| VS-206b | "You can Dismiss this spell" | ending:dismiss | The caster can Dismiss it | `frozen-lungs.json` | ✅ | The caster's Dismiss ended it | The caster's Dismiss ended it |
| VS-206c | "Critical Success The target is unaffected" | check:save | Nothing | `frozen-lungs.json` | ✅ | Critical success: no effect | Critical success: no effect |
| VS-206d | "Success The target takes half damage. For the spell's duration, the target takes 1[cold] damage whenever it performs an auditory action or Casts a Spell" | check:save · when:holder-acts · effect:damage · ending:duration | Half; then 1 cold per auditory action or cast, for the minute | `frozen-lungs.json` | ✅ | Success: `frozen lungs`, 1 minute; the patient's Demoralize then cost it 1 cold. Control: its Seek, nothing | Success: `frozen lungs`, 1 minute; the patient's Demoralize then cost it 1 cold. Control: its Seek, nothing |
| VS-206e | "Failure The target takes full damage. For the spell's duration, the target takes (floor(@item.rank/2))d8[cold] damage whenever it performs an auditory action or Casts a Spell" | check:save · when:holder-acts · effect:damage · ending:duration | Full; then 1d8 cold per auditory action or cast at rank 2 | `frozen-lungs.json` | ✅ | Failure: Demoralize cost `1d8` cold. Control: Seek, nothing | Failure: Demoralize cost `1d8` cold. Control: Seek, nothing |
| VS-206f | "Critical Failure The target takes double damage. For the spell's duration, the target takes (floor(@item.rank/2) + 1)d8[cold] damage whenever it performs an auditory action or Casts a Spell" | check:save · when:holder-acts · effect:damage · ending:duration | Double; then 2d8 cold per auditory action or cast at rank 2 | `frozen-lungs.json` | ✅ | Critical failure: Demoralize cost `2d8` cold | Critical failure: Demoralize cost `2d8` cold |
| VS-206g | "Heightened (+2) The initial cold damage increases by 2d8, and on a failure or critical failure, the cold damage whenever the target performs an auditory action or Casts a Spell increases by 1d8" | scaling:dice-per-rank · effect:damage | Rank 4: 4d8, and the failure's rider 2d8 | `frozen-lungs.json` | ✅ | Rank 4 failure: Demoralize cost `2d8` cold. Control: rank 2, `1d8` | Rank 4 failure: Demoralize cost `2d8` cold. Control: rank 2, `1d8` |

### VS-207 · Sigil

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-207a | "You harmlessly place your unique magical sigil, which is about 1 square inch in size, on the targeted creature or object" | when:cast · reach:single · reach:object · effect:gm-note | The touched creature or object carries the caster's sigil | | ☐ | |
| VS-207b | "The mark can be visible or invisible, and you can change it from one state to another by using an Interact action to touch the target" | economy:granted-action · effect:gm-note | A note: switching the mark visible or invisible is the table's | | ☐ | |
| VS-207c | "The mark can be scrubbed or scraped off with 5 minutes of work" | effect:gm-note | A note: scrubbing the mark off is the table's | | ☐ | |
| VS-207d | "If it's on a creature, it fades naturally over the course of a week" | ending:duration | On a creature the sigil lasts a week | | ☐ | |
| VS-207e | "Heightened (3rd) The sigil instead fades after 1 month" | scaling:from-rank · ending:duration | Rank 3: a month | | ☐ | |
| VS-207f | "Heightened (5th) The sigil instead fades after 1 year" | scaling:from-rank · ending:duration | Rank 5: a year | | ☐ | |
| VS-207g | "Heightened (7th) The sigil never fades" | scaling:from-rank · ending:permanent | Rank 7: the sigil has no end | | ☐ | |

### VS-208 · Bind Undead

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-208a | "With a word of power, you seize control of the target" | when:cast · reach:single · reach:filtered · ending:duration | Only a mindless undead of level up to the rank is bound, for a day | | ☐ | |
| VS-208b | "It gains the minion trait" | effect:trait-gained | The target gains the minion trait | | ☐ | |
| VS-208c | "If you or an ally uses any hostile actions against the target, the spell ends" | ending:hostile-action | A hostile action by the caster or an ally against it ends the spell | | ☐ | |

### VS-209 · Blood Duplicate

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-209a | "This spell deals you 1 piercing damage as you shape a magical duplicate of the target from your blood" | when:cast · reach:self · effect:damage | The caster takes 1 piercing damage | | ☐ | |
| VS-209b | "you can't cast this spell if you don't have blood" | economy:requires · reach:filtered | A caster without blood is refused the cast | | ☐ | |
| VS-209c | "This spell can't duplicate an item made of precious materials, or materials with a rarity of uncommon or higher" | reach:object · reach:filtered · effect:gm-note | A note: whether the object's material qualifies is the table's | | ☐ | |
| VS-209d | "If you're ever more than 5 feet from the duplicate, the spell's duration immediately ends" | ending:out-of-range | The caster more than 5 ft from the duplicate ends the spell | | ☐ | |
| VS-209e | "The Perception DC to recognize the duplicate as false using any sense except touch is equal to 10 + your spellcasting ability modifier + your Crafting proficiency bonus" | effect:info · effect:gm-note | The DC to see through the fake is worked out and shown | | ☐ | |
| VS-209f | "When the spell ends, the item collapses into a puddle of blood that quickly evaporates" | effect:destroy | The duplicate is gone when the spell ends | | ☐ | |

### VS-210 · Cradle Aloft

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-210a | "You temporarily release gravity's hold on an object, allowing you to let go of it without dropping it to the floor" | when:cast · reach:object · ending:duration | The held object floats by the caster for a minute | | ☐ | |
| VS-210b | "The object floats next to you in your space, following you if you move" | effect:gm-note | A note: the object travelling with the caster is the table's | | ☐ | |
| VS-210c | "You can Interact to retrieve the object on your turn as a free action" | economy:granted-action · economy:action-cost | Taking the object back costs the caster a free action | | ☐ | |
| VS-210d | "If you're within reach of another creature, that creature can spend a single action with the attack trait to attempt an Athletics check against your spell DC, retrieving the object out of the air on a success" | economy:granted-action · check:skill | A creature in reach rolls Athletics against the spell DC to snatch it | | ☐ | |
| VS-210e | "The creature must have a free hand to attempt this check" | economy:requires | Only a creature with a free hand may try | | ☐ | |
| VS-210f | "The spell ends if a creature successfully retrieves the object" | ending:spent | A successful snatch ends the spell | | ☐ | |
| VS-210g | "If the object is floating when the spell ends, it falls" | effect:gm-note | A note: the object dropping at the end is the table's | | ☐ | |

### VS-211 · Detect Creator

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-211a | "You examine the remains or spiritual residue of a destroyed undead creature to locate that undead's creator" | when:cast · reach:object · reach:filtered | The cast takes a destroyed undead's remains as its target | | ☐ | |
| VS-211b | "If the creator is within range, you can sense the direction to them" | effect:info | The caster is told the creator's direction, if within a mile | | ☐ | |
| VS-211c | "If the creator is within 100 feet, you sense their presence within 100 feet, and the spell ends" | effect:info · ending:spent | Within 100 ft the caster is told so, and the spell ends | | ☐ | |
| VS-211d | "If there's lead or running water between you and the undead's creator, this spell can't locate them" | effect:gm-note | A note: lead or running water in between is the table's | | ☐ | |
| VS-211e | "This spell fails automatically if the undead doesn't have a specific creator or the specific creator isn't on the same plane" | effect:gm-note | A note: whether a creator exists on this plane is the table's | | ☐ | |

### VS-212 · Draw Ire

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-212a | "You deal 1d10 mental damage to the creature and cause it to take a -1 status penalty to attack rolls against creatures other than you" | when:cast · reach:single · effect:damage · effect:penalty | 1d10 mental, and a status penalty to attack anyone but the caster | | ☐ | |
| VS-212b | "The creature must attempt a Will saving throw" | check:save | The target saves Will from the card | | ☐ | |
| VS-212c | "Critical Success The target is unaffected" | check:save | Nothing | | ☐ | |
| VS-212d | "Success The target takes half damage and the penalty. The spell ends at the end of the target's next turn" | check:save · effect:damage · effect:penalty · ending:next-turn | Half damage, the -1 penalty until the end of its next turn | | ☐ | |
| VS-212e | "Failure The target takes full damage and the penalty" | check:save · effect:damage · effect:penalty · ending:duration | Full damage, the -1 penalty for a minute | | ☐ | |
| VS-212f | "Critical Failure The target takes double damage, and the status penalty is -2" | check:save · effect:damage · effect:penalty · ending:duration | Double damage, a -2 penalty for a minute | | ☐ | |
| VS-212g | "Heightened (+1) The damage increases by 1d10" | scaling:dice-per-rank · effect:damage | Rank 2 deals 2d10 | | ☐ | |

### VS-213 · Fated Healing

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-213a | "The targets regain 1d4 Hit Points at the end of each of their own turns while the spell is in effect" | when:turn-end · reach:up-to-n · effect:heal · ending:duration | Each of the two regains 1d4 at its own turn end, for 5 rounds | | ☐ | |
| VS-213b | "If a target uses a hostile action against the other target, the spell ends for the target that used the hostile action" | ending:hostile-action | A target hostile to the other loses the healing; the other keeps it | | ☐ | |
| VS-213c | "Heightened (+1) The targets regain an additional 1d4 Hit Points at the end of their own turns" | scaling:dice-per-rank · effect:heal | Rank 2: 2d4 at each turn end | | ☐ | |

### VS-214 · Friendfetch

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-214a | "You shoot out ephemeral, telekinetic strands that drag each target directly toward you" | when:cast · reach:up-to-n · effect:forced-move/pull | Each of up to two willing targets is pulled straight toward the caster | | ☐ | |
| VS-214b | "stopping in the closest unoccupied space to you in this path" | effect:forced-move/pull | The pull stops in the free space nearest the caster on its line | | ☐ | |

### VS-215 · Guiding Star

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-215a | "you call on the constellations of the night sky to guide a creature to the location where you've Cast the Spell" | when:cast · reach:single · ending:preparations | The target carries the guidance until the caster's next preparations | | ☐ | |
| VS-215b | "Each time the target views the stars, it receives a mental nudge toward your chosen location, though it isn't compelled to follow" | effect:gm-note | A note: the nudge toward the spot is the table's | | ☐ | |
| VS-215c | "The target can recognize you as the source" | effect:gm-note | A note: the target knowing who sent it is the table's | | ☐ | |
| VS-215d | "If the creature goes to another planet or plane, the spell's effects are suppressed, but they resume if the creature returns" | effect:suppress · effect:gm-note | A note: pausing it on another plane is the table's | | ☐ | |

### VS-216 · Secret Chest

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-216a | "the container can't contain any creatures" | reach:object · reach:filtered | A container holding a creature is refused | | ☐ | |
| VS-216b | "When you Cast this Spell, the container and all its contents are transported to a random location deep in the Ethereal Plane" | when:cast · reach:object · effect:banish | The container leaves the scene until recalled | | ☐ | |
| VS-216c | "Time passes normally for the container and its contents, and the environmental effects of the Ethereal Plane apply to it" | effect:gm-note | A note: the Ethereal's effects on the contents are the table's | | ☐ | |
| VS-216d | "it's possible for a creature on the Ethereal Plane to stumble upon the chest" | effect:gm-note | A note: someone finding the chest is the table's | | ☐ | |
| VS-216e | "You can Dismiss the spell to return the chest to your current location" | ending:dismiss · effect:teleport | Dismissing brings the chest back beside the caster | | ☐ | |
| VS-216f | "If the spell ends by any other means, the container is lost on the Ethereal Plane and you can no longer recall it with this spell" | ending:preparations · effect:banish | Reaching preparations without a Dismiss loses the chest for good | | ☐ | |

### VS-217 · Cozy Cabin

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-217a | "You shape a cabin 20 feet on each side and 10 feet high" | when:cast · reach:area/square · area:placed-only · area:lingering | A 20-ft square cabin placed in range, standing 12 hours | | ☐ | |
| VS-217b | "This cabin has the structure trait and the same restrictions as magic items that create structures" | effect:gm-note | A note: where a structure may stand is the table's | | ☐ | |
| VS-217c | "The interior is lit with a small magical light that you can light or extinguish at will using a Sustain action" | when:sustain · effect:light | Sustaining turns the cabin's light on or off | | ☐ | |
| VS-217d | "allows creatures inside it to withstand most hostile weather conditions" | when:while-inside · effect:gm-note | A note: shelter from the weather is the table's | | ☐ | |
| VS-217e | "incredible heat or cold, powerful storms, and winds of hurricane force or greater destroy the hut" | effect:destroy · effect:gm-note | A note: weather that destroys the hut is the table's | | ☐ | |
| VS-217f | "if you exit the hut, the spell ends" | ending:leaves-area | The caster leaving the cabin ends the spell | | ☐ | |
| VS-217g | "You can Dismiss the spell" | ending:dismiss | The caster can Dismiss the cabin | | ☐ | |

### VS-218 · Extract Poison

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-218a | "Attempt a counteract check against one poison you're aware of on or in an object you touch" | when:cast · reach:object · check:counteract | A counteract check against the object's poison | | ☐ | |
| VS-218b | "If you successfully counteract the poison, you negate the object's toxicity and transfer the poison into a weapon you are holding" | check:counteract · reach:weapon · economy:requires · effect:cleanse | On success the object is clean and the held weapon is coated | | ☐ | |
| VS-218c | "On your next successful attack with that weapon before the end of your next turn, you add 1d6 poison damage per level of the poison you counteracted" | when:strike-made · effect:strike-damage · ending:spent · ending:next-turn | The next hit by next turn's end adds 1d6 poison per poison level | | ☐ | |
| VS-218d | "On a critically failed attack roll, you lose the extracted poison from your weapon as normal" | when:strike-made · ending:spent | A critically failed attack wastes the coating | | ☐ | |

### VS-219 · Fishing Spot

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-219a | "After 10 minutes of fishing, you catch a magical fish; roll 1d8 to see which fish you caught" | when:cast · check:random-table | A d8 roll names the fish caught | | ☐ | |
| VS-219b | "The fish must be cooked and eaten (a process that takes about 30 minutes) within 1 hour of being caught" | effect:gm-note | A note: cooking and eating within the hour is the table's | | ☐ | |
| VS-219c | "the listed effect lasts for 1 hour after consumption" | ending:duration | The fish's bonus lasts an hour | | ☐ | |
| VS-219d | "Each fish can feed only a single creature" | reach:single | One eater gets the fish's bonus | | ☐ | |
| VS-219e | "Musical trout +2 status bonus to Performance checks Primordial bass +2 status bonus to Survival checks Ghoulfish +2 status bonus to Intimidation checks Burbling barbel +2 status bonus to Deception and Diplomacy checks Dashing dace +2 status bonus to Acrobatics checks Vigocarp +2 status bonus to Athletics checks to climb and swim Aggressive perch +2 status bonus to Athletics checks to disarm, grapple, reposition, shove, and trip Scholar salmon +2 status bonus to checks to Recall Knowledge" | check:random-table · effect:bonus | The fish rolled gives its own +2 status bonus | | ☐ | |

### VS-220 · Glimpse Weakness

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-220a | "The first ally that hits the target with a successful Strike deals additional precision damage equal to 1 + this spell's rank" | when:strike-received · reach:allies · effect:strike-damage · scaling:dice-per-rank | The first ally's hit adds 1 + rank precision damage | | ☐ | |
| VS-220b | "and then the spell ends" | ending:spent | That first hit ends the spell | | ☐ | |

### VS-221 · Metal Merged

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-221a | "For the duration of this spell, you can't drop your weapon" | when:cast · reach:weapon · economy:requires · effect:held-fast · ending:duration | The wielded metal weapon can't be dropped for a minute | `metal-merged.json` | ✅ | Dropping and stowing the caster's Club were refused. Control: once the effect ended, it dropped | Dropping and stowing the caster's Club were refused. Control: once the effect ended, it dropped |
| VS-221b | "you gain a +4 circumstance bonus to your Reflex DC against attempts to Disarm you" | reach:self · effect:bonus | +4 circumstance to Reflex DC against Disarm | `metal-merged.json` | ✅ | The patient's Disarm at the caster: DC 10 before, 14 with the effect | The patient's Disarm at the caster: DC 10 before, 14 with the effect |

### VS-222 · Threefold Aspect

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-222a | "Choose one when you Cast the Spell" | when:cast · reach:self · check:caster-choice · ending:preparations | The caster picks an age at the cast, until preparations | | ☐ | |
| VS-222b | "While the spell lasts, you can change the age to any of the three or to your natural age by Sustaining the spell" | when:sustain · check:caster-choice | Sustaining reopens the choice of age, the natural one included | | ☐ | |
| VS-222c | "This grants you a +4 status bonus to Deception checks to pass as the chosen age" | effect:bonus | +4 status to Deception to pass as that age | | ☐ | |
| VS-222d | "you can add your level as a proficiency bonus to these checks even if you're untrained" | effect:proficiency · scaling:from-level | Untrained, the caster still adds its level to those checks | | ☐ | |
| VS-222e | "unless a creature specifically uses a Seek action or otherwise carefully examines you, it doesn't get a chance to notice that you aren't at your true age" | effect:gm-note | A note: who gets a chance to notice is the table's | | ☐ | |
| VS-222f | "You can Dismiss this spell" | ending:dismiss | The caster can Dismiss it | | ☐ | |

### VS-223 · Phantom Crowd

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-223a | "A tightly packed crowd of humanoids appropriate to the area appear, facing you and agreeing loudly with anything you say" | when:cast · reach:area/burst · area:placed-only · area:lingering | A crowd placed in range stands for 10 minutes | `phantom-crowd.json` | ✅ | A 5-foot burst placed in range, sustained up to 10 minutes: the caster has a Sustain that lapses | A 5-foot burst placed in range, lasting 10 minutes |
| VS-223b | "A creature that touches a member of the crowd or makes a Seek action to examine the crowd can attempt to disbelieve your illusion" | check:disbelieve | A note: disbelieving on a touch or a Seek is the table's | `phantom-crowd.json` | ✅ | A creature that stepped in rolled Perception against DC 13: a natural 20 saw through it, a 1 was fooled, and neither rolled again. One that Sought within 30 feet rolled too. Control: a Seek 60 feet away, no roll | A note on the card, "Left to the table": disbelieving the crowd |
| VS-223c | "The crowd is difficult terrain for anyone who hasn't disbelieved the illusion" | area:lingering · effect:terrain · check:disbelieve | The crowd is difficult terrain, except to those who disbelieved | `phantom-crowd.json` | ✅ | Its terrain slowed the fooled creature and not the one who saw through it; both were slowed before | The area is difficult terrain to everyone; that a disbeliever ignores it is the table's |
| VS-223d | "When you spend 1 or more actions to cast a Composition Spell or to perform an activity that includes a Performance check, you can also Sustain this Spell as part of that action" | when:sustain · economy:action-cost | A composition or Performance action Sustains it too, at no cost | `phantom-crowd.json` | ✅ | Casting Courageous Anthem, a composition, Sustained the crowd; so did a Performance check. Control: Countless Eyes did not | The crowd has no Sustain: a composition or Performance cannot keep it |
| VS-223e | "Heightened (+1) The crowd occupies an additional 10-foot square in range" | scaling:area-per-rank · area:several | Rank 3 places one more 10-ft square in range | `phantom-crowd.json` | ✅ | Rank 3 placed two areas. Control: rank 2, one | A higher rank places no more squares |
| VS-223f | "It can overlap, but there's no additional effect in the overlapped squares" | area:several | Overlapped squares add nothing | `phantom-crowd.json` | — | Overlap adds nothing, so nothing to do | Overlap adds nothing, so nothing to do |

### VS-224 · Air Walk

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-224a | "The target can walk on air as if it were solid ground" | when:cast · reach:single · effect:elevation/lift · ending:duration | The target may stand and walk on air for 5 minutes | | ☐ | |
| VS-224b | "It can ascend and descend in this way at a maximum of a 45-degree angle" | effect:elevation/lift | Its height changes by at most the distance it moves across | | ☐ | |

### VS-225 · Allfood

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-225a | "You transform one object into an edible substance that any living creature can chew, swallow, and safely digest" | when:cast · reach:object · effect:gm-note | A note: the object becoming food is the table's | | ☐ | |
| VS-225b | "One bulk of allfood provides enough sustenance to feed one Medium creature for a day" | effect:gm-note | A note: how many it feeds is the table's | | ☐ | |
| VS-225c | "After 1 day, if no one has eaten the allfood, it reverts to its original form" | ending:duration | Uneaten allfood reverts after a day | | ☐ | |
| VS-225d | "Heightened (+1) Double the maximum bulk (to a maximum of 256 bulk at 10th level)" | scaling:dice-per-rank · reach:filtered | Rank 3 takes an object of up to 2 Bulk | | ☐ | |

### VS-226 · Animal Messenger

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-226a | "You offer food, and an ordinary Tiny animal within range approaches to eat it" | when:cast · reach:filtered · effect:gm-note | A note: which Tiny animal comes is the table's | | ☐ | |
| VS-226b | "You imprint the image, direction, and distance of an obvious place or landmark well known to you within the animal" | effect:gm-note | A note: the destination is the table's | | ☐ | |
| VS-226c | "You can also attach a small object or note up to light Bulk to it" | effect:gm-note | A note: the attached message is the table's | | ☐ | |
| VS-226d | "The spell ends after the message is delivered or after 24 hours, whichever comes first" | ending:duration · ending:spent | Ends on delivery or after 24 hours | | ☐ | |
| VS-226e | "If there are no Tiny wild animals in range, the spell is lost" | economy:requires · effect:gm-note | A note: no animal in range loses the spell | | ☐ | |

### VS-227 · Anticipate Peril

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-227a | "The target gains a +1 status bonus to its next initiative roll" | when:cast · reach:single · effect:bonus | +1 status to the target's next initiative roll | | ☐ | |
| VS-227b | "after which the spell ends" | ending:spent | Rolling initiative spends it | | ☐ | |
| VS-227c | "Heightened (+2) The status bonus increases by 1, to a maximum of +4 at 7th rank" | scaling:dice-per-rank · effect:bonus | Rank 3: +2; rank 7: +4 | | ☐ | |

### VS-228 · Artistic Recollection

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-228a | "You touch your finger to a blank surface and create an image of a person, place, or object" | when:cast · reach:object · effect:gm-note · ending:duration | A note: the painting is the table's, for a minute | | ☐ | |
| VS-228b | "must represent a subject the caster has seen in person or has studied extensively" | effect:gm-note | A note: whether the subject qualifies is the table's | | ☐ | |

### VS-229 · Augury

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-229a | "During the casting of this spell, ask about the results of a particular course of action" | when:cast · effect:gm-note | A note: the question is put to the GM | | ☐ | |
| VS-229b | "The spell can predict results up to 30 minutes into the future and reveal the GM's best guess among the following outcomes: good, bad, mixed (the results will be a mix of good and bad), and nothing (there won't be particularly good or bad results)" | effect:gm-note · effect:info | The GM answers good, bad, mixed or nothing | | ☐ | |
| VS-229c | "The GM rolls a secret flat" | check:flat-check · check:secret | A secret flat check is whispered to the GM | | ☐ | |
| VS-229d | "On a failure, the result is always" | effect:gm-note | A failed flat check makes the answer nothing | | ☐ | |
| VS-229e | "If anyone asks about the same topic as the first casting of augury during an additional casting, the GM uses the secret roll result from the first casting" | check:result-kept · check:secret | A repeat question reuses the first secret roll | | ☐ | |

### VS-230 · Breadcrumbs

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-230a | "The target leaves a glittering trail behind them that lasts for the spell's duration" | when:cast · reach:single · effect:gm-note · ending:duration | A note: the target's trail is the table's, for an hour | | ☐ | |
| VS-230b | "Heightened (2nd) The duration increases to 8 hours" | scaling:from-rank · ending:duration | Rank 2: 8 hours | | ☐ | |
| VS-230c | "Heightened (3rd) The duration increases to last until your next daily preparations" | scaling:from-rank · ending:preparations | Rank 3: until the caster's next preparations | | ☐ | |

### VS-231 · Claim Curse

| ID | Clause | Patterns | Must happen | Static check | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| VS-231a | "Choose a curse affecting the target that you don't already have" | when:cast · reach:single · check:caster-choice | The caster picks one of the target's curses it lacks | | ☐ | |
| VS-231b | "For 5 minutes, you're affected by the curse (at the same stage as the target, and it can't be changed, if applicable), and the target isn't" | reach:self · effect:affliction · effect:suppress · ending:duration | The caster carries the curse at its stage; the target's is paused | | ☐ | |
| VS-231c | "If the curse's duration ends before claim curse would, it ends as normal" | ending:with-condition | A curse that runs out first ends for good | | ☐ | |
| VS-231d | "when the spell's duration ends the curse's effects return to the target as normal" | ending:duration · effect:suppress | After 5 minutes the curse is back on the target | | ☐ | |
