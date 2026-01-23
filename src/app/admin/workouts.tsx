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

export default function AdminWorkouts() {
  const theme = useTheme();
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
        fetch(`${getAPI_URL()}/api/treino-admin`),
        fetch(`${getAPI_URL()}/api/exercicios`),
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
      const response = await fetch(`${getAPI_URL()}/api/treino-admin`, {
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
                `${getAPI_URL()}/api/treino-admin/${workout.id_treino_admin}`,
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
        <Text style={{ fontSize: 20, fontWeight: "bold", flex: 1, color: theme.text }}>
          Treinos Recomendados
        </Text>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{ backgroundColor: theme.text, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12 }}
        >
          <Ionicons name="add" size={24} color={theme.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {workouts.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 32, alignItems: "center", borderColor: theme.border, borderWidth: 1, borderStyle: "dashed" }}>
            <Ionicons name="fitness-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: "center" }}>
              Nenhum treino recomendado criado
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              style={{ marginTop: 16, backgroundColor: theme.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: theme.background, fontWeight: "600" }}>Criar Treino</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {workouts.map((workout, index) => (
              <View
                key={workout.id_treino_admin || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ backgroundColor: theme.backgroundTertiary, width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                    <Ionicons name="star" size={24} color={theme.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 18 }}>
                      {workout.nome}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                      {workout.exercicios?.length || 0} exercícios
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteWorkout(workout)}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {workout.exercicios?.map((ex: any, i: number) => (
                  <View
                    key={i}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopColor: theme.border, borderTopWidth: 1 }}
                  >
                    <View style={{ width: 4, height: 4, backgroundColor: theme.textSecondary, borderRadius: 2, marginRight: 12 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{ex.nome}</Text>
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
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomColor: theme.border, borderBottomWidth: 1 }}>
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>
                Novo Treino Recomendado
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>
                  Nome do Treino
                </Text>
                <TextInput
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text, borderColor: theme.border, borderWidth: 1 }}
                  placeholder="Ex: Treino Full Body"
                  placeholderTextColor={theme.textSecondary}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>
                  Exercícios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 12, borderColor: theme.border, borderWidth: 1, marginBottom: 16 }}>
                    {selectedExercises.map((ex) => (
                      <View
                        key={ex.id}
                        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}
                      >
                        <Text style={{ color: theme.text }}>{ex.nome}</Text>
                        <TouchableOpacity onPress={() => toggleExercise(ex)}>
                          <Ionicons name="close-circle" size={20} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500" }}>
                Adicionar Exercícios
              </Text>
              <View style={{ gap: 8, marginBottom: 24 }}>
                {exercises.map((exercise) => {
                  const isSelected = selectedExercises.find((e) => e.id === exercise.id);
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      onPress={() => toggleExercise(exercise)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderColor: isSelected ? theme.text : theme.border,
                        borderWidth: 1,
                        backgroundColor: isSelected ? theme.backgroundTertiary : theme.backgroundSecondary
                      }}
                    >
                      <View>
                        <Text style={{ color: theme.text, fontWeight: "500" }}>{exercise.nome}</Text>
                        {exercise.category && (
                          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {exercise.category}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "add-circle-outline"}
                        size={24}
                        color={isSelected ? theme.text : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
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
