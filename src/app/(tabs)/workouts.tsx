import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { workoutApi, exerciseApi } from "../../services/api";

export default function Workouts() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [adminWorkouts, setAdminWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal criar treino
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [userWorkouts, recommended] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id).catch(() => []),
        workoutApi.getAdminWorkouts().catch(() => []),
      ]);
      setMyWorkouts(userWorkouts || []);
      setAdminWorkouts(recommended || []);
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function openCreateModal() {
    setShowCreateModal(true);
    setWorkoutName("");
    setSelectedExercises([]);
    setLoadingExercises(true);
    try {
      const exercises = await exerciseApi.getAll();
      setAvailableExercises(exercises || []);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoadingExercises(false);
    }
  }

  function toggleExercise(exercise: any) {
    if (selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e) => e.id !== exercise.id));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  }

  async function handleCreateWorkout() {
    if (!workoutName.trim()) {
      Alert.alert("Erro", "Insere um nome para o treino");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Erro", "Seleciona pelo menos um exercício");
      return;
    }

    setSavingWorkout(true);
    try {
      const exerciseIds = selectedExercises.map((e) => e.id);
      await workoutApi.createWorkout(user!.id, workoutName, exerciseIds);
      Alert.alert("Sucesso", "Treino criado com sucesso!");
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar treino");
    } finally {
      setSavingWorkout(false);
    }
  }

  async function handleStartWorkout(workout: any) {
    router.push(`/workout/${workout.id_treino}`);
  }

  async function handleDeleteWorkout(workout: any) {
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
              await workoutApi.deleteWorkout(user!.id, workout.id_treino);
              loadData();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar o treino");
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-4">
          <Text className="text-white text-2xl font-bold">Treinos</Text>
        </View>

        {/* Treinos Recomendados */}
        {adminWorkouts.length > 0 && (
          <View className="mb-6">
            <View className="px-6 mb-3">
              <Text className="text-white text-lg font-semibold">
                Treinos Recomendados
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {adminWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id_treino_admin || index}
                  onPress={() => handleStartWorkout(workout)}
                  className="bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-2xl p-5 w-64 border border-blue-500/30"
                >
                  <View className="bg-blue-500/30 w-12 h-12 rounded-xl items-center justify-center mb-3">
                    <Ionicons name="star" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-white font-bold text-lg mb-1">
                    {workout.nome}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {workout.exercicios?.length || 0} exercícios
                  </Text>
                  <TouchableOpacity className="mt-4 bg-blue-600 py-3 rounded-xl items-center">
                    <Text className="text-white font-semibold">Começar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Meus Treinos */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">
              Os Meus Treinos
            </Text>
            <TouchableOpacity
              onPress={openCreateModal}
              className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center"
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold ml-1">Novo</Text>
            </TouchableOpacity>
          </View>

          {myWorkouts.length === 0 ? (
            <View className="bg-white/5 rounded-2xl p-8 items-center border border-dashed border-white/20">
              <Ionicons name="barbell-outline" size={48} color="#6b7280" />
              <Text className="text-gray-400 mt-4 text-center">
                Ainda não criaste nenhum treino
              </Text>
              <TouchableOpacity
                onPress={openCreateModal}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Criar Treino</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {myWorkouts.map((workout, index) => (
                <View
                  key={workout.id_treino || index}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10"
                >
                  <View className="flex-row items-center mb-3">
                    <View className="bg-blue-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                      <Ionicons name="barbell" size={24} color="#3b82f6" />
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
                      onPress={() => handleDeleteWorkout(workout)}
                      className="p-2"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Lista exercícios */}
                  {workout.exercicios?.slice(0, 3).map((ex: any, i: number) => (
                    <View
                      key={i}
                      className="flex-row items-center py-2 border-t border-white/5"
                    >
                      <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      <Text className="text-gray-300 text-sm">
                        {ex.nome || ex.name}
                      </Text>
                    </View>
                  ))}
                  {(workout.exercicios?.length || 0) > 3 && (
                    <Text className="text-gray-500 text-sm mt-2">
                      +{workout.exercicios.length - 3} mais...
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => handleStartWorkout(workout)}
                    className="mt-4 bg-blue-600 py-3 rounded-xl items-center flex-row justify-center"
                  >
                    <Ionicons name="play" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Começar Treino
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal Criar Treino */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#1a2332] rounded-t-3xl max-h-[90%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center p-6 border-b border-white/10">
              <Text className="text-white text-xl font-bold">
                Criar Treino
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6">
              {/* Nome do treino */}
              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">
                  Nome do Treino
                </Text>
                <TextInput
                  className="bg-white/5 rounded-xl px-4 py-4 text-white border border-white/10"
                  placeholder="Ex: Treino de Peito"
                  placeholderTextColor="#6b7280"
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              {/* Exercícios selecionados */}
              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">
                  Exercícios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 mb-4">
                    {selectedExercises.map((ex, i) => (
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

              {/* Lista de exercícios disponíveis */}
              <Text className="text-gray-300 mb-2 font-medium">
                Adicionar Exercícios
              </Text>
              {loadingExercises ? (
                <ActivityIndicator color="#3b82f6" />
              ) : (
                <View className="gap-2 mb-6">
                  {availableExercises.map((exercise) => {
                    const isSelected = selectedExercises.find(
                      (e) => e.id === exercise.id
                    );
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
                          <Text className="text-white font-medium">
                            {exercise.nome}
                          </Text>
                          {exercise.grupo_muscular && (
                            <Text className="text-gray-400 text-sm">
                              {exercise.grupo_muscular}
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
              )}
            </ScrollView>

            {/* Botão Criar */}
            <View className="p-6 border-t border-white/10">
              <TouchableOpacity
                onPress={handleCreateWorkout}
                disabled={savingWorkout}
                className="bg-blue-600 py-4 rounded-xl items-center"
              >
                {savingWorkout ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Criar Treino
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
