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
import { adminApi, exerciseApi } from "../../services/api";

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
      const [workoutsData, exercisesData] = await Promise.all([
        adminApi.getWorkouts(),
        exerciseApi.getAll(),
      ]);
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
      const data = await adminApi.createWorkout(workoutName, selectedExercises.map((e) => e.id));
      if (data.sucesso) {
        Alert.alert("Sucesso", "Treino recomendado criado!");
        setShowModal(false);
        setWorkoutName("");
        setSelectedExercises([]);
        loadData();
      } else {
        Alert.alert("Erro", "Erro ao criar treino");
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
              const data = await adminApi.deleteWorkout(workout.id_treino_admin);
              if (data.sucesso) {
                loadData();
              } else {
                Alert.alert("Erro", "Erro ao apagar treino");
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
        <Text style={{ fontSize: 28, fontWeight: "800", flex: 1, color: theme.text, letterSpacing: -0.5 }}>
          Treinos Recomendados
        </Text>
        <Pressable
          onPress={() => setShowModal(true)}
          accessibilityLabel="Criar treino"
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {workouts.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
              Nenhum treino recomendado criado
            </Text>
            <Pressable
              onPress={() => setShowModal(true)}
              accessibilityLabel="Criar treino"
              accessibilityRole="button"
              style={({ pressed }) => ({
                marginTop: 8,
                backgroundColor: theme.accent,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 14,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Criar Treino</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {workouts.map((workout, index) => (
              <View
                key={workout.id_treino_admin || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 16 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: workout.exercicios?.length ? 14 : 0 }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 13,
                    backgroundColor: theme.accent + "20",
                    justifyContent: "center", alignItems: "center", marginRight: 14,
                  }}>
                    <Ionicons name="barbell-outline" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.2 }}>
                      {workout.nome}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <View style={{ backgroundColor: theme.accent + "18", borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>
                          {workout.exercicios?.length || 0} exercícios
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => deleteWorkout(workout)}
                    accessibilityLabel="Apagar treino"
                    accessibilityRole="button"
                    style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>

                {workout.exercicios?.slice(0, 4).map((ex: any, i: number) => (
                  <View
                    key={i}
                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}
                  >
                    <View style={{ width: 5, height: 5, backgroundColor: theme.accent, borderRadius: 3, marginRight: 10 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{ex.nome}</Text>
                  </View>
                ))}
                {(workout.exercicios?.length || 0) > 4 && (
                  <View style={{ paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>+{workout.exercicios.length - 4} mais</Text>
                  </View>
                )}
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
              <Pressable onPress={() => setShowModal(false)} accessibilityRole="button" accessibilityLabel="Fechar" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
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
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                  Exercícios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 12, borderColor: theme.border, borderWidth: 1, marginBottom: 16 }}>
                    {selectedExercises.map((ex) => (
                      <Pressable
                        key={ex.id}
                        onPress={() => toggleExercise(ex)}
                        accessibilityLabel={`Remover ${ex.nome}`}
                        accessibilityRole="button"
                        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text style={{ color: theme.text }}>{ex.nome}</Text>
                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Adicionar Exercícios
              </Text>
              <View style={{ gap: 8, marginBottom: 24 }}>
                {exercises.map((exercise) => {
                  const isSelected = selectedExercises.find((e) => e.id === exercise.id);
                  return (
                    <Pressable
                      key={exercise.id}
                      onPress={() => toggleExercise(exercise)}
                      accessibilityLabel={isSelected ? `Remover ${exercise.nome}` : `Adicionar ${exercise.nome}`}
                      accessibilityRole="checkbox"
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderColor: isSelected ? theme.accent : theme.border,
                        borderWidth: 1,
                        backgroundColor: isSelected ? theme.accent + "15" : theme.backgroundSecondary,
                        opacity: pressed ? 0.7 : 1,
                      })}
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
                          color={isSelected ? theme.accent : theme.textSecondary}
                        />
                      </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopColor: theme.backgroundTertiary, borderTopWidth: 1 }}>
              <Pressable
                onPress={handleCreate}
                disabled={saving}
                accessibilityLabel="Criar treino recomendado"
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
                    Criar Treino Recomendado
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
