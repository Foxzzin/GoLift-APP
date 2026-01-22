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

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1 = credenciais, 2 = dados pessoais
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 - Credenciais
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 - Dados Pessoais
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

  function handleNextStep() {
    if (!nome.trim()) {
      Alert.alert("Erro", "Insere o teu nome");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Erro", "Insere um email válido");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erro", "A password deve ter pelo menos 6 caracteres");
      return;
    }
    setStep(2);
  }

  async function handleRegister() {
    setLoading(true);
    try {
      await register({
        nome,
        email,
        password,
        idade: idade ? parseInt(idade) : undefined,
        peso: peso ? parseFloat(peso) : undefined,
        altura: altura ? parseFloat(altura) : undefined,
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
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
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-blue-600/20 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="barbell" size={32} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-white">
              {step === 1 ? "Criar Conta" : "Dados Pessoais"}
            </Text>
            <Text className="text-gray-400 mt-2">
              Passo {step} de 2 - {step === 1 ? "Credenciais" : "Informações"}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </View>

          {/* Formulário */}
          <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
            {step === 1 ? (
              <>
                {/* Nome */}
                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 text-sm font-medium">
                    Nome
                  </Text>
                  <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="O teu nome"
                      placeholderTextColor="#6b7280"
                      value={nome}
                      onChangeText={setNome}
                    />
                  </View>
                </View>

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
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="mb-6">
                  <Text className="text-gray-300 mb-2 text-sm font-medium">
                    Password
                  </Text>
                  <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Botão Continuar */}
                <TouchableOpacity
                  onPress={handleNextStep}
                  className="bg-blue-600 py-4 rounded-xl items-center flex-row justify-center active:bg-blue-700"
                >
                  <Text className="text-white font-semibold text-lg mr-2">
                    Continuar
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Info */}
                <View className="bg-blue-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
                  <Text className="text-blue-400 text-sm text-center">
                    Estes dados ajudam a personalizar a tua experiência (opcional)
                  </Text>
                </View>

                {/* Idade */}
                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 text-sm font-medium">
                    Idade
                  </Text>
                  <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="Ex: 25"
                      placeholderTextColor="#6b7280"
                      value={idade}
                      onChangeText={setIdade}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Peso */}
                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 text-sm font-medium">
                    Peso (kg)
                  </Text>
                  <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                    <Ionicons name="scale-outline" size={20} color="#6b7280" />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="Ex: 70"
                      placeholderTextColor="#6b7280"
                      value={peso}
                      onChangeText={setPeso}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Altura */}
                <View className="mb-6">
                  <Text className="text-gray-300 mb-2 text-sm font-medium">
                    Altura (cm)
                  </Text>
                  <View className="flex-row items-center bg-white/5 rounded-xl border border-white/10 px-4">
                    <Ionicons name="resize-outline" size={20} color="#6b7280" />
                    <TextInput
                      className="flex-1 text-white py-4 px-3"
                      placeholder="Ex: 175"
                      placeholderTextColor="#6b7280"
                      value={altura}
                      onChangeText={setAltura}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Botões */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    className="flex-1 bg-white/5 py-4 rounded-xl items-center flex-row justify-center border border-white/10"
                  >
                    <Ionicons name="arrow-back" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={loading}
                    className="flex-1 bg-blue-600 py-4 rounded-xl items-center active:bg-blue-700"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Criar Conta
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Link Login */}
            <View className="flex-row justify-center mt-6 pt-6 border-t border-white/10">
              <Text className="text-gray-400">Já tens conta? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-500 font-semibold">Fazer Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
