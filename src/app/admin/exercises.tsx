import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { adminApi } from "../../services/api";

const GRUPO_COLORS: Record<string, string> = {
  Peito: "#EF4444",
  Costas: "#3B82F6",
  Ombros: "#8B5CF6",
  "Bíceps": "#F59E0B",
  "Tríceps": "#F97316",
  Pernas: "#10B981",
  "Glúteos": "#EC4899",
  "Abdómen": "#06B6D4",
  Cardio: "#84CC16",
};

export default function AdminExercises() {
  const theme = useTheme();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal criar exercício
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    grupo_tipo: "",
    sub_tipo: "",
    video: "",
  });

  const gruposMusculares = [
    "Peito",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Pernas",
    "Glúteos",
    "Abdómen",
    "Cardio",
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await adminApi.getExercises();
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  }

  async function handleCreate() {
    if (!form.nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const data = await adminApi.createExercise(form);
      if (data.sucesso) {
        Alert.alert("Sucesso", "Exercício criado com sucesso!");
        setShowModal(false);
        setForm({ nome: "", descricao: "", grupo_tipo: "", sub_tipo: "", video: "" });
        loadExercises();
      } else {
        Alert.alert("Erro", "Erro ao criar exercício");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao criar exercício");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExercise(exercise: any) {
    Alert.alert(
      "Apagar Exercício",
      `Tens a certeza que queres apagar "${exercise.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await adminApi.deleteExercise(exercise.nome);
              if (data.sucesso) {
                loadExercises();
              } else {
                Alert.alert("Erro", "Erro ao apagar exercício");
              }
            } catch (error) {
              Alert.alert("Erro", "Erro ao apagar exercício");
            }
          },
        },
      ]
    );
  }

  const filteredExercises = exercises.filter(
    (e: any) =>
      e.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.grupo_tipo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: 16, padding: 4 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "800", flex: 1, color: theme.text, letterSpacing: -0.5 }}>Exercícios</Text>
        <Pressable
          onPress={() => setShowModal(true)}
          accessibilityLabel="Criar exercício"
          accessibilityRole="button"
          style={({ pressed }) => ({
            backgroundColor: theme.accent,
            padding: 10,
            borderRadius: 14,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 14, paddingHorizontal: 16 }}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: theme.text }}
            placeholder="Pesquisar exercícios..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {filteredExercises.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🏋️</Text>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600", textAlign: "center" }}>
              Nenhum exercício encontrado
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredExercises.map((exercise: any, index: number) => {
              const groupColor = GRUPO_COLORS[exercise.grupo_tipo] ?? theme.accent;
              return (
                <View
                  key={exercise.id || index}
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 16 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 13,
                      backgroundColor: groupColor + "22",
                      justifyContent: "center", alignItems: "center", marginRight: 14,
                    }}>
                      <Text style={{ fontSize: 17, fontWeight: "800", color: groupColor }}>
                        {(exercise.nome || "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, letterSpacing: -0.2 }}>
                        {exercise.nome}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                        {exercise.grupo_tipo && (
                          <View style={{ backgroundColor: groupColor + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 }}>
                            <Text style={{ color: groupColor, fontSize: 11, fontWeight: "700" }}>
                              {exercise.grupo_tipo}
                            </Text>
                          </View>
                        )}
                        {exercise.sub_tipo && (
                          <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                              {exercise.sub_tipo}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => deleteExercise(exercise)}
                      accessibilityLabel="Apagar exercício"
                      accessibilityRole="button"
                      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                  {exercise.descricao && (
                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 10, lineHeight: 18 }}>
                      {exercise.descricao}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Criar Exercício */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomColor: theme.border, borderBottomWidth: 1 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>
                Novo Exercício
              </Text>
              <Pressable onPress={() => setShowModal(false)} accessibilityRole="button" accessibilityLabel="Fechar" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Nome *</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="Ex: Supino Reto"
                  placeholderTextColor={theme.textSecondary}
                  value={form.nome}
                  onChangeText={(text: string) => setForm({ ...form, nome: text })}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Descrição</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1, minHeight: 100 }}
                  placeholder="Descrição do exercício..."
                  placeholderTextColor={theme.textSecondary}
                  value={form.descricao}
                  onChangeText={(text: string) => setForm({ ...form, descricao: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Grupo Muscular</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {gruposMusculares.map((grupo) => (
                      <Pressable
                        key={grupo}
                        onPress={() => setForm({ ...form, grupo_tipo: grupo })}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: form.grupo_tipo === grupo ? theme.accent : theme.backgroundSecondary,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ color: form.grupo_tipo === grupo ? "#fff" : theme.textSecondary, fontWeight: form.grupo_tipo === grupo ? "700" : "400", fontSize: 13 }}>
                          {grupo}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Sub-tipo</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="Ex: Barbell, Dumbbell, Machine..."
                  placeholderTextColor={theme.textSecondary}
                  value={form.sub_tipo}
                  onChangeText={(text: string) => setForm({ ...form, sub_tipo: text })}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>URL do Vídeo</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="https://youtube.com/..."
                  placeholderTextColor={theme.textSecondary}
                  value={form.video}
                  onChangeText={(text) => setForm({ ...form, video: text })}
                />
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopColor: theme.backgroundTertiary, borderTopWidth: 1 }}>
              <Pressable
                onPress={handleCreate}
                disabled={saving}
                accessibilityLabel="Criar exercício"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: theme.accent,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  opacity: pressed || saving ? 0.7 : 1,
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                })}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                    Criar Exercício
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
