import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { SERVER_CONFIG } from "../../services/server-config";

const getAPI_URL = () => SERVER_CONFIG.getFullURL();

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
      const response = await fetch(`${getAPI_URL()}/api/admin/exercicios`);
      const data = await response.json();
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
      const response = await fetch(`${getAPI_URL()}/api/admin/exercicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.sucesso) {
        Alert.alert("Sucesso", "Exercício criado com sucesso!");
        setShowModal(false);
        setForm({ nome: "", descricao: "", grupo_tipo: "", sub_tipo: "", video: "" });
        loadExercises();
      } else {
        Alert.alert("Erro", data.erro || "Erro ao criar exercício");
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
              const response = await fetch(
                `${getAPI_URL()}/api/admin/exercicios/${encodeURIComponent(exercise.nome)}`,
                { method: "DELETE" }
              );
              const data = await response.json();
              if (data.sucesso) {
                loadExercises();
              } else {
                Alert.alert("Erro", data.erro || "Erro ao apagar exercício");
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
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", flex: 1, color: theme.text }}>Exercícios</Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: theme.text, padding: 8, borderRadius: 12 }}
        >
          <Ionicons name="add" size={24} color={theme.background} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, borderColor: theme.border, borderWidth: 1 }}>
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
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 32, alignItems: "center", borderColor: theme.border, borderWidth: 1, borderStyle: "dashed" }}>
            <Ionicons name="barbell-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: "center" }}>
              Nenhum exercício encontrado
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredExercises.map((exercise: any, index: number) => (
              <View
                key={exercise.id || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ backgroundColor: theme.backgroundTertiary, width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                    <Ionicons name="barbell" size={24} color={theme.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 18 }}>
                      {exercise.nome}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      {exercise.grupo_tipo && (
                        <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {exercise.grupo_tipo}
                          </Text>
                        </View>
                      )}
                      {exercise.sub_tipo && (
                        <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {exercise.sub_tipo}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteExercise(exercise)}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>
                {exercise.descricao && (
                  <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 8 }}>
                    {exercise.descricao}
                  </Text>
                )}
              </View>
            ))}
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
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>Nome *</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="Ex: Supino Reto"
                  placeholderTextColor={theme.textSecondary}
                  value={form.nome}
                  onChangeText={(text: string) => setForm({ ...form, nome: text })}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>Descrição</Text>
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
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>Grupo Muscular</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {gruposMusculares.map((grupo) => (
                      <TouchableOpacity
                        key={grupo}
                        onPress={() => setForm({ ...form, grupo_tipo: grupo })}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 12,
                          borderColor: form.grupo_tipo === grupo ? theme.text : theme.border,
                          borderWidth: 1,
                          backgroundColor: form.grupo_tipo === grupo ? theme.text : theme.backgroundSecondary
                        }}
                      >
                        <Text
                          style={{ color: form.grupo_tipo === grupo ? theme.background : theme.text }}
                        >
                          {grupo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>Sub-tipo</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="Ex: Barbell, Dumbbell, Machine..."
                  placeholderTextColor={theme.textSecondary}
                  value={form.sub_tipo}
                  onChangeText={(text: string) => setForm({ ...form, sub_tipo: text })}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>URL do Vídeo</Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="https://youtube.com/..."
                  placeholderTextColor={theme.textSecondary}
                  value={form.video}
                  onChangeText={(text) => setForm({ ...form, video: text })}
                />
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopColor: theme.border, borderTopWidth: 1 }}>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving}
                style={{ backgroundColor: theme.text, paddingVertical: 16, borderRadius: 12, alignItems: "center", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={{ color: theme.background, fontWeight: "bold", fontSize: 16 }}>
                    Criar Exercício
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
