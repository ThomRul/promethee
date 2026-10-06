import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-6">
        <Text accessibilityRole="header" className="text-2xl font-semibold text-foreground">
          Projet prêt
        </Text>
        <Text className="mt-3 text-foreground">Le socle est installé.</Text>
      </View>
    </SafeAreaView>
  );
}
