import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { userApi } from "../services/api";
import * as Haptics from "expo-haptics";

export default function EditProfile() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!user?.id) return;

    try {
      const response = await userApi.getProfile(user.id);
      if (response?.user) {
        setNome(response.user.name || "");
        setIdade(response.user.age?.toString() || "");
        setPeso(response.user.weight?.toString() || "");
        setAltura(response.user.height?.toString() || "");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setNome(user.nome || "");
      setIdade(user.idade?.toString() || "");
      setPeso(user.peso?.toString() || "");
      setAltura(user.altura?.toString() || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile(user!.id, {
        nome: nome.trim(),
        idade: idade ? parseInt(idade) : null,
        peso: peso ? parseFloat(peso) : null,
        altura: altura ? parseFloat(altura) : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
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
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, flex: 1 }}>
            Editar Perfil
          </Text>
        </View>

        {/* Formulário */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          {/* Nome */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
              Nome
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 10,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="O teu nome"
                placeholderTextColor={theme.textSecondary}
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          {/* Idade */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
              Idade
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 10,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="Ex: 25"
                placeholderTextColor={theme.textSecondary}
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Peso */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
              Peso (kg)
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 10,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="scale-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="Ex: 70"
                placeholderTextColor={theme.textSecondary}
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Altura */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: theme.text, marginBottom: 8, fontSize: 13, fontWeight: "500" }}>
              Altura (cm)
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 10,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="resize-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
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
              onPress={() => router.back()}
              style={{
                flex: 1,
                backgroundColor: theme.backgroundSecondary,
                paddingVertical: 16,
                borderRadius: 10,
                alignItems: "center",
                borderColor: theme.border,
                borderWidth: 1,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                backgroundColor: theme.text,
                paddingVertical: 16,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={{ color: theme.background, fontWeight: "600" }}>
                  Guardar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
