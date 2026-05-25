# Dash's Wake: Playable TDD Implementation Plan

## Goal

Deliver the game in small vertical slices. Every completed slice must leave a
browser-playable build with an observable improvement, rather than a collection
of disconnected systems.

The first release target is the prototype defined by `game-spec.md`: Level 1 is
playable from a menu, rewards and unlocks work, all authored mechanics can be
demonstrated across five official levels, supporting rooms are reachable, and a
generated level can be created from simulated beat data.

## Spec Review and Decisions

The specification is internally usable, with these decisions needed before
coding:

| Topic | Decision for the prototype | Reason |
| --- | --- | --- |
| Platform | Desktop-first browser game; make pointer input compatible with future touch support. | The requested controls and simple geometric rendering fit a web build, while mobile is conditional. |
| Level 1 mechanics | Level 1 contains cube play, hazards, platforms, a gap, and an easy ship segment; it does not contain pads or orbs. | This reconciles the Level 1 draft with the overall acceptance criteria. |
| Launch pads and orbs | Demonstrate floor pads in Level 2 and airborne orbs over spike runs in Level 3; use Levels 4 and 5 for combinations and visible lure-orb traps. | Matches the authored level progression and keeps trap consequences readable. |
| Music dependency | Bundle five loop variants from Fupi's CC0 `Melodic EDM Loops` OpenGameArt pack for the official courses. | Supplies freely downloadable electronic music with clear redistribution rights and small assets. |
| Level completion timing | Expanded official courses use integer loop durations from their selected track; uploaded creator songs initially place the finish gate at song duration. | Preserves the requirement that level length is controlled by its music while allowing explicit authored adjustment. |
| Progress coins | Award the positive difference between newly reached whole percent and stored best percent, including attempts ending in death. Cap progress coins at 100 per level. | Implements "one coin for each new percent reached" without farming. |
| Completion rewards | Award the level key and unlock effects once on first completion. | Prevents repeat completion from farming keys. |
| Main-level checkpoints | None; death or `R` returns the run to 0 percent. Persist earned progress and unlocks. | Matches the failure and reward rules. |
| Generator and creator scope | Retain seeded generation and local audio analysis, and add a song-backed creator with a piece palette and authored finish point. | Supports both automatic and hand-authored player levels without uploading user audio. |
| Visual assets | Draw original geometric shapes and neon palettes in code; do not import reference-game assets or designs. | Satisfies the originality requirement and keeps iteration fast. |

Items intentionally deferred until after prototype acceptance: full settings,
advanced level editing/regeneration tools, robust audio feature analysis, content balancing,
production cosmetics/catalogs, and mobile layout polish.

Inputs still needed before production content ships: final official level
names/difficulties beyond First Wake,
shop pricing and chest loot tables, and the cosmetic/gauntlet art catalog. None
blocks the placeholder-driven prototype.

## Recommended Technical Shape

Use a TypeScript web application built with Vite. Use Phaser for scenes,
rendering, input, audio/camera integration, and draw only original geometric
graphics. Use Vitest for deterministic logic tests and Playwright for browser
journey tests.

Keep game rules independent from Phaser:

```text
src/
  core/          deterministic simulation, collisions, rewards, unlocks, generation
  content/       authored levels, beat maps, item and reward definitions
  game/          Phaser scenes, rendering, input/audio/camera adapters
  ui/            menu, level select, rooms, customization overlays
  persistence/   versioned local profile repository
tests/
  unit/          simulation, progression, generation rules
  integration/   content and persistence contracts
  e2e/           browser-visible playable journeys
```

Core simulation accepts explicit elapsed time and input state. It must not read
wall-clock time, DOM state, or local storage directly. This permits exact tests
for jumps, deaths, beats, rewards, and generated output without making browser
rendering the test oracle.

Persist a versioned player profile in `localStorage` for the prototype. Keep
generated-level metadata serializable. Introduce IndexedDB only when an uploaded
audio file needs local binary storage.

## Red-Green-Refactor and Git Protocol

Implementation happens on a `codex/` feature branch. For each TDD cycle:

1. **Red:** add the smallest failing automated test that expresses the next
   user-observable behavior. Run its narrow test command and confirm it fails
   for the expected reason. Commit it as
   `test(chunk-N): <behavior> [red]`.
2. **Green:** implement only enough production code/content to satisfy that
   test. Run the narrow test and the currently affected suite. Commit the
   passing change as `feat(chunk-N): <behavior> [green]`.
3. **Refactor:** remove duplication, clarify types/content data, or improve
   boundaries while all tests remain green. Run the affected suite again and
   commit real cleanup as `refactor(chunk-N): <cleanup> [green]`.

Do not merge or hand off a branch whose tip is a red commit. If review finds
that no refactor is justified in a cycle, record that in the slice verification
notes rather than creating empty commits or unnecessary code movement.

The committed `docs/` directory is the GitHub Pages distribution for this
branch. Before every commit, run `npm run build` and stage the regenerated
`docs/` output with the source change, including red test commits. Do not edit
files in `docs/` directly.

At the end of each playable chunk, run the full unit/integration suite and its
browser smoke journey, then create a small checkpoint commit only when it adds
useful content such as updated fixtures or acceptance notes. The ordinary green
or refactor commit should otherwise be the chunk boundary.

## Playable Chunks

### Chunk 0: Walking Skeleton

**Playable result:** Opening the app shows an original geometric lobby with its
required navigation labels; Play is functional and destinations not yet built
are visibly marked as coming later. Selecting Play enters a visible empty
practice lane that runs and can be exited.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 0.1 | App smoke test expects lobby heading, required destination labels, and Play action. | Initialize Vite/TypeScript/Phaser, test harnesses, and a lobby scene with Play plus honest destination placeholders. | Separate DOM shell from scene setup. |
| 0.2 | Browser test expects Play to enter a running practice scene and `Escape` to return/pause. | Add scene routing, pause overlay, keyboard/pointer input adapter, and simple original graphics. | Centralize scene identifiers and controls. |

**Exit gate:** `npm test`, `npm run test:e2e`, and `npm run build` pass; a
person can navigate from lobby to the practice lane and does not encounter a
nonfunctional button presented as complete.

### Chunk 1: First Wake Core Run

**Playable result:** From level select, Level 1 can be started as a cube, jumped
through an initial hazard course, killed by spikes or gaps, restarted, and
finished.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 1.1 | Simulation test expects fixed horizontal motion and grounded cube jump under gravity. | Add deterministic world tick, player body, platforms, and jump input. | Isolate physics constants in a level/rules config. |
| 1.2 | Collision tests expect safe landings and spike/gap deaths. | Add platform resolution, deadly hazards, fall bounds, and reset run state. | Express collisions with typed level entities. |
| 1.3 | Journey test expects `R` restart, death restart, percent display, and finish at course end. | Render Level 1 course, camera follow, HUD, completion screen, and restart controls. | Keep scene presentation separate from simulation events. |
| 1.4 | Content contract expects Level 1 to have no pad/orb entities and valid reachable starter segments. | Author the initial cube portion of First Wake with placeholder beat timing. | Add level schema validation utilities. |

**Exit gate:** A player can start First Wake, jump its cube section, die and
restart without reloading the page, and reach a completion screen.

### Chunk 2: Persistent Progression

**Playable result:** Attempts update best percent and coins; completing Level 1
awards one Easy key and unlocks Level 2 in the level list across reloads.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 2.1 | Reward tests expect only newly crossed integer percentages to add coins, capped at 100. | Add profile model and progress award reducer. | Make award events immutable and replayable. |
| 2.2 | Completion tests expect one key and Level 2 unlock only on first Level 1 completion. | Add completion reducer and official unlock rules. | Data-drive unlock requirements. |
| 2.3 | Browser test expects best percent, coins, completion, key, and lock state after reload. | Add versioned local profile repository and level-select status UI. | Provide resettable persistence adapter for tests. |

**Exit gate:** The critical progression acceptance criteria are demonstrable
without developer tools and cannot be farmed by repeating known progress.

### Chunk 3: Level 1 Ship Lesson

**Playable result:** First Wake now includes its specified wide, forgiving ship
section and a return to cube mode before completion.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 3.1 | Simulation tests expect ship portals to change mode and held/released input to rise/fall. | Add mode state, portals, and ship motion. | Use per-mode movement strategies. |
| 3.2 | Content/playability tests expect a wide safe ship corridor with cube and ship portals. | Extend First Wake content with the beginner ship segment. | Add minimum-clearance content validators. |
| 3.3 | Journey test completes Level 1 through both modes. | Render portals and ship icon, wire held input, adjust camera/HUD. | Share player style configuration across modes. |

**Exit gate:** Level 1 fulfills the First Level Draft and remains finishable by
a new player using only the stated controls.

### Chunk 4: Level 2 Launch Pads

**Playable result:** An unlocked Level 2 teaches automatic launch pads in a
mostly simple route.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 4.1 | Simulation test expects contact with a launch pad to impart its configured upward impulse once. | Add pad entities and activation events. | Share impulse application between movement mechanics. |
| 4.2 | Content test expects five official level metadata records and Level 2 pads but no required orb timing. | Add official level catalog and author Level 2. | Separate catalog metadata from course geometry. |
| 4.3 | Journey test unlocks, selects, and completes a visible pad sequence. | Render pads and connect Level 2 to selection/progression. | Consolidate mechanic legend/tutorial cues. |

**Exit gate:** Level 2 is unlocked through Level 1 completion and visibly
demonstrates launch-pad play.

### Chunk 5: Level 3 Orb Timing

**Playable result:** Level 3 teaches input-activated safe orbs and can be
completed through timed activations.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 5.1 | Simulation tests expect an orb to activate only during its contact window and only with input. | Add safe orb entities and activation-window events. | Normalize interactable trigger handling. |
| 5.2 | Content test expects Level 3 reachable required-orb sequences and appropriate unlock metadata. | Author Level 3 and add a simple reachability validator for required orbs. | Represent expected route annotations in content. |
| 5.3 | Journey test activates an orb and finishes the lesson section. | Render orb state/cues and add the Level 3 scene route. | Unify tutorial messaging. |

**Exit gate:** The acceptance criterion for orb activation is proven in a
playable official level.

### Chunk 6: Full Official Set and Trap Mechanics

**Playable result:** All five launch levels are selectable as unlocked, with
Levels 4 and 5 combining prior mechanics and Level 5 introducing avoidable trap
orbs.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 6.1 | Journey test expects activating a lure orb to launch the player into visible ceiling spikes while bypassing it is safe. | Author ordinary airborne impulse orbs with readable trap geometry. | Keep failure attributable to visible collision rather than hidden trigger effects. |
| 6.2 | Content validators expect Levels 4 and 5 to combine required mechanics and preserve unlock chain. | Author expanded combination courses timed to bundled CC0 EDM loops and reward keys. | Extract reusable authored pattern fragments only if duplication is real. |
| 6.3 | Browser journeys complete/unlock the official progression and show all status fields. | Complete list UI, completion/reward wiring, and difficulty presentation. | Audit UI state derivation from profile/content data. |

**Exit gate:** Five official levels exist; each new mechanic appears at the
intended learning point; trap outcomes are visible in course geometry.

### Chunk 7: Customizer, Shop, and Chest Room

**Playable result:** The lobby links to a functioning icon customizer, a minimal
shop purchase, and a key-consuming chest with deterministic prototype rewards.
Selected cosmetics are visible during a run.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 7.1 | Inventory tests expect owned/selected cosmetics validation and a purchased item to debit coins once. | Add catalog, purchase reducer, and selection reducer. | Generalize inventory item categories. |
| 7.2 | Chest tests expect a key to be consumed once and a deterministic unopened chest reward to be granted. | Add prototype chest definitions and open-chest reducer. | Make reward grants share completion award logic. |
| 7.3 | Browser journeys open each room, select/purchase/open an item, and display the equipped design in gameplay. | Build minimal room screens and cosmetic rendering. | Reuse cards/buttons and profile presentation. |

**Exit gate:** Icon Customizer, Shop, and Chest Room are reachable and their
three economy/customization interactions persist across reload. Gauntlets and
Generated Levels become active in their subsequent chunks; Settings remains a
clearly labeled post-prototype placeholder.

### Chunk 8: Electric Gauntlet

**Playable result:** A basic three-course gauntlet starts from the lobby,
continues immediately between completed stages, checkpoints between stages, and
awards its final reward once.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 8.1 | State-machine tests expect sequential stages, between-stage checkpoints, and restart at the active stage. | Add gauntlet run state and stage transition logic. | Keep main-level no-checkpoint policy separate. |
| 8.2 | Reward tests expect final reward once and access after the configured unlock requirement. | Add Electric Wake Gauntlet content and profile grant. | Reuse unlock predicate model. |
| 8.3 | Browser journey enters and completes a short gauntlet sequence. | Add gauntlet selection/status UI and transition presentation. | Share official/generated/gauntlet launcher interface. |

**Exit gate:** The basic gauntlet rule set is playable without changing the
restart behavior of official levels.

### Chunk 9: Seeded Beat-Map Generator

**Playable result:** The Generated Levels screen creates a reproducible playable
level from simulated beat/section/intensity data, selected difficulty/sub-rank,
theme, and seed, then launches it.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 9.1 | Generator tests expect the same seed and input beat map to produce identical output and level duration. | Add generator inputs, seeded random source, beat-map fixtures, and output schema. | Isolate selection rules from random source. |
| 9.2 | Rule tests expect quiet/intense sections and difficulty/sub-rank to alter permitted patterns. | Add terrain/mechanic pattern selection driven by beat intensity. | Encode pattern capabilities declaratively. |
| 9.3 | Validator tests reject unreachable required actions or unsafe ship clearances and accept known playable fixtures. | Add conservative playability simulation/validation and regeneration retry bound. | Produce actionable validation failures. |
| 9.4 | Browser journey generates, lists, reopens, and completes a placeholder generated level. | Build generated-level UI and persist generated metadata locally. | Use the common level launcher/HUD path. |

**Exit gate:** The last prototype acceptance criterion is met using permitted
simulated beat data. Generation is deterministic, validated, and playable.

### Chunk 10: Audio-Synced Local Generation

**Playable result:** After the prototype is accepted, a player can choose a
permitted local audio file, obtain beat-derived generation inputs, play the
generated level synchronized to the audio clock, and keep the file local.

**TDD cycles**

| Cycle | Red test | Green implementation | Refactor focus |
| --- | --- | --- | --- |
| 10.1 | Analysis fixture tests expect duration, beat/strong-beat, section, and intensity extraction within declared tolerances. | Add Web Audio offline analysis behind an analyzer adapter. | Keep generation independent from analyzer implementation. |
| 10.2 | Synchronization tests expect simulation progress/end state to follow audio playback time, including pause/restart. | Add audio clock adapter and synchronized run lifecycle. | Centralize playable clock selection. |
| 10.3 | Browser journey imports a fixture audio file locally and launches a synchronized generated level. | Add local upload UX/storage policy messaging and IndexedDB audio storage if needed. | Separate binary storage from profile data. |

**Exit gate:** Music-driven generation meets the fuller specification without
uploading user audio; bundled official music is CC0 with provenance recorded.

## Acceptance Coverage

| Prototype acceptance criterion | First satisfied in |
| --- | --- |
| Select Level 1 from the menu; cube moves and jumps | Chunk 1 |
| Spike death restarts; player can reach level end | Chunk 1 |
| Best percent and non-repeatable progress coins | Chunk 2 |
| Completing Level 1 unlocks Level 2 | Chunk 2 |
| Player can enter ship mode | Chunk 3 |
| Player can use a launch pad | Chunk 4 |
| Player can activate an orb | Chunk 5 |
| Five official levels | Chunk 6 |
| Open icon customizer; see/use chest room and shop | Chunk 7 |
| Basic gauntlet mode | Chunk 8 |
| Placeholder level generated from beat data | Chunk 9 |
| Actual local song analysis/sync | Chunk 10, post-prototype |

## Verification Discipline

Each green/refactor checkpoint must run the narrow test introduced by its red
commit. Each playable chunk additionally runs:

```bash
npm test
npm run test:e2e
npm run build
```

`npm run build` regenerates the tracked `docs/` site with relative asset URLs
so the result can be served directly by GitHub Pages from the branch.

Browser journeys should use deterministic fixtures and reset profile storage.
Manual checks supplement rather than replace automated tests: play the newly
added lesson once with keyboard and once with pointer controls, verify hazard
readability at game speed, and confirm that restart/pause do not corrupt
progress.

## Starting Sequence

Begin implementation with Chunk 0 on a new implementation branch based on this
plan. The first red commit should assert that a player sees the lobby and can
activate Play; it should precede installing only the scaffolding needed to make
that path pass. Do not begin audio analysis, inventory breadth, or visual polish
until the relevant playable chunk is reached.
