## Reusable Components

The theme controls values; components control structure. Shared primitives live in `src/components/` (see `expo-project-structure`).

### The component contract

Every design-system primitive defines, explicitly:

- **Variants** - visual intent: `primary`, `secondary`, `ghost`, `destructive`. Add a variant only when a real screen needs it.
- **Sizes** - `sm`, `md`, `lg`. Default `md`. Sizes map to spacing/typography tokens, never to fresh numbers.
- **States** - default, **pressed** (not hover - this is touch), disabled, loading. Handle pressed with a `Pressable` style function; never leave a tappable element without pressed feedback.
- **Style override** - accept a `style` prop and merge it **last**, so callers can adjust layout (margins, flex) without forking the component. Callers may override layout, not identity - a caller changing a button's colors is a signal the variant set is missing something.
- **Accessibility** - custom interactive primitives expose their role and disabled/busy/selected state as applicable. Text children can supply the label; icon-only controls and buttons that replace text with a spinner need an explicit label that remains available while loading. Verify labels on native controls too.

```tsx
// components/button.tsx
import { Pressable, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { colors, spacing, radius } from "@/theme";
import { ThemedText } from "./themed-text";

const variants = {
  primary: { backgroundColor: colors.systemBlue, color: colors.onTint },
  secondary: { backgroundColor: colors.separator, color: colors.label },
} as const;

const sizes = {
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
} as const;

export function Button({
  variant = "primary",
  size = "md",
  title,
  loading,
  disabled,
  style,
  onPress,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: variants[variant].backgroundColor,
          borderRadius: radius.md,
          borderCurve: "continuous",
          alignItems: "center",
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          ...sizes[size],
        },
        style, // caller overrides merge last
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variants[variant].color as string} />
      ) : (
        <ThemedText variant="headline" style={{ color: variants[variant].color }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}
```

### Composition over configuration

When a component's props start describing *content* (`leftIcon`, `subtitle`, `footerText`, `badgeCount`), stop adding props and accept `children` instead. A `Card` that renders `children` with token padding outlives any `Card` with twelve content props. Reserve props for the contract above: variant, size, state, style.

### When to extract - and when not to

Promote a view into `src/components/` when **all** of these hold:

1. It appears (or is about to appear) in **two or more screens**. Until then it stays colocated in `screens/<name>/` (see `expo-project-structure`).
2. It has a **nameable role** ("Card", "EmptyState", "Badge") - not "the thing on the profile screen".
3. Its API is **smaller than its implementation**. If the props would just re-expose every internal style, it isn't a reusable component yet - it's a screen fragment.

Promotion path: inline JSX → component in `screens/<name>/` → `src/components/`. Move one step at a time, when the trigger fires - never speculatively. Wrong abstractions cost more than duplication; a second copy of a view is cheaper than a primitive with a bad API.

Do **not** wrap platform components that already carry the design language (`Switch`, `DateTimePicker`, stack headers, `@expo/ui` views) just to route them through the system. Native styling *is* the design system for those.

