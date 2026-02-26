import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";


export default function Login() {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preenche todos os campos");
      return;
    }

    setLoading(true);
    try {
      // 1) Teste de conectividade GET simples
      let healthOk = false;
      let healthErr = "";
      try {
        const h = await axios.get("http://13.48.56.98/api/health", { timeout: 10000 });
        healthOk = h.status === 200;
      } catch (e: any) {
        healthErr = `[${e.name}] ${e.message}`;
      }

      if (!healthOk) {
        Alert.alert(
          "Sem ligação ao servidor",
          `GET /api/health falhou:\n${healthErr}\n\nO Android pode estar a bloquear HTTP.`
        );
        setLoading(false);
        return;
      }

      // 2) Login real
      await login(email, password);
    } catch (error: any) {
      Alert.alert(
        `[${error.name || "Erro"}]`,
        `${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{
              width: 64,
              height: 64,
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              borderColor: theme.border,
              borderWidth: 1,
            }}>
              <Ionicons name="barbell" size={32} color={theme.text} />
            </View>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: theme.text }}>
              GoLift
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 14 }}>
              Bem-vindo de volta
            </Text>
          </View>

          {/* Formulário */}
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderColor: theme.border,
            borderWidth: 1,
          }}>
            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                Email
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.background,
                borderRadius: 10,
                borderColor: theme.border,
                borderWidth: 1,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                  placeholder="exemplo@email.com"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                Password
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.background,
                borderRadius: 10,
                borderColor: theme.border,
                borderWidth: 1,
                paddingHorizontal: 16,
              }}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Esqueceu password */}
            <TouchableOpacity 
              style={{ marginBottom: 24 }}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={{ color: theme.textSecondary, textAlign: "right", fontSize: 13 }}>
                Esqueceste a password?
              </Text>
            </TouchableOpacity>

            {/* Botão Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: theme.text,
                paddingVertical: 16,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={{ color: theme.background, fontWeight: "600", fontSize: 16 }}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            {/* Link Registo */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, paddingTop: 24, borderTopColor: theme.border, borderTopWidth: 1 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                Não tens conta?{" "}
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                    Criar conta
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
