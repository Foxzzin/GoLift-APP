import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../styles/theme";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";

export default function Settings() {
  const { user } = useAuth();
  const theme = useTheme();
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === "dark");
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Em produção, estes valores seriam guardados em AsyncStorage
  useEffect(() => {
    if (user?.id) {
      planoApi.getUserPlan(user.id).then(d => setPlanoTipo(d.plano)).catch(() => {});
    }
    // TODO: Carregar preferências guardadas do AsyncStorage
  }, [user]);

  const handleThemeToggle = (value: boolean) => {
    setIsDarkMode(value);
    setUseSystemTheme(false);
    // TODO: Guardar preferência em AsyncStorage
  };

  const handleSystemTheme = (value: boolean) => {
    setUseSystemTheme(value);
    if (value) {
      setIsDarkMode(deviceColorScheme === "dark");
    }
    // TODO: Guardar preferência em AsyncStorage
  };

  async function handleCancelSubscription() {
    if (!user?.id) return;
    Alert.alert(
      "Cancelar Subscrição",
      "Serás redirecionado para o portal Stripe onde podes gerir ou cancelar a tua subscrição.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            setCancelLoading(true);
            try {
              const data = await planoApi.createStripePortal(user.id);
              if (data.url) await WebBrowser.openBrowserAsync(data.url);
            } catch (err: any) {
              Alert.alert("Erro", err?.message || "Não foi possível abrir o portal. Tenta mais tarde.");
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>Definições</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {/* Tema */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 16 }}>
            Tema
          </Text>

          {/* Sistema */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="phone-portrait-outline" size={20} color={theme.text} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontWeight: "500" }}>Tema do Sistema</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Usar tema do dispositivo
                </Text>
              </View>
            </View>
            <Switch
              value={useSystemTheme}
              onValueChange={handleSystemTheme}
              trackColor={{ false: theme.border, true: theme.text }}
              thumbColor={theme.backgroundSecondary}
            />
          </View>

          {/* Modo Claro */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderColor: theme.border, borderWidth: 1, opacity: useSystemTheme ? 0.5 : 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="sunny-outline" size={20} color={theme.text} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontWeight: "500" }}>Modo Claro</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Fundo branco
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleThemeToggle(false)}
              disabled={useSystemTheme}
              style={{ width: 20, height: 20, borderRadius: 4, borderColor: !isDarkMode && !useSystemTheme ? theme.text : theme.border, borderWidth: 2, alignItems: "center", justifyContent: "center" }}
            >
              {!isDarkMode && !useSystemTheme && (
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.text }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Modo Escuro */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderColor: theme.border, borderWidth: 1, opacity: useSystemTheme ? 0.5 : 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="moon-outline" size={20} color={theme.text} />
              </View>
              <View>
                <Text style={{ color: theme.text, fontWeight: "500" }}>Modo Escuro</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Fundo preto
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleThemeToggle(true)}
              disabled={useSystemTheme}
              style={{ width: 20, height: 20, borderRadius: 4, borderColor: isDarkMode && !useSystemTheme ? theme.text : theme.border, borderWidth: 2, alignItems: "center", justifyContent: "center" }}
            >
              {isDarkMode && !useSystemTheme && (
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: theme.text }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscrição - apenas para utilizadores Pro */}
        {planoTipo === "pago" && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 16 }}>
              Subscrição
            </Text>
            <TouchableOpacity
              onPress={handleCancelSubscription}
              disabled={cancelLoading}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 12, padding: 16,
                borderColor: "#ef4444", borderWidth: 1,
                flexDirection: "row", alignItems: "center",
              }}
            >
              <View style={{
                backgroundColor: "#ef444422", width: 40, height: 40, borderRadius: 8,
                alignItems: "center", justifyContent: "center", marginRight: 12,
              }}>
                {cancelLoading
                  ? <ActivityIndicator size="small" color="#ef4444" />
                  : <Ionicons name="card-outline" size={20} color="#ef4444" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ef4444", fontWeight: "600" }}>Gerir Subscrição</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>Cancelar ou alterar o teu plano Pro</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Version */}
        <View style={{ marginTop: 24, paddingTop: 24, borderTopColor: theme.border, borderTopWidth: 1 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: "center" }}>
            GoLift v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
