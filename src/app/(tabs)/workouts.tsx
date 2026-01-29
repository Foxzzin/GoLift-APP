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
import { workoutApi, exerciseApi, metricsApi } from "../../services/api";
import { useTheme } from "../../styles/theme";

export default function Workouts() {
  const { user } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [adminWorkouts, setAdminWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);

  // Modal criar treino
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [modalFilterBodyPart, setModalFilterBodyPart] = useState<string | null>(null);

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
      
      // Remover duplicatas usando Set com nome do treino como chave
      const uniqueWorkouts = Array.from(
        new Map(
          (userWorkouts || []).map((w) => [w.nome + w.id_treino, w])
        ).values()
      );
      
      setMyWorkouts(uniqueWorkouts);
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
    setModalFilterBodyPart(null);
    setLoadingExercises(true);
    try {
      const exercises = await exerciseApi.getAll();
      console.log("Exercícios carregados:", exercises);
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

    // Verificar se treino com este nome já existe
    const treinoExistente = myWorkouts.find(
      (w) => w.nome.toLowerCase() === workoutName.trim().toLowerCase()
    );
    if (treinoExistente) {
      Alert.alert("Treino Duplicado", `Já existe um treino chamado "${workoutName}". Escolhe um nome diferente.`);
      return;
    }

    setSavingWorkout(true);
    try {
      const exerciseIds = selectedExercises.map((e) => e.id);
      const upperName = workoutName.charAt(0).toUpperCase() + workoutName.slice(1);
      await workoutApi.createWorkout(user!.id, upperName, exerciseIds);
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
    Alert.alert(
      "Começar Treino",
      `Deseja começar: ${workout.nome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim",
          style: "default",
          onPress: async () => {
            try {
              // Iniciar a sessão de treino
              const response = await workoutApi.startSession(user!.id, workout.id_treino);
              if (response.sucesso) {
                // Redirecionar para o treino
                router.push(`/workout/${workout.id_treino}`);
              }
            } catch (error) {
              Alert.alert("Erro", "Não foi possível iniciar o treino");
            }
          },
        },
      ]
    );
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
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.text }}>
            Treinos
          </Text>
        </View>

        {/* Treinos Recomendados */}
        {adminWorkouts.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: theme.text }}>
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
                  style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.accent,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 16,
                    width: 280,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: theme.backgroundTertiary,
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name="star" size={22} color={theme.accent} />
                  </View>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.text, marginBottom: 4 }}>
                      {workout.nome.charAt(0).toUpperCase() + workout.nome.slice(1)}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
                    {workout.exercicios?.length || 0} exercícios
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: theme.accent,
                      paddingVertical: 12,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                      Começar
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Meus Treinos */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: theme.text }}>
              Os Meus Treinos
            </Text>
            <TouchableOpacity
              onPress={openCreateModal}
              style={{
                backgroundColor: theme.accent,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "600", marginLeft: 6, fontSize: 14 }}>
                Novo
              </Text>
            </TouchableOpacity>
          </View>

          {myWorkouts.length === 0 ? (
            <View
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: 16,
                paddingVertical: 40,
                paddingHorizontal: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
              <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: "center", fontSize: 14 }}>
                Ainda não criaste nenhum treino
              </Text>
              <TouchableOpacity
                onPress={openCreateModal}
                style={{
                  marginTop: 16,
                  backgroundColor: theme.accent,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                  Criar Treino
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {myWorkouts.map((workout, index) => (
                <View
                  key={workout.id_treino || index}
                  style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="barbell" size={22} color={theme.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.text }}>
                        {workout.nome}
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                        {workout.num_exercicios ?? 0} exercícios
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteWorkout(workout)}
                      style={{ padding: 8 }}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.accent} />
                    </TouchableOpacity>
                  </View>

                  {/* Lista exercícios */}
                  {workout.exercicios?.slice(0, 3).map((ex: any, i: number) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderTopColor: theme.border,
                        borderTopWidth: i === 0 ? 1 : 0,
                      }}
                    >
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          backgroundColor: theme.text,
                          borderRadius: 2,
                          marginRight: 12,
                        }}
                      />
                      <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                        {ex.nome || ex.name}
                      </Text>
                    </View>
                  ))}
                  {(workout.exercicios?.length || 0) > 3 && (
                    <Text style={{ fontSize: 12, color: theme.textTertiary, marginTop: 8 }}>
                      +{workout.exercicios.length - 3} mais...
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => handleStartWorkout(workout)}
                    style={{
                      marginTop: 16,
                      backgroundColor: theme.accent,
                      paddingVertical: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="play" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
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
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "90%",
            }}
          >
            {/* Header Modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderBottomColor: theme.border,
                borderBottomWidth: 1,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}>
                Criar Treino
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 24, paddingTop: 24 }}>
              {/* Nome do treino */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500", fontSize: 14 }}>
                  Nome do Treino
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: theme.text,
                    fontSize: 16,
                  }}
                  placeholder="Ex: Treino de Peito"
                  placeholderTextColor={theme.textSecondary}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
              </View>

              {/* Exercícios selecionados */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: theme.text, marginBottom: 8, fontWeight: "500", fontSize: 14 }}>
                  Exercícios Selecionados ({selectedExercises.length})
                </Text>
                {selectedExercises.length > 0 && (
                  <View
                    style={{
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.accent,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      marginBottom: 16,
                    }}
                  >
                    {selectedExercises.map((ex, i) => (
                      <View
                        key={ex.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 8,
                          borderBottomColor: theme.border,
                          borderBottomWidth: i < selectedExercises.length - 1 ? 1 : 0,
                        }}
                      >
                        <Text style={{ color: theme.text, fontSize: 14 }}>
                          {ex.nome}
                        </Text>
                        <TouchableOpacity onPress={() => toggleExercise(ex)}>
                          <Ionicons name="close-circle" size={20} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Lista de exercícios disponíveis */}
              <Text style={{ color: theme.text, marginBottom: 12, fontWeight: "500", fontSize: 14 }}>
                Adicionar Exercícios
              </Text>

              {/* Carrossel de Filtro de Body Parts */}
              {!loadingExercises && availableExercises.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <TouchableOpacity
                      onPress={() => setModalFilterBodyPart(null)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 16,
                        backgroundColor:
                          modalFilterBodyPart === null ? theme.accent : theme.backgroundSecondary,
                        borderColor: modalFilterBodyPart === null ? theme.accent : theme.border,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        style={{
                          color: modalFilterBodyPart === null ? "white" : theme.textSecondary,
                          fontWeight: "600",
                          fontSize: 11,
                        }}
                      >
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {Array.from(
                      new Set(availableExercises.map((e) => e.category).filter(Boolean))
                    ).map((bodyPart) => (
                      <TouchableOpacity
                        key={bodyPart}
                        onPress={() => setModalFilterBodyPart(bodyPart)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          backgroundColor:
                            modalFilterBodyPart === bodyPart
                              ? theme.accent
                              : theme.backgroundSecondary,
                          borderColor:
                            modalFilterBodyPart === bodyPart ? theme.accent : theme.border,
                          borderWidth: 1,
                        }}
                      >
                        <Text
                          style={{
                            color:
                              modalFilterBodyPart === bodyPart
                                ? "white"
                                : theme.textSecondary,
                            fontWeight: "600",
                            fontSize: 11,
                            textTransform: "capitalize",
                          }}
                        >
                          {bodyPart === "full body"
                            ? "Full Body"
                            : String(bodyPart).charAt(0).toUpperCase() + String(bodyPart).slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {loadingExercises ? (
                <ActivityIndicator color={theme.accent} style={{ marginVertical: 24 }} />
              ) : (
                <View style={{ gap: 8, marginBottom: 24 }}>
                  {availableExercises
                    .filter((exercise) => {
                      if (modalFilterBodyPart && exercise.category !== modalFilterBodyPart) {
                        return false;
                      }
                      return true;
                    })
                    .map((exercise) => {
                      const isSelected = selectedExercises.find(
                        (e) => e.id === exercise.id
                      );
                      return (
                        <TouchableOpacity
                          key={exercise.id}
                          onPress={() => toggleExercise(exercise)}
                          style={{
                            backgroundColor: isSelected
                              ? theme.backgroundTertiary
                              : theme.backgroundSecondary,
                            borderColor: isSelected ? theme.accent : theme.border,
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                color: theme.text,
                                fontWeight: "500",
                                fontSize: 14,
                                marginBottom: 8,
                              }}
                            >
                              {exercise.nome}
                            </Text>
                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                              {exercise.category && (
                                <View
                                  style={{
                                    backgroundColor: theme.backgroundTertiary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 11,
                                      fontWeight: "500",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {exercise.category}
                                  </Text>
                                </View>
                              )}
                              {exercise.subType && (
                                <View
                                  style={{
                                    backgroundColor: theme.backgroundTertiary,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 11,
                                      fontWeight: "500",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {exercise.subType}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Ionicons
                            name={
                              isSelected ? "checkmark-circle" : "add-circle-outline"
                            }
                            size={24}
                            color={isSelected ? theme.accent : theme.textTertiary}
                          />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}
            </ScrollView>

            {/* Botão Criar */}
            <View
              style={{
                paddingHorizontal: 24,
                paddingVertical: 20,
                borderTopColor: theme.border,
                borderTopWidth: 1,
              }}
            >
              <TouchableOpacity
                onPress={handleCreateWorkout}
                disabled={savingWorkout}
                style={{
                  backgroundColor: theme.accent,
                  paddingVertical: 16,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {savingWorkout ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
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
