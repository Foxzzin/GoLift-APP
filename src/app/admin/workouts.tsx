import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

export default function AdminWorkoutsRemoved() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingHorizontal: 24, paddingTop: safeTop + 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <Pressable
          onPress={() => router.replace("/admin")}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.backgroundSecondary, justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name="information-circle-outline" size={32} color={theme.textSecondary} />
        </View>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", marginBottom: 6 }}>
          Secção removida
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          A área de Treinos Recomendados foi removida do painel admin.
        </Text>
      </View>
    </View>
  );
}
