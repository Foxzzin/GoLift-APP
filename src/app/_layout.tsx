import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { CommunitiesProvider } from "../contexts/CommunitiesContext";
import { useTheme } from "../styles/theme";
import { loadSavedServerIP } from "../services/server-config";
import ServerSetup from "./server-setup";
import "../styles/global.css";

export default function RootLayout() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasServerIP, setHasServerIP] = useState(false);

  useEffect(() => {
    async function checkServerConfig() {
      try {
        // Sempre descobre o servidor automaticamente (sem cache)
        const discoveredIP = await loadSavedServerIP();
        setHasServerIP(!!discoveredIP);
      } catch (error) {
        console.error("Erro ao descobrir servidor:", error);
        setHasServerIP(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkServerConfig();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Text style={{ color: "#ffffff", fontSize: 32, fontWeight: "bold", letterSpacing: 2 }}>GoLift</Text>
        <ActivityIndicator size="large" color="#687C88" />
        <Text style={{ color: "#808080", fontSize: 13 }}>A descobrir servidor na rede...</Text>
      </View>
    );
  }

  // Se não há IP configurado, mostra a tela de configuração
  if (!hasServerIP) {
    return <ServerSetup onConfigured={() => setHasServerIP(true)} />;
  }

  return (
    <AuthProvider>
      <CommunitiesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="server-setup" />
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="admin/_layout"
            options={{
              presentation: "modal",
              animation: "slide_from_right"
            }}
          />
          <Stack.Screen 
            name="workout/[id]" 
            options={{ 
              presentation: "fullScreenModal",
              animation: "slide_from_bottom"
            }} 
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              presentation: "card",
              animation: "slide_from_right"
            }}
          />
        </Stack>
      </CommunitiesProvider>
    </AuthProvider>
  );
}
