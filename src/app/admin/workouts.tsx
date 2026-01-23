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

export default function AdminWorkouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal criar treino
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [workoutsRes, exercisesRes] = await Promise.all([
        fetch(`${API_URL}/api/treino-admin`),
        fetch(`${API_URL}/api/exercicios`),
      ]);
      const workoutsData = await workoutsRes.json();
      const exercisesData = await exercisesRes.json();
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : []);
      setExercises(Array.isArray(exercisesData) ? exercisesData : []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function toggleExercise(exercise: any) {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  }

  async function handleCreate() {
    if (!workoutName.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Erro", "Seleciona pelo menos um exercício");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/treino-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: workoutName,
          exercicios: selectedExercises.map((e) => e.id),
        }),
      });
      const data = await response.json();
      if (data.sucesso) {
        Alert.alert("Sucesso", "Treino recomendado criado!");
        setShowModal(false);
        setWorkoutName("");
        setSelectedExercises([]);
        loadData();
      } else {
        Alert.alert("Erro", data.erro || "Erro ao criar treino");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao criar treino");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(workout: any) {
    Alert.alert(
      "Apagar Treino",
      `Tens a certeza que queres apagar "${workout.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/treino-admin/${workout.id_treino_admin}`,
                { method: "DELETE" }
              );
              const data = await response.json();
              if (data.sucesso) {
                loadData();
              } else {
                Alert.alert("Erro", data.erro || "Erro ao apagar treino");
              }
            } catch (error) {
              Alert.alert("Erro", "Erro ao apagar treino");
            }
          },
        },
      ]
    );
  }

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
        <Text className="text-white text-xl font-bold flex-1">
          Treinos Recomendados
        </Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="bg-blue-600 p-2 rounded-xl"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {workouts.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-8 items-center border border-dashed border-white/20">
            <Ionicons name="fitness-outline" size={48} color="#6b7280" />
            <Text className="text-gray-400 mt-4 text-center">
              Nenhum treino recomendado criado
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Criar Treino</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3">
            {workouts.map((workout, index) => (
              <View
                key={workout.id_treino_admin || index}
                className="bg-white/5 rounded-2xl p-4 border border-white/10"
              >
                <View className="flex-row items-center mb-3">
                  <View className="bg-purple-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                    <Ionicons name="star" size={24} color="#a855f7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">
                      {workout.nome}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {workout.exercicios?.length || 0} exercícios
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteWorkout(workout)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {workout.exercicios?.map((ex: any, i: number) => (
                  <View
                    key={i}
                    className="flex-row items-center py-2 border-t border-white/5"
                  >
                    <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                    <Text className="text-gray-300 text-sm">{ex.nome}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Criar Treino */}
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
                Novo Treino Recomendado
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6">
              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">
                  Nome do Treino
                </Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="Ex: Treino Full Body"
                  placeholderTextColor="#6b7280"
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">
                  Exercícios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20 mb-4">
                    {selectedExercises.map((ex) => (
                      <View
                        key={ex.id}
                        className="flex-row items-center justify-between py-2"
                      >
                        <Text className="text-white">{ex.nome}</Text>
                        <TouchableOpacity onPress={() => toggleExercise(ex)}>
                          <Ionicons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text className="text-gray-300 mb-2 font-medium">
                Adicionar Exercícios
              </Text>
              <View className="gap-2 mb-6">
                {exercises.map((exercise) => {
                  const isSelected = selectedExercises.find((e) => e.id === exercise.id);
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => toggleExercise(exercise)}
                      className={`p-4 rounded-xl flex-row items-center justify-between border ${
                        isSelected
                          ? "bg-green-500/20 border-green-500/40"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <View>
                        <Text className="text-white font-medium">{exercise.nome}</Text>
                        {exercise.category && (
                          <Text className="text-gray-400 text-sm">
                            {exercise.category}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                        size={24}
                        color={isSelected ? "#22c55e" : "#6b7280"}
                      />
                    </TouchableOpacity>
                  );
                })}
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
                    Criar Treino Recomendado
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
