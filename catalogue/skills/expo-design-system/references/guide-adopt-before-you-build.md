## Adopt Before You Build

In an app that already has screens, the first move is detection, not construction. Before writing any token file:

1. **Look for a declared system.** Check `package.json` for a styling library - NativeWind/Tailwind, Tamagui, Restyle, Unistyles, styled-components. Then look for a token file: `theme.ts`, `src/theme/`, `constants/theme.ts`, or `constants/Colors.ts` (the create-expo-app default).
2. **If one exists, it is the source of truth.** Extend it in its own idiom - its names, its scale, its storage format. Audit drift against that system, not against the examples below.
3. **If only de facto values exist** - the same greys and paddings repeated across screens, no theme file - there is no system yet. Those values are the input to the scales, not the authority: derive tokens from the most frequent ones, snapped to the 4-point grid (`references/audit.md` §5).
4. **Never introduce a second system beside an existing one.** A fresh `src/theme/` next to a Tamagui config is design-system drift, not adoption.

Only when nothing exists do the defaults below apply as written.

