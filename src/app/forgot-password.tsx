import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { authApi } from "../services/api";

type Step = "email" | "code" | "newPassword";
const STEPS: Step[] = ["email", "code", "newPassword"];

export default function ForgotPassword() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex + 1) / STEPS.length;

  async function handleRequestCode() {
    if (!email.trim()) {
      Alert.alert("Erro", "Introduz o teu email");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.requestPasswordReset(email);
      if (response.sucesso) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Código Enviado",
          "Verifica o teu email para o código de recuperação.",
          [{ text: "OK", onPress: () => setStep("code") }]
        );
        setCode("");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", error.message || "Erro ao solicitar recuperação");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!code.trim() || code.length !== 6) {
      Alert.alert("Erro", "Introduz o código de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.verifyResetCode(email, code);
      if (response.sucesso) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("newPassword");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", error.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  }

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Sucesso!",
          "A tua senha foi alterada com sucesso.",
          [{ text: "Fazer Login", onPress: () => router.replace("/login") }]
        );
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erro", error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  const stepConfig = {
    email: {
      icon: "mail" as const,
      title: "Email",
      subtitle: "Introduz o email associado à tua conta para receber o código de recuperação.",
    },
    code: {
      icon: "key" as const,
      title: "Verificação",
      subtitle: `Introduz o código de 6 dígitos que foi enviado para ${email}`,
    },
    newPassword: {
      icon: "shield-checkmark" as const,
      title: "Nova Senha",
      subtitle: "Define a tua nova senha.",
    },
  };

  const current = stepConfig[step];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: theme.backgroundSecondary,
                justifyContent: "center", alignItems: "center",
                marginRight: 14, opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
              Recuperar Senha
            </Text>
          </View>

          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: theme.backgroundTertiary, borderRadius: 2, overflow: "hidden" }}>
            <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: theme.accent, borderRadius: 2 }} />
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
          {/* Step icon + title */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: theme.accent + "18",
              alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Ionicons name={current.icon} size={28} color={theme.accent} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: theme.text, letterSpacing: -0.5, marginBottom: 8 }}>
              {current.title}
            </Text>
            <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 15, lineHeight: 22 }}>
              {current.subtitle}
            </Text>
          </View>

          {/* Form */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 20 }}>
            {step === "email" && (
              <>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Email
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16 }}>
                  <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={{ flex: 1, color: theme.text, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16 }}
                    placeholder="exemplo@email.com"
                    placeholderTextColor={theme.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                <Pressable
                  onPress={handleRequestCode}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Enviar código"
                  style={({ pressed }) => ({
                    backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 14,
                    alignItems: "center", marginTop: 20, opacity: pressed || loading ? 0.8 : 1,
                  })}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Enviar Código</Text>
                  )}
                </Pressable>
              </>
            )}

            {step === "code" && (
              <>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Código
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16 }}>
                  <Ionicons name="key-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={{ flex: 1, color: theme.text, paddingVertical: 14, paddingHorizontal: 12, textAlign: "center", fontSize: 22, letterSpacing: 6, fontWeight: "700" }}
                    placeholder="000000"
                    placeholderTextColor={theme.textTertiary}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <Pressable
                  onPress={handleVerifyCode}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Verificar código"
                  style={({ pressed }) => ({
                    backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 14,
                    alignItems: "center", marginTop: 20, opacity: pressed || loading ? 0.8 : 1,
                  })}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Verificar Código</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => setStep("email")}
                  accessibilityRole="button"
                  accessibilityLabel="Reenviar código"
                  style={({ pressed }) => ({ marginTop: 16, opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={{ color: theme.accent, textAlign: "center", fontWeight: "600", fontSize: 14 }}>
                    Reenviar código
                  </Text>
                </Pressable>
              </>
            )}

            {step === "newPassword" && (
              <>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Nova Senha
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16 }}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={{ flex: 1, color: theme.text, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16 }}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={theme.textTertiary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityRole="button" accessibilityLabel={showPassword ? "Esconder" : "Mostrar"}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Confirmar Senha
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 14, paddingHorizontal: 16 }}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={{ flex: 1, color: theme.text, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16 }}
                    placeholder="Repete a senha"
                    placeholderTextColor={theme.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
                <Pressable
                  onPress={handleResetPassword}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Alterar senha"
                  style={({ pressed }) => ({
                    backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 14,
                    alignItems: "center", marginTop: 20, opacity: pressed || loading ? 0.8 : 1,
                  })}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Alterar Senha</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {/* Back to login */}
          <Pressable
            onPress={() => router.replace("/login")}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao login"
            style={({ pressed }) => ({ marginTop: 24, opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 15 }}>
              Lembras-te da senha?{" "}
              <Text style={{ color: theme.accent, fontWeight: "700" }}>Fazer Login</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
