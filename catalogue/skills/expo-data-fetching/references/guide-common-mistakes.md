## Common Mistakes

**Wrong: No error handling**

```tsx
const data = await fetch(url).then((r) => r.json());
```

**Right: Check response status**

```tsx
const response = await fetch(url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

**Wrong: Storing tokens in AsyncStorage**

```tsx
await AsyncStorage.setItem("token", token); // Not secure!
```

**Right: Use SecureStore for sensitive data**

```tsx
await SecureStore.setItemAsync("token", token);
```

