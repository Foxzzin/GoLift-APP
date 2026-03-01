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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../styles/theme";
import { authApi } from "../services/api";

type Step = "email" | "code" | "newPassword";

export default function ForgotPassword() {
  const theme = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Passo 1: Solicitar código
  async function handleRequestCode() {
    if (!email.trim()) {
      Alert.alert("Erro", "Introduz o teu email");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.requestPasswordReset(email);
      if (response.sucesso) {
        Alert.alert(
          "Código Enviado",
          "Verifica o teu email para o código de recuperação.",
          [{ text: "OK", onPress: () => setStep("code") }]
        );
        setCode("");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao solicitar recuperação");
    } finally {
      setLoading(false);
    }
  }

  // Passo 2: Verificar código
  async function handleVerifyCode() {
    if (!code.trim() || code.length !== 6) {
      Alert.alert("Erro", "Introduz o código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyResetCode(email, code);
      if (response.sucesso) {
        setStep("newPassword");
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  // Passo 3: Definir nova senha
  async function handleResetPassword() {
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.resetPassword(email, code, newPassword);
      if (response.sucesso) {
        Alert.alert(
          "Sucesso!",
          "A tua senha foi alterada com sucesso.",
          [{ text: "Fazer Login", onPress: () => router.replace("/login") }]
        );
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  function renderEmailStep() {
    return (
      <>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: 24 }}>
          Introduz o email associado à tua conta para receber o código de recuperação.
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: theme.text, marginBottom: 8, fontSize: 14, fontWeight: "500" }}>Email</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16 }}>
            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12 }}
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

        <TouchableOpacity
          onPress={handleRequestCode}
          disabled={loading}
          style={{ backgroundColor: theme.text, paddingVertical: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={{ color: theme.background, fontWeight: "600", fontSize: 16 }}>Enviar Código</Text>
          )}
        </TouchableOpacity>
      </>
    );
  }

  function renderCodeStep() {
    return (
      <>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: 24 }}>
          Introduz o código de 6 dígitos que foi enviado para {email}
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: theme.text, marginBottom: 8, fontSize: 14, fontWeight: "500" }}>Código</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16 }}>
            <Ionicons name="key-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, textAlign: "center", fontSize: 20, letterSpacing: 4 }}
              placeholder="000000"
              placeholderTextColor={theme.textSecondary}
              value={code}
              onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleVerifyCode}
          disabled={loading}
          style={{ backgroundColor: theme.text, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 16, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={{ color: theme.background, fontWeight: "600", fontSize: 16 }}>Verificar Código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep("email")}>
          <Text style={{ color: theme.text, textAlign: "center" }}>Reenviar código</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderNewPasswordStep() {
    return (
      <>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: 24 }}>
          Define a tua nova senha.
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: theme.text, marginBottom: 8, fontSize: 14, fontWeight: "500" }}>Nova Senha</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16 }}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12 }}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
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

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: theme.text, marginBottom: 8, fontSize: 14, fontWeight: "500" }}>Confirmar Senha</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 16 }}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12 }}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          style={{ backgroundColor: theme.text, paddingVertical: 16, borderRadius: 12, alignItems: "center", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={{ color: theme.background, fontWeight: "600", fontSize: 16 }}>Alterar Senha</Text>
          )}
        </TouchableOpacity>
      </>
    );
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
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ position: "absolute", left: 0, top: 0, paddingHorizontal: 8, paddingVertical: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={{ width: 64, height: 64, backgroundColor: theme.backgroundSecondary, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="key" size={32} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>Recuperar Senha</Text>

            {/* Progress indicators */}
            <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
              <View style={{ height: 4, width: 24, borderRadius: 2, backgroundColor: step === "email" ? theme.text : theme.border }} />
              <View style={{ height: 4, width: 24, borderRadius: 2, backgroundColor: step === "code" ? theme.text : theme.border }} />
              <View style={{ height: 4, width: 24, borderRadius: 2, backgroundColor: step === "newPassword" ? theme.text : theme.border }} />
            </View>
          </View>

          {/* Form */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 24, borderColor: theme.border, borderWidth: 1 }}>
            {step === "email" && renderEmailStep()}
            {step === "code" && renderCodeStep()}
            {step === "newPassword" && renderNewPasswordStep()}
          </View>

          {/* Back to login */}
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            style={{ marginTop: 24 }}
          >
            <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
              Lembras-te da senha?{" "}
              <Text style={{ color: theme.text, fontWeight: "600" }}>Fazer Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
