## The Theme

In an app without an existing system, all design tokens live under `src/theme/`. In a project without a `src/` folder (the default `create-expo-app` template has `app/`, `components/`, and `constants/` at the root), use the equivalent top-level location - typically `theme/` or the existing `constants/` - and keep the same file layout. Start small and split by token class as it grows:

```
src/theme/
  colors.ts       # see expo-native-ui "Colors" for the palette pattern
  spacing.ts
  typography.ts
  radius.ts
  shadows.ts
  motion.ts
  index.ts        # re-exports everything: import { spacing, type } from "@/theme"
```

A brand-new app can begin with a single `src/theme.ts` holding all of the objects below, then promote it to the folder form once any one class needs its own file (same promotion rule as components). Either way there is exactly **one** theme entry point - never two competing token files.

Rules that make a theme worth having:

- **Every repeated visual value is a token.** A literal that appears twice belongs in the theme.
- **Components import tokens; screens import components.** A screen file that imports `spacing` for layout padding is fine; a screen file redefining a button color is drift.
- **Never hardcode** hex colors, font sizes, or spacing multiples outside `src/theme/`. One-off values that are genuinely local (an icon's 17px optical nudge) may stay inline - with a comment saying why.

### Colors

Build the palette from platform semantic colors: `Color` from `expo-router` wrapped in `Platform.select`, centralized in `theme/colors.ts`. Semantic colors resolve on-device and adapt to light/dark automatically - prefer them for backgrounds, labels, and separators. (`expo-native-ui` "Colors" covers the full palette and rationale; the minimal version is:)

```tsx
// theme/colors.ts
import { Platform } from "react-native";
import { Color } from "expo-router";

export const colors = {
  label: Platform.select({
    ios: Color.ios.label,
    android: Color.android.dynamic.onSurface,
    default: "#000000",
  })!,
  secondaryLabel: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.dynamic.onSurfaceVariant,
    default: "#3c3c43",
  })!,
  separator: Platform.select({
    ios: Color.ios.separator,
    android: Color.android.dynamic.outlineVariant,
    default: "#c6c6c8",
  })!,
  systemBackground: Platform.select({
    ios: Color.ios.systemBackground,
    android: Color.android.dynamic.surface,
    default: "#ffffff",
  })!,
  systemBlue: Platform.select({
    ios: Color.ios.systemBlue,
    android: Color.android.dynamic.primary,
    default: "#007aff",
  })!,
  // Deliberately fixed: text on a tinted (accent) surface stays white in both modes.
  onTint: "#ffffff",
};
```

Add brand colors as explicit light/dark pairs only when the brand requires values the platform doesn't provide:

```tsx
// theme/colors.ts (brand additions)
import { useColorScheme } from "react-native";

const brandPalette = {
  light: { accent: "#5B21B6", accentContrast: "#FFFFFF" },
  dark: { accent: "#A78BFA", accentContrast: "#1E1B4B" },
} as const;

export function useBrandColors() {
  const scheme = useColorScheme();
  return brandPalette[scheme === "dark" ? "dark" : "light"];
}
```

Keep the brand set tiny (accent, accentContrast, maybe a tint per feature). Everything else stays semantic.

**Static-safe vs hook-only.** The two patterns above have different reach - keep the boundary explicit:

- Semantic/platform colors (`colors` above) are **static-safe**: they resolve on-device, so plain token files like `theme/typography.ts` can import them at module scope.
- Brand light/dark pairs are **hook-only**: `useBrandColors()` reads the color scheme at render time, so brand colors can only be applied inside components. A static token file cannot call the hook.
- Never mix the two in one file. If a static style (a `type` ramp step, a `variants` object) needs the brand accent, either apply the brand color in the component at render time, or wrap the pair in a static dynamic color (`DynamicColorIOS` on iOS) so it becomes static-safe.

### Spacing

One scale, based on a 4-point grid. Name steps by size, not by use:

```tsx
// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
```

- Use `gap` with spacing tokens for layout rhythm (`expo-native-ui` prefers gap over margin).
- Screen edge padding is `spacing.md` unless the design says otherwise - pick one and keep it.
- If a layout needs a value between steps, use the nearest step. The grid is the point.
- If the same in-between multiple of 4 keeps recurring (12 and 20 are common), add it to the scale as a named step instead of scattering literals. The audit whitelist must then include it too.

### Typography

Define named text styles, not raw font sizes. Mirror the platform ramp (Apple text styles) so sizes feel native:

```tsx
// theme/typography.ts
import { TextStyle } from "react-native";
import { colors } from "./colors";

export const type = {
  largeTitle: { fontSize: 34, fontWeight: "700", color: colors.label },
  title: { fontSize: 22, fontWeight: "600", color: colors.label },
  headline: { fontSize: 17, fontWeight: "600", color: colors.label },
  body: { fontSize: 17, fontWeight: "400", color: colors.label },
  subhead: { fontSize: 15, fontWeight: "400", color: colors.secondaryLabel },
  caption: { fontSize: 12, fontWeight: "400", color: colors.secondaryLabel },
} as const satisfies Record<string, TextStyle>;
```

If the project bundles static font files (one file per weight, loaded with `expo-font` or the config plugin), set weight via `fontFamily` names instead and omit `fontWeight` - otherwise iOS synthesizes the weight or falls back to the system font:

```tsx
headline: { fontSize: 17, fontFamily: "SFProRounded-Semibold", color: colors.label },
```

Expose them through one component so screens never touch `fontSize`:

```tsx
// components/themed-text.tsx
import { Text, TextProps } from "react-native";
import { type } from "@/theme";

export function ThemedText({
  variant = "body",
  style,
  ...props
}: TextProps & { variant?: keyof typeof type }) {
  return <Text style={[type[variant], style]} {...props} />;
}
```

Screen titles still come from the navigation stack header (`expo-native-ui` rule), so `largeTitle` is mostly for non-stack contexts.

**Dynamic Type.** Text scales with the user's system text-size setting (`allowFontScaling` is on by default). Use padding or `minHeight` around text so rows can grow, and check large accessibility text sizes. Let labels wrap or reflow before considering a per-element `maxFontSizeMultiplier` for constrained chrome; dense rows alone are not a reason to cap readable text. Never disable scaling app-wide with `allowFontScaling={false}`.

### Radius

```tsx
// theme/radius.ts
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999, // capsules
} as const;
```

Pair every non-capsule radius with `borderCurve: "continuous"` (per `expo-native-ui`).

### Shadows

Shadows are `boxShadow` strings (never legacy shadow/elevation props - see `expo-native-ui`). Two or three elevation levels are enough:

```tsx
// theme/shadows.ts
export const shadows = {
  card: "0 1px 2px rgba(0, 0, 0, 0.05)",
  raised: "0 4px 12px rgba(0, 0, 0, 0.10)",
  overlay: "0 8px 24px rgba(0, 0, 0, 0.18)",
} as const;
```

### Motion

Durations and shared spring/easing configs, so animations across the app feel related:

```tsx
// theme/motion.ts
export const motion = {
  fast: 150, // state feedback: press, toggle
  base: 250, // element transitions: enter/exit
  slow: 400, // large surfaces: sheets, screens
} as const;
```

Reanimated caveat: don't pass `Color`/`PlatformColor` token values into Reanimated styles - use static colors there (see `expo-native-ui`).

