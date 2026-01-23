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
import { authApi } from "../services/api";

type Step = "email" | "code" | "newPassword";

export default function ForgotPassword() {
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
          "Verifica o teu email para o código de recuperação.\n\n(Para testes, o código aparece no console do servidor)",
          [{ text: "OK", onPress: () => setStep("code") }]
        );
        // Para testes - mostrar código no alert
        if (response.codigo_teste) {
          console.log("Código de teste:", response.codigo_teste);
        }
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
        <Text className="text-gray-300 text-center mb-6">
          Introduz o email associado à tua conta para receber o código de recuperação.
        </Text>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm font-medium">Email</Text>
          <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
            <Ionicons name="mail-outline" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-white py-4 px-3"
              placeholder="exemplo@email.com"
              placeholderTextColor="#6b7280"
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
          className="bg-blue-600 py-4 rounded-xl items-center"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Enviar Código</Text>
          )}
        </TouchableOpacity>
      </>
    );
  }

  function renderCodeStep() {
    return (
      <>
        <Text className="text-gray-300 text-center mb-6">
          Introduz o código de 6 dígitos que foi enviado para {email}
        </Text>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm font-medium">Código</Text>
          <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
            <Ionicons name="key-outline" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-white py-4 px-3 text-center text-2xl tracking-widest"
              placeholder="000000"
              placeholderTextColor="#6b7280"
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
          className="bg-blue-600 py-4 rounded-xl items-center mb-4"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Verificar Código</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep("email")}>
          <Text className="text-blue-400 text-center">Reenviar código</Text>
        </TouchableOpacity>
      </>
    );
  }

  function renderNewPasswordStep() {
    return (
      <>
        <Text className="text-gray-300 text-center mb-6">
          Define a tua nova senha.
        </Text>

        <View className="mb-4">
          <Text className="text-gray-300 mb-2 text-sm font-medium">Nova Senha</Text>
          <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-white py-4 px-3"
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-300 mb-2 text-sm font-medium">Confirmar Senha</Text>
          <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 text-white py-4 px-3"
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          className="bg-blue-600 py-4 rounded-xl items-center"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Alterar Senha</Text>
          )}
        </TouchableOpacity>
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0d1b2a]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-0 top-0 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View className="w-16 h-16 bg-blue-600/20 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="key" size={32} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-white">Recuperar Senha</Text>

            {/* Progress indicators */}
            <View className="flex-row mt-4 gap-2">
              <View className={`h-2 w-8 rounded-full ${step === "email" ? "bg-blue-500" : "bg-white/20"}`} />
              <View className={`h-2 w-8 rounded-full ${step === "code" ? "bg-blue-500" : "bg-white/20"}`} />
              <View className={`h-2 w-8 rounded-full ${step === "newPassword" ? "bg-blue-500" : "bg-white/20"}`} />
            </View>
          </View>

          {/* Form */}
          <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
            {step === "email" && renderEmailStep()}
            {step === "code" && renderCodeStep()}
            {step === "newPassword" && renderNewPasswordStep()}
          </View>

          {/* Back to login */}
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            className="mt-6"
          >
            <Text className="text-gray-400 text-center">
              Lembras-te da senha?{" "}
              <Text className="text-blue-400 font-semibold">Fazer Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
