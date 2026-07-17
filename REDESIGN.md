# saras-totey.com: FULL REDESIGN SPEC (replaces current approach)

This is a redesign, NOT a refine. Do not preserve the current layout. Rebuild the site so the scroll-world IS the site.

## CORE CONCEPT
The ENTIRE website is the scroll-world. There is no separate "regular webpage" around it. The 3D world fills the whole viewport. All textual/content information appears as overlays ON TOP of the world during scroll, positioned in the world's open negative space, neat and uncluttered. NO left sidebar. NO static content blocks sitting beside the world. The world is the page.

## HEADER / NAV
- NOT a bar. No solid background strip.
- Clear glass bubbles (iOS Apple frosted-glass aesthetic) floating at the top.
- Each bubble = navigation to a specific section/page of Saras's work (countersnipe, prediction ventures, econ.mom, local-ledger, contact, etc.).
- Clicking a bubble jumps the scroll-world to that island/scene (smooth animated flight to it).
- Glass style: backdrop-blur, subtle white border, translucent, soft shadow, like iOS control center chips.

## THE WORLD
- WAY bigger than current. Vast, sprawling, multiple islands/regions.
- WAY more scenes. Expand well beyond the current 9. Each project/section gets its own island/region with a distinct scene.
- Smooth, continuous, connected flight between scenes (no cuts). The current animation is NOT clean/smooth. This is the top priority to fix. Verify the scrub engine produces extremely smooth, clean motion (proper frame interpolation, no judder, no stutter, correct rAF scrubbing tied to scroll position).

## COLOR / AESTHETIC
- Shift the palette toward clear glass + pink/sakura. Translucent frosted-glass surfaces with sakura/pink accents.
- Clean, premium, airy. Not cluttered, not dark-heavy.

## TYPOGRAPHY
- SF Pro and Inter only. Simple, clean fonts. Use SF Pro where available, Inter as the universal fallback.

## ISLAND SKIP NAVIGATION
- User can SKIP between islands (jump nav) so they don't have to sit through every scene, especially the 3 trading-bot scenes with boring numbers. Let users hop past them.
- DEFAULT scroll order = the original order Saras specified before (the narrative flow he wanted). Skip is opt-in; default scrolling respects the original sequence.
- The skip nav can be the glass bubbles in the header, or an additional island-jump control.

## econ.mom AND local-ledger.net: FULL PAGES
- These currently have almost no feature. Build full, rich pages/sections for EACH.
- Use the research collected earlier (search your memory-core for econ.mom and local-ledger research, which was gathered in a prior session). Build complete, informative, well-designed pages from that research, not stubs.
- Each gets its own island/scene in the world with real content overlaid.

## MUSIC
- Music must PAUSE when muted and UNPAUSE when unmuted. Currently the mute behavior is broken. Fix it so mute = paused, unmute = resumed, no audio drift.

## UI BUTTONS
- All UI buttons (nav, skip, mute, etc.) = iOS Apple clear glass style. Consistent across the site.

## WHAT TO DO WITH EXISTING WORK
- The flight videos in public/world/flight/ (intro, countersnipe, prediction, ventures, contact + transitions) can be reused if they fit the bigger world, but the world needs MORE scenes and a bigger layout. Generate additional scenes with Higgsfield/scroll-world as needed.
- Discard the current layout/shell (sidebar, static blocks, bar header). Rebuild the shell so the world is full-viewport with glass-overlay content.

## VERIFICATION (before reporting done)
- Animation is extremely smooth and clean (scrub test, no judder).
- Mute/unpause works correctly.
- Header bubbles navigate to the right scenes.
- Skip nav works; default scroll order is the original narrative.
- econ.mom and local-ledger have full content.
- Fonts are SF Pro / Inter.
- Color palette is glass + sakura/pink.

## DO NOT USE /refine HERE
This is a fresh build directive. Rebuild, don't refine.
