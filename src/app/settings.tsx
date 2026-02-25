import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../styles/theme";
import { SERVER_CONFIG, getDeviceIP } from "../services/server-config";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";

export default function Settings() {
  const { user } = useAuth();
  const theme = useTheme();
  const deviceColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === "dark");
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  const [deviceIP, setDeviceIP] = useState<string>("Carregando...");
  const [serverIP, setServerIP] = useState(SERVER_CONFIG.getIP());
  const [showIPInput, setShowIPInput] = useState(false);
  const [tempIP, setTempIP] = useState(serverIP);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Em produção, estes valores seriam guardados em AsyncStorage
  useEffect(() => {
    loadDeviceInfo();
    if (user?.id) {
      planoApi.getUserPlan(user.id).then(d => setPlanoTipo(d.plano)).catch(() => {});
    }
    // TODO: Carregar preferências guardadas do AsyncStorage
  }, [user]);

  async function loadDeviceInfo() {
    const ip = await getDeviceIP();
    setDeviceIP(ip);
  }

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

  const handleSaveIP = () => {
    if (!tempIP.trim()) {
      Alert.alert("Erro", "Introduz um IP válido");
      return;
    }
    SERVER_CONFIG.setIP(tempIP);
    setServerIP(tempIP);
    setShowIPInput(false);
    Alert.alert("Sucesso", `IP do servidor atualizado para: ${tempIP}`);
  };

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

        {/* Info */}
        <View style={{ marginTop: 32, paddingTop: 24, borderTopColor: theme.border, borderTopWidth: 1 }}>
          {/* Servidor */}
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 16 }}>
            Servidor
          </Text>

          {/* IP do Dispositivo */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 12, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="phone-portrait-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.text, fontWeight: "500", flex: 1 }}>IP do Dispositivo</Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, fontFamily: "monospace" }}>
              {deviceIP}
            </Text>
          </View>

          {/* IP do Servidor */}
          {!showIPInput ? (
            <TouchableOpacity
              onPress={() => setShowIPInput(true)}
              style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 12, borderColor: theme.border, borderWidth: 1 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ color: theme.text, fontWeight: "500" }}>IP do Servidor</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontFamily: "monospace", marginTop: 4 }}>
                    {serverIP}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 12, borderColor: theme.border, borderWidth: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "500", marginBottom: 12 }}>Alterar IP</Text>
              <TextInput
                style={{
                  backgroundColor: theme.backgroundTertiary,
                  borderColor: theme.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: theme.text,
                  marginBottom: 12,
                  fontFamily: "monospace",
                }}
                placeholder="ex: 192.168.1.11"
                placeholderTextColor={theme.textSecondary}
                value={tempIP}
                onChangeText={setTempIP}
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowIPInput(false);
                    setTempIP(serverIP);
                  }}
                  style={{ flex: 1, backgroundColor: theme.backgroundTertiary, borderColor: theme.border, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
                >
                  <Text style={{ color: theme.text, fontWeight: "500" }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveIP}
                  style={{ flex: 1, backgroundColor: theme.text, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
                >
                  <Text style={{ color: theme.background, fontWeight: "600" }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 12 }}>
            Utiliza o IP do dispositivo acima para ligar o servidor backend. Exemplo para emulador: 10.0.2.2
          </Text>
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
