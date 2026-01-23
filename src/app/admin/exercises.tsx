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

const API_URL = "http://10.0.2.2:5000";

export default function AdminExercises() {
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
      const response = await fetch(`${API_URL}/api/admin/exercicios`);
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
      const response = await fetch(`${API_URL}/api/admin/exercicios`, {
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
                `${API_URL}/api/admin/exercicios/${encodeURIComponent(exercise.nome)}`,
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
    (e) =>
      e.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.grupo_tipo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#0d1b2a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0d1b2a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Exercícios</Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="bg-blue-600 p-2 rounded-xl"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-white/5 rounded-xl px-4 border border-white/10">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 py-3 px-3 text-white"
            placeholder="Pesquisar exercícios..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredExercises.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-8 items-center border border-dashed border-white/20">
            <Ionicons name="barbell-outline" size={48} color="#6b7280" />
            <Text className="text-gray-400 mt-4 text-center">
              Nenhum exercício encontrado
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredExercises.map((exercise, index) => (
              <View
                key={exercise.id || index}
                className="bg-white/5 rounded-2xl p-4 border border-white/10"
              >
                <View className="flex-row items-center">
                  <View className="bg-green-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="barbell" size={24} color="#22c55e" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">
                      {exercise.nome}
                    </Text>
                    <View className="flex-row gap-2 mt-1">
                      {exercise.grupo_tipo && (
                        <View className="bg-blue-500/20 px-2 py-1 rounded">
                          <Text className="text-blue-400 text-xs">
                            {exercise.grupo_tipo}
                          </Text>
                        </View>
                      )}
                      {exercise.sub_tipo && (
                        <View className="bg-purple-500/20 px-2 py-1 rounded">
                          <Text className="text-purple-400 text-xs">
                            {exercise.sub_tipo}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteExercise(exercise)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                {exercise.descricao && (
                  <Text className="text-gray-400 text-sm mt-2">
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
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#1a2332] rounded-t-3xl max-h-[90%]">
            <View className="flex-row justify-between items-center p-6 border-b border-white/10">
              <Text className="text-white text-xl font-bold">
                Novo Exercício
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6">
              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">Nome *</Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="Ex: Supino Reto"
                  placeholderTextColor="#6b7280"
                  value={form.nome}
                  onChangeText={(text) => setForm({ ...form, nome: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">Descrição</Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="Descrição do exercício..."
                  placeholderTextColor="#6b7280"
                  value={form.descricao}
                  onChangeText={(text) => setForm({ ...form, descricao: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">Grupo Muscular</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {gruposMusculares.map((grupo) => (
                      <TouchableOpacity
                        key={grupo}
                        onPress={() => setForm({ ...form, grupo_tipo: grupo })}
                        className={`px-4 py-2 rounded-xl border ${
                          form.grupo_tipo === grupo
                            ? "bg-blue-600 border-blue-600"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <Text
                          className={form.grupo_tipo === grupo ? "text-white" : "text-gray-400"}
                        >
                          {grupo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">Sub-tipo</Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="Ex: Barbell, Dumbbell, Machine..."
                  placeholderTextColor="#6b7280"
                  value={form.sub_tipo}
                  onChangeText={(text) => setForm({ ...form, sub_tipo: text })}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">URL do Vídeo</Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="https://youtube.com/..."
                  placeholderTextColor="#6b7280"
                  value={form.video}
                  onChangeText={(text) => setForm({ ...form, video: text })}
                />
              </View>
            </ScrollView>

            <View className="p-6 border-t border-white/10">
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving}
                className="bg-blue-600 py-4 rounded-xl items-center"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
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
