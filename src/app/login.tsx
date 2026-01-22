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
import { Link } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const { login } = useAuth();
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
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
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
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600/20 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="barbell" size={32} color="#3b82f6" />
            </View>
            <Text className="text-3xl font-bold text-white">GoLift</Text>
            <Text className="text-gray-400 mt-2">Bem-vindo de volta</Text>
          </View>

          {/* Formulário */}
          <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Email
              </Text>
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

            {/* Password */}
            <View className="mb-6">
              <Text className="text-gray-300 mb-2 text-sm font-medium">
                Password
              </Text>
              <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 text-white py-4 px-3"
                  placeholder="••••••••"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
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

            {/* Esqueceu password */}
            <TouchableOpacity className="mb-6">
              <Text className="text-blue-500 text-right text-sm">
                Esqueceste a password?
              </Text>
            </TouchableOpacity>

            {/* Botão Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-blue-600 py-4 rounded-xl items-center active:bg-blue-700"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Link Registo */}
            <View className="flex-row justify-center mt-6 pt-6 border-t border-white/10">
              <Text className="text-gray-400">Não tens conta? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-500 font-semibold">Criar conta</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
