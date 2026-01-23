import { Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";

export default function AdminLayout() {
  const { user } = useAuth();

  // Verificar se o utilizador é admin (tipo 1)
  if (!user || user.tipo !== 1) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0d1b2a" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="exercises" />
      <Stack.Screen name="workouts" />
    </Stack>
  );
}
