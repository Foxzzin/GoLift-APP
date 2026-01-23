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
import { useTheme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const { register } = useAuth();
  const theme = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
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
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {step === 1 ? "Criar Conta" : "Dados Pessoais"}
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 13 }}>
              Passo {step} de 2 - {step === 1 ? "Credenciais" : "Informações"}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{
            height: 3,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 2,
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <View
              style={{
                height: "100%",
                backgroundColor: theme.text,
                width: step === 1 ? "50%" : "100%",
                borderRadius: 2,
              }}
            />
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
            {step === 1 ? (
              <>
                {/* Nome */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                    Nome
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
                    <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                      placeholder="O teu nome"
                      placeholderTextColor={theme.textSecondary}
                      value={nome}
                      onChangeText={setNome}
                    />
                  </View>
                </View>

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
                      placeholder="Mínimo 6 caracteres"
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

                {/* Botão Continuar */}
                <TouchableOpacity
                  onPress={handleNextStep}
                  style={{
                    backgroundColor: theme.text,
                    paddingVertical: 16,
                    borderRadius: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: theme.background, fontWeight: "600", fontSize: 16, marginRight: 8 }}>
                    Continuar
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.background} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Info */}
                <View style={{
                  backgroundColor: theme.background,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 24,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center" }}>
                    Estes dados ajudam a personalizar a tua experiência (opcional)
                  </Text>
                </View>

                {/* Idade */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                    Idade
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
                    <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                      placeholder="Ex: 25"
                      placeholderTextColor={theme.textSecondary}
                      value={idade}
                      onChangeText={setIdade}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Peso */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                    Peso (kg)
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
                    <Ionicons name="scale-outline" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                      placeholder="Ex: 70"
                      placeholderTextColor={theme.textSecondary}
                      value={peso}
                      onChangeText={setPeso}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Altura */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
                    Altura (cm)
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
                    <Ionicons name="resize-outline" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={{ flex: 1, color: theme.text, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16 }}
                      placeholder="Ex: 175"
                      placeholderTextColor={theme.textSecondary}
                      value={altura}
                      onChangeText={setAltura}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Botões */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    style={{
                      flex: 1,
                      backgroundColor: theme.background,
                      paddingVertical: 16,
                      borderRadius: 10,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderColor: theme.border,
                      borderWidth: 1,
                    }}
                  >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                    <Text style={{ color: theme.text, fontWeight: "600", marginLeft: 8 }}>
                      Voltar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRegister}
                    disabled={loading}
                    style={{
                      flex: 1,
                      backgroundColor: theme.text,
                      paddingVertical: 16,
                      borderRadius: 10,
                      alignItems: "center",
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.background} />
                    ) : (
                      <Text style={{ color: theme.background, fontWeight: "600" }}>
                        Criar Conta
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Link Login */}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, paddingTop: 24, borderTopColor: theme.border, borderTopWidth: 1 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                Já tens conta?{" "}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                    Fazer Login
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
