## Named Failures: Native Slop

Use these names to recognize common mistakes when building and reviewing:

- **The Web Modal** - a custom centered dialog used for composing or picking. Prefer a native sheet (`formSheet`, `@expo/ui` BottomSheet) or menu; native confirmation alerts remain appropriate for consequential actions.
- **Everything's a Card** - every row and section in its own white rounded shadowed box. Use grouped lists; group with background and hairlines, not borders.
- **Emoji Iconography** - 🔥 ⚙️ ✨ as tab or button icons. SF Symbols on iOS, Material icons on Android.
- **The Purple-Gradient Hero** - a decorative gradient intro pushing the task below the fold. Lead task screens with useful content; retain a hero when it serves the requested experience.
- **The Spinner Blink** - a full-screen spinner between every state, or "No items yet" flashing during the first load. Every screen has four states (see `expo-data-fetching`).

Treat visual tells as review prompts, not blanket bans on cards, fonts, or branding. Fix the observable problem and respect the user's brief and existing design system. The full list of 20 and candidate grep checks are in `./references/native-slop.md`; use them to explain the problem and replacement when reviewing a screen.

