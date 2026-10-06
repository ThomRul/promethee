## Self-Critique Pass

After building or changing a screen, screenshot it and check it against these principles (from [Expo's design-principles guide](https://expo.dev/blog/how-to-apply-professional-design-principles-in-ai-app-development)). Each one maps to a system fix, not a local tweak:

- **Hierarchy / contrast** - is the most important element obviously first? Fix with `type` ramp steps, not ad-hoc font sizes.
- **Proximity / white space** - do related items sit closer than unrelated ones? Fix with `gap` + spacing tokens.
- **Repetition / unity** - do all corners, shadows, and accents match? If not, a value escaped the theme - move it in.
- **Alignment** - do edges share axes? Fix with consistent screen edge padding.

Recheck the rendered result after fixing a value; moving it into the theme does not itself fix the layout. If the same defect recurs across screens, fix the shared token or component. Also run the primary-task and content checks in `expo-native-ui`'s Behavior section; screenshots alone cannot verify interaction.

