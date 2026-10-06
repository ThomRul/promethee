## Responsiveness

- Wrap screens with scrollable content in a ScrollView. Screens whose root is a FlatList/FlashList must not add an outer ScrollView (the list is the scroll container), and full-bleed screens (camera, map, canvas) need neither
- Use `<ScrollView contentInsetAdjustmentBehavior="automatic" />` instead of `<SafeAreaView>` for smarter safe area insets
- `contentInsetAdjustmentBehavior="automatic"` should be applied to FlatList and SectionList as well
- Use flexbox instead of Dimensions API
- ALWAYS prefer `useWindowDimensions` over `Dimensions.get()` to measure screen size

