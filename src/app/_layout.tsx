import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { Platform, View, ActivityIndicator } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { CommunitiesProvider } from "../contexts/CommunitiesContext";
import { useTheme } from "../styles/theme";
import { loadSavedServerIP } from "../services/server-config";
import "../styles/global.css";

export default function RootLayout() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(theme.background);
      NavigationBar.setButtonStyleAsync("light");
    }
    // Aguardar descoberta do servidor antes de renderizar a app
    loadSavedServerIP()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [theme.background]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#687C88" />
      </View>
    );
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
          <Stack.Screen
            name="upgrade"
            options={{
              presentation: "card",
              animation: "slide_from_bottom"
            }}
          />
          <Stack.Screen
            name="ai-report"
            options={{
              presentation: "card",
              animation: "slide_from_right"
            }}
          />
          <Stack.Screen
            name="ai-plan"
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
