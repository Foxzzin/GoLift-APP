import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { loadSavedServerIP, discoverServerAutomatically, SERVER_CONFIG } from "../services/server-config";
import ServerSetup from "./server-setup";
import "../styles/global.css";

export default function RootLayout() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasServerIP, setHasServerIP] = useState(false);

  useEffect(() => {
    async function checkServerConfig() {
      try {
        // Primeiro, tenta carregar IP guardado
        let savedIP = await loadSavedServerIP();
        
        if (!savedIP) {
          // Se não há IP guardado, tenta descobrir automaticamente
          console.log("Nenhum IP guardado. Tentando descobrir servidor...");
          savedIP = await discoverServerAutomatically();
          
          if (savedIP) {
            // Se encontrou, guarda para próximas vezes
            SERVER_CONFIG.setIP(savedIP);
          }
        }
        
        setHasServerIP(!!savedIP);
      } catch (error) {
        console.error("Erro ao verificar configuração do servidor:", error);
        setHasServerIP(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkServerConfig();
  }, []);

  if (isLoading) {
    return null;
  }

  // Se não há IP configurado, mostra a tela de configuração
  if (!hasServerIP) {
    return <ServerSetup onConfigured={() => setHasServerIP(true)} />;
  }

  return (
    <AuthProvider>
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
      </Stack>
    </AuthProvider>
  );
}
