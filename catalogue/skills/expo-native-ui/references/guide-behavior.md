## Behavior

- Use expo-haptics conditionally on iOS to make more delightful experiences
- Use views with built-in haptics like `<Switch />` from React Native and `@react-native-community/datetimepicker`
- When a Stack route has scrollable content, make the ScrollView (or FlatList) the first component inside the route, with `contentInsetAdjustmentBehavior="automatic"` set
- Use the `<Text selectable />` prop on text containing data that could be copied
- Consider formatting large numbers like 1.4M or 38k
- Never use intrinsic elements like 'img' or 'div' unless in a webview or Expo DOM component
- Every screen that loads data has four states (loading, error, empty, content) - never show the empty state while the first load is still resolving; the rules live in the `expo-data-fetching` skill
- On scrollable forms and search results, use `keyboardShouldPersistTaps="handled"` so controls receive the first tap and unhandled taps can dismiss the keyboard. Use `"always"` only when unhandled taps should also keep it open
- A form's primary action must never sit under the keyboard. For UI that tracks the keyboard's real frame, consulter les recettes clavier seulement si expo-animation est installé et si le besoin exige une animation avancée
- Every enabled control must perform its advertised action: search filters results, Save commits edits, and settings affect behavior. Empty handlers and success alerts are not implementations; local state is enough when the user requested a prototype
- For async saves, preserve drafts and handle pending/failure states per `expo-data-fetching`; do not dismiss a form before its save succeeds

Before calling a screen complete, walk through its primary task, including one failure and recovery when it loads or saves data. Check keyboard access and back/dismiss behavior. Try long titles, missing images, no search results, and large system text; required actions must remain reachable. Report what you exercised and what you could not run.

# Styling

Follow each platform's own design language: Apple Human Interface Guidelines on iOS, Material Design 3 on Android. Never dress one platform in the other's uniform - no FAB or ripple in iOS layouts; no hand-built iOS chrome (back-chevrons, large-title text, iOS-styled switches) on Android.

