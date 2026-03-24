import { Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { Redirect } from "expo-router";

export default function AdminLayout() {
  const theme = useTheme();
  const { user } = useAuth();

  // Permitir acesso total para Owner/Admin Manager (tipo 3)
  if (!user || (user.tipo !== 1 && user.tipo !== 3)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="communities" />
    </Stack>
  );
}
