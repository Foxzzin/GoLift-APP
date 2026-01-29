import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../styles/theme";
import { SERVER_CONFIG, getDeviceIP, discoverServerAutomatically } from "../services/server-config";

interface ServerSetupProps {
  onConfigured?: () => void;
}

export default function ServerSetup({ onConfigured }: ServerSetupProps) {
  const theme = useTheme();
  const [deviceIP, setDeviceIP] = useState<string>("");
  const [serverIP, setServerIP] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    loadDeviceIP();
  }, []);

  async function loadDeviceIP() {
    try {
      const ip = await getDeviceIP();
      setDeviceIP(ip);
      
      // Tenta carregar IP guardado
      const savedIP = await AsyncStorage.getItem("@server_ip");
      if (savedIP) {
        setServerIP(savedIP);
        SERVER_CONFIG.setIP(savedIP);
      } else {
        // Se não houver IP guardado, sugere o IP do dispositivo (sem o último octeto)
        // ex: se device é 192.168.1.100, sugere 192.168.1.
        const suggestedIP = ip.substring(0, ip.lastIndexOf(".") + 1);
        setServerIP(suggestedIP);
      }
    } catch (error) {
      console.error("Erro ao carregar IP:", error);
      setServerIP("192.168.1.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoDiscover() {
    try {
      setDiscovering(true);
      Alert.alert("Procurando...", "A procurar servidor na rede...");
      
      const foundIP = await discoverServerAutomatically();
      
      if (foundIP) {
        setServerIP(foundIP);
        Alert.alert("Servidor Encontrado!", `Servidor encontrado em: ${foundIP}`);
      } else {
        Alert.alert(
          "Servidor Não Encontrado",
          "Não foi possível encontrar o servidor. Tenta:\n1. Certificar-te que o servidor está ligado\n2. Ou introduz o IP manualmente"
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao procurar servidor");
    } finally {
      setDiscovering(false);
    }
  }

  async function handleContinue() {
    if (!serverIP.trim()) {
      Alert.alert("Erro", "Introduz o IP do servidor");
      return;
    }

    try {
      setSaving(true);
      // Guarda o IP
      await AsyncStorage.setItem("@server_ip", serverIP);
      SERVER_CONFIG.setIP(serverIP);
      
      // Chama callback se foi passado
      if (onConfigured) {
        onConfigured();
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao guardar configuração");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: "space-between" }}>
        {/* Header */}
        <View>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{ backgroundColor: theme.text + "20", width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="server-outline" size={32} color={theme.text} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.text, marginBottom: 8, textAlign: "center" }}>
              Configuração do Servidor
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center" }}>
              Configura o IP do servidor backend para continuar
            </Text>
          </View>

          {/* Device Info */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginBottom: 24, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="phone-portrait-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.text, fontWeight: "500", flex: 1 }}>IP do Dispositivo</Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, fontFamily: "monospace", paddingLeft: 28 }}>
              {deviceIP}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 12, paddingLeft: 28 }}>
              Isto é o IP do teu iPhone. O servidor deve estar na mesma rede Wi-Fi.
            </Text>
          </View>

          {/* Auto Discovery Button */}
          <TouchableOpacity
            onPress={handleAutoDiscover}
            disabled={discovering || saving}
            style={{
              backgroundColor: theme.text + "10",
              borderColor: theme.text,
              borderWidth: 2,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              marginBottom: 20,
              flexDirection: "row",
              justifyContent: "center",
              opacity: discovering || saving ? 0.6 : 1,
            }}
          >
            {discovering ? (
              <>
                <ActivityIndicator color={theme.text} style={{ marginRight: 8 }} size="small" />
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
                  Procurando servidor...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="search" size={16} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
                  Descobrir Automaticamente
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
            <Text style={{ color: theme.textSecondary, marginHorizontal: 12, fontSize: 12 }}>
              OU
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
          </View>

          {/* Server IP Input */}
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 8 }}>
              IP do Servidor (Manual)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: theme.text,
                fontSize: 16,
                fontFamily: "monospace",
                marginBottom: 8,
              }}
              placeholder="ex: 192.168.1.100"
              placeholderTextColor={theme.textSecondary}
              value={serverIP}
              onChangeText={setServerIP}
              keyboardType="decimal-pad"
              editable={!saving && !discovering}
            />
            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
              Qual é o IP do computador onde o servidor está a correr?
            </Text>
          </View>

          {/* Help Section */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, marginTop: 24, borderColor: theme.border, borderWidth: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: theme.text, marginBottom: 8, flexDirection: "row" }}>
              <Ionicons name="help-circle-outline" size={14} color={theme.text} /> Como encontrar o IP?
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 16 }}>
              1. No PC com o servidor, abre PowerShell{"\n"}
              2. Escreve: <Text style={{ fontFamily: "monospace", color: theme.text }}>ipconfig</Text>{"\n"}
              3. Procura por <Text style={{ fontFamily: "monospace", color: theme.text }}>IPv4 Address</Text> (ex: 192.168.1.xxx){"\n"}
              4. Cola esse IP aqui
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={saving || discovering}
          style={{
            backgroundColor: theme.text,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 24,
            opacity: saving || discovering ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={{ color: theme.background, fontSize: 16, fontWeight: "600" }}>
              Continuar
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
