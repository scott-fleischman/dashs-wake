# Game Design Spec: **Dash's Wake**

## 1. Game Summary

Create a 2D rhythm auto-runner platformer inspired by the basic gameplay style of Geometry Dash, but with original assets, original icons, original UI, original level themes, and a major unique feature: **music-based level generation**.

The player controls a geometric character that moves automatically through a side-scrolling level. The player jumps, flies, hits pads, uses orbs, avoids spikes, and reaches the end of the song-based level. Completing levels earns coins, keys, cosmetics, and unlocks harder levels.

The game should use a simple geometric art style with level-specific themes.

## 2. Core Gameplay Loop

The player loop is:

1. Choose an icon/cube.
2. Choose a level.
3. Character moves automatically through the level.
4. Player jumps, flies, and reacts to obstacles.
5. If the player hits a spike or deadly obstacle, the player dies and restarts the level.
6. If the player reaches the end, the player earns rewards.
7. Rewards unlock harder levels, new cosmetics, chests, gauntlets, and shop items.

Main player actions:

* Cube jumping
* Ship flying
* Hitting launch pads
* Hitting orbs
* Avoiding trap orbs
* Timing jumps to music
* Surviving until the end of the song

Failure rule:

* Hitting spikes or deadly hazards causes instant death.
* Main levels restart from the beginning.
* Main levels have no checkpoints.

## 3. Core Controls

For desktop:

* **Spacebar / left mouse click**: jump or fly upward
* **Escape**: pause
* **R**: restart level

For mobile, if supported:

* **Tap screen**: jump or fly upward
* **Pause button**: pause

Cube mode:

* Tap/click/space makes the cube jump.
* The cube is affected by gravity.
* The cube can land on platforms.

Ship mode:

* Holding input makes the ship rise.
* Releasing input makes the ship fall.
* Ship sections should begin easy, especially in Level 1.

## 4. Game Modes and Screens

## 4.1 Lobby / Main Menu Hub

The lobby is the main menu.

Buttons:

* Play / Start
* Generated Levels
* Gauntlets
* Chest Room
* Shop
* Icon Customizer
* Settings

The sketch should be interpreted as a simple menu layout with a large central play button and smaller buttons around it.

## 4.2 Play / Start Screen

The main play button opens the official level list.

Each official level should display:

* Level name
* Difficulty
* Song name
* Best percent
* Completion status
* Coins earned
* Key reward
* Locked/unlocked status

At launch, there should be **5 official levels**.

## 4.3 Generated Levels

The game should include a level generator.

The player should be able to:

1. Upload or choose a song.
2. Choose a difficulty.
3. Generate a level.
4. Play the generated level.
5. Optionally edit or regenerate the level later.

Generated levels are based on:

* Song beat
* Song sections
* Song intensity
* Song genre/theme
* Chosen difficulty

The generator should place obstacles that match the rhythm and intensity of the music.

Important legal note for public release:

* Uploaded songs should only be used locally unless the user has permission.
* Built-in songs should be royalty-free, original, or properly licensed.

## 4.4 Gauntlets

Gauntlets are themed sets of connected levels.

Design idea:

> A gauntlet works like a tour. The player completes one level, reaches a checkpoint, and then immediately starts the next level.

Rules:

* A gauntlet contains multiple themed levels.
* The player plays levels in sequence.
* There are checkpoints between gauntlet levels.
* After completing one gauntlet level, the next starts immediately.
* Completing a full gauntlet gives special rewards.

Example:

> Electric Gauntlet: Level 1 → checkpoint → Level 2 → checkpoint → Level 3 → final reward.

## 4.5 Chest Room

The chest room contains unlockable chests.

Players earn keys by beating levels.

Key types depend on difficulty:

| Difficulty | Key Reward    |
| ---------- | ------------- |
| Easy       | Easy Key      |
| Normal     | Normal Key    |
| Hard       | Hard Key      |
| Insane     | Insane Key    |
| Demon      | Demon Key     |
| Nightmare  | Nightmare Key |

Chests can reward:

* Icons
* Colors
* Ships
* Trails
* Coins
* Rare cosmetics

## 4.6 Shop

Players spend coins to buy:

* Cube icons
* Ship icons
* Colors
* Trails
* Level unlocks
* Gauntlet unlocks

## 4.7 Icon Customizer

Players can customize:

* Cube icon
* Ship icon
* Main color
* Secondary color
* Trail
* Possibly effects later

Icons should be original geometric designs. They can be based on squares, triangles, diamonds, circles, arrows, and abstract combinations of shapes.

## 5. Art Style

The base art style should be:

* Simple
* Geometric
* Clean
* Square-based
* Bright and readable
* Easy to recognize during fast movement

Levels can have different themes based on the song.

Examples:

| Song Feeling            | Level Theme             |
| ----------------------- | ----------------------- |
| Cheerful / fantasy      | Fantasy geometric level |
| Electric / energetic    | Neon electric level     |
| Space-like / electronic | Space level             |
| Dark / intense          | Void or nightmare level |
| Calm / smooth           | Floating abstract level |

The first five official levels should use a simple **cubey neon / Tron-like** visual style, but without copying Tron’s specific branding, logos, or recognizable designs.

The visual design should prioritize readability. Hazards must be clear.

## 6. Level Difficulty System

Official difficulties:

1. Easy
2. Normal
3. Hard
4. Insane
5. Demon
6. Nightmare

Generated levels also have sub-ranks inside each difficulty:

* Bronze
* Gold
* Diamond
* Void

Example generated difficulty labels:

* Easy Bronze
* Easy Gold
* Easy Diamond
* Easy Void
* Hard Bronze
* Hard Gold
* Hard Diamond
* Hard Void
* Demon Bronze
* Demon Gold
* Demon Diamond
* Demon Void

Interpretation:

* Main difficulty controls overall challenge.
* Sub-rank controls challenge within that difficulty.
* Bronze is the easiest version of that difficulty.
* Void is the hardest version of that difficulty.

## 7. Official Launch Levels

The game launches with **5 official levels**.

All first five levels use a simple cubey neon/electric visual style.

## Level 1: Intro Level

Purpose:

* Teach basic movement.
* Introduce cube jumping.
* Introduce easy ship flying.
* Use a simple electric song.

Mechanics:

* Cube mode
* Ship mode
* Spikes
* Gaps
* Small platforms
* Simple “do not jump here” timing moments

No orbs yet.
No launch pads yet.

Ship section:

* Open space
* Easy flying
* Wide safe area
* No tight tunnels

Rewards:

* Up to 100 coins
* Coins are earned by new best percent
* Completing 100% gives the full 100 possible progress coins
* Completion also gives the level’s key reward

## Level 2: Launch Pad Level

Adds:

* Launch pads

Purpose:

* Teach automatic bouncing from pads.
* Still mostly simple.
* More platform timing.

## Level 3: Orb Level

Adds:

* Orbs

Purpose:

* Teach the player to tap or activate orbs at the right time.
* Introduce simple orb timing.

## Level 4: Combination Level

Adds:

* More complicated combinations of spikes, pads, orbs, cube, and ship.

Purpose:

* Combine the mechanics from the first three levels.
* Introduce trickier timing.

## Level 5: Harder Combination Level

Adds:

* Harder versions of Level 4 patterns.
* More advanced combinations.
* Faster reactions.
* More dangerous traps.

Purpose:

* Act as the first serious challenge.

## 8. Obstacles and Mechanics

Required obstacles:

* Spikes
* Gaps
* Platforms
* Launch pads
* Orbs
* Trap orbs
* Ship sections

Spikes:

* Kill the player instantly.

Gaps:

* Player falls and dies if they miss the jump.

Platforms:

* Player can land on them.

Launch pads:

* Automatically launch the player when touched.

Orbs:

* Player must press input while touching/near the orb to activate it.
* Orbs can launch the player upward or alter movement.

Trap orbs:

* Some orbs should be dangerous.
* The player must avoid activating them.
* These create “trick” sections.

Ship portals:

* Change the player from cube mode to ship mode.

Cube portals:

* Change the player from ship mode back to cube mode.

## 9. Music Sync

Levels should sync with music.

Level generation should analyze:

* Beat positions
* Strong beats
* Song sections
* Intensity changes
* Repeated patterns
* Drops or climactic moments

Placement rules:

* Basic jumps should often land on beats.
* Launch pads should often appear on strong beats.
* Orbs should appear during more active sections.
* Ship sections can appear during smoother or flowing sections.
* Harder patterns should appear during intense sections.
* Easier patterns should appear during quieter sections.

The level should last exactly as long as the song.

When the song ends, the level ends.

## 10. Level Generator Requirements

The level generator should take these inputs:

* Song file or built-in song ID
* Chosen difficulty
* Chosen sub-rank for generated levels
* Optional theme, if manually selected
* Optional seed for repeatable generation

Generator process:

1. Analyze song length.
2. Detect beats.
3. Detect strong beats.
4. Split song into sections.
5. Estimate intensity for each section.
6. Choose visual theme based on genre/intensity or user choice.
7. Generate terrain.
8. Place obstacles according to difficulty.
9. Place mode changes, such as cube and ship sections.
10. Validate that the level is playable.
11. Save generated level.

The generator should avoid impossible levels unless the difficulty is intentionally extreme.

The generator should include a simple playability check:

* The cube must be able to clear jumps.
* Platforms must be reachable.
* Ship sections must have enough space.
* Required orbs must be reachable.
* Deadly traps must be avoidable.

## 11. Rewards and Progression

Players earn:

* Coins
* Keys
* Icons
* Colors
* Ships
* Trails
* Level unlocks
* Gauntlet unlocks

## 11.1 Coin System

Coins are earned by reaching new best percent in a level.

Rule:

> The player earns one coin for each new percent reached for the first time in that level.

Example:

* First attempt reaches 1%.

  * Player earns 1 coin.
* Later attempt reaches 50%.

  * Player earns 49 more coins.
* Later attempt reaches 100%.

  * Player earns 50 more coins.
* Total possible progress coins from that level: 100.

This prevents infinite coin farming because repeated progress already reached does not give more coins.

## 11.2 Completion Rewards

When a player completes a level, they receive:

* Remaining percent coins up to 100
* A key based on difficulty
* Possible bonus coins
* Possible cosmetic unlock
* Progress toward unlocking harder levels

## 11.3 Unlocking Harder Levels

Harder official levels unlock through progress.

Example unlock rules:

| Unlock                 | Requirement                     |
| ---------------------- | ------------------------------- |
| Level 2                | Complete Level 1                |
| Level 3                | Complete Level 2                |
| Level 4                | Complete Level 3                |
| Level 5                | Complete Level 4                |
| First Gauntlet         | Complete Level 2                |
| Hard Generated Levels  | Complete Level 3                |
| Demon Generated Levels | Complete Level 5 or spend coins |

Shop unlocks may also allow players to buy access to some generated level categories or cosmetic items.

## 12. Data Structures

Use data objects similar to these.

## Player Profile

```json
{
  "coins": 0,
  "unlockedLevels": ["level_1"],
  "completedLevels": [],
  "bestPercents": {
    "level_1": 0
  },
  "keys": {
    "easy": 0,
    "normal": 0,
    "hard": 0,
    "insane": 0,
    "demon": 0,
    "nightmare": 0
  },
  "ownedIcons": ["default_cube"],
  "ownedShips": ["default_ship"],
  "ownedColors": ["blue", "white"],
  "ownedTrails": ["default_trail"],
  "selectedCube": "default_cube",
  "selectedShip": "default_ship",
  "selectedPrimaryColor": "blue",
  "selectedSecondaryColor": "white",
  "selectedTrail": "default_trail"
}
```

## Level

```json
{
  "id": "level_1",
  "name": "First Wake",
  "type": "official",
  "difficulty": "easy",
  "subRank": null,
  "songId": "song_1",
  "theme": "neon_cubes",
  "lengthSeconds": 90,
  "isUnlocked": true,
  "hasCheckpoints": false,
  "rewardKey": "easy",
  "maxProgressCoins": 100
}
```

## Generated Level

```json
{
  "id": "generated_001",
  "name": "Generated Wake",
  "type": "generated",
  "difficulty": "hard",
  "subRank": "gold",
  "songId": "uploaded_song_001",
  "theme": "space",
  "seed": 12345,
  "lengthSeconds": 120,
  "hasCheckpoints": false,
  "maxProgressCoins": 100
}
```

## Gauntlet

```json
{
  "id": "gauntlet_1",
  "name": "Electric Wake Gauntlet",
  "theme": "electric",
  "levels": ["gauntlet_1_level_1", "gauntlet_1_level_2", "gauntlet_1_level_3"],
  "checkpointBetweenLevels": true,
  "finalReward": {
    "coins": 300,
    "icon": "electric_cube"
  }
}
```

## 13. Minimum Viable Product

Build the first version with:

* Main menu/lobby
* Icon selection
* 5 official levels
* Cube movement
* Ship movement
* Spikes
* Platforms
* Launch pads
* Orbs
* Death and restart
* Level completion
* Percent tracking
* Coin rewards by new best percent
* Basic shop
* Basic chest room
* Basic gauntlet mode
* Simple level generator using beats and difficulty

## 14. AI Coding Engine Instructions

Build the game as a 2D side-scrolling rhythm platformer.

The player object should move automatically to the right at a fixed or level-defined speed. The camera follows the player. The player can jump in cube mode and fly in ship mode. Collision with deadly hazards restarts the level. Completing the level awards coins and progression.

Do not use Geometry Dash assets, names, UI, icons, sounds, or copyrighted level designs. Create original placeholder assets using geometric shapes.

Prioritize a working prototype over final art.

Implement in this order:

1. Basic player movement
2. Cube jump physics
3. Auto-scroll camera
4. Platforms and spikes
5. Death and restart
6. Level completion
7. Percent progress tracking
8. Coin reward system
9. Ship mode
10. Launch pads
11. Orbs
12. Main menu and level select
13. Icon customizer
14. Chest room
15. Shop
16. Gauntlets
17. Level generator

## 15. Acceptance Criteria

The prototype is successful when:

* The player can select Level 1 from the menu.
* The cube moves automatically.
* The player can jump over spikes.
* Touching a spike restarts the level.
* The player can reach the end of the level.
* The game tracks best percent.
* The player earns coins only for new percent progress.
* The player can unlock Level 2 after completing Level 1.
* The player can enter ship mode.
* The player can use a launch pad.
* The player can activate an orb.
* The player can open the icon customizer.
* The player can see the chest room and shop.
* The game has a placeholder generated level created from song beat data or simulated beat data.

## 16. First Level Draft

Level name: **First Wake**

Theme:

* Simple cubey neon style
* Electric but not too intense
* Clean geometric background
* Blue, white, black, and glowing accents are acceptable, but final colors can change

Song:

* Simple electric song
* Exact song chosen later

Mechanics:

* Cube jumping
* Spikes
* Gaps
* Small platforms
* Easy ship section
* No orbs
* No launch pads

Difficulty:

* Easy

Rewards:

* 100 possible progress coins
* Easy key on completion
* Unlocks Level 2

Design feel:

* Simple
* Clear
* Not too hard
* Teaches the basic game
* Gives the player a satisfying first completion
