import React, { useState, useEffect } from "react";
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
  FlatList,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { workoutApi, exerciseApi } from "../../services/api";
import { useTheme } from "../../styles/theme";

export default function Workouts() {
  const { user } = useAuth();
  const theme = useTheme();
  const { userCommunities, sendMessage } = useCommunities();
  const [refreshing, setRefreshing] = useState(false);
  const [myWorkouts, setMyWorkouts] = useState<any[]>([]);
  const [adminWorkouts, setAdminWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);

  // Partilha de treino
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareWorkoutData, setShareWorkoutData] = useState<any>(null);
  const [sharingToComm, setSharingToComm] = useState(false);

  // Modal criar / editar treino
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any>(null); // null = criar, objeto = editar
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
      const userWorkouts = await workoutApi.getUserWorkouts(user!.id).catch(() => []);
      
      // Remover duplicatas usando Set com nome do treino como chave
      const uniqueWorkouts = Array.from(
        new Map(
          (userWorkouts || []).map((w) => [w.nome + w.id_treino, w])
        ).values()
      );
      
      setMyWorkouts(uniqueWorkouts);
      setAdminWorkouts([]);
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
    setEditingWorkout(null);
    setShowCreateModal(true);
    setWorkoutName("");
    setSelectedExercises([]);
    setModalFilterBodyPart(null);
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

  async function openEditModal(workout: any) {
    setEditingWorkout(workout);
    setShowCreateModal(true);
    setWorkoutName(workout.nome);
    setSelectedExercises([]);
    setModalFilterBodyPart(null);
    setLoadingExercises(true);
    try {
      const [exercises, workoutExs] = await Promise.all([
        exerciseApi.getAll(),
        workoutApi.getWorkoutExercises(workout.id_treino).catch(() => ({ exercicios: [] })),
      ]);
      const allExs = exercises || [];
      setAvailableExercises(allExs);
      // Pré-selecionar os exercícios atuais do treino
      const currentIds = new Set((workoutExs?.exercicios || []).map((e: any) => e.id_exercicio));
      const preSelected = allExs.filter((e: any) => currentIds.has(e.id));
      setSelectedExercises(preSelected);
    } catch (error) {
      console.error("Erro ao carregar exercícios:", error);
    } finally {
      setLoadingExercises(false);
    }
  }

  function toggleExercise(exercise: any) {
    if (selectedExercises.find((e: any) => e.id === exercise.id)) {
      setSelectedExercises(selectedExercises.filter((e: any) => e.id !== exercise.id));
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
      (w: any) => w.nome.toLowerCase() === workoutName.trim().toLowerCase()
    );
    if (treinoExistente) {
      Alert.alert("Treino Duplicado", `Já existe um treino chamado "${workoutName}". Escolhe um nome diferente.`);
      return;
    }

    setSavingWorkout(true);
    try {
      const exerciseIds = selectedExercises.map((e: any) => e.id);
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

  async function handleUpdateWorkout() {
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
      const exerciseIds = selectedExercises.map((e: any) => e.id);
      const upperName = workoutName.charAt(0).toUpperCase() + workoutName.slice(1);
      await workoutApi.updateWorkout(user!.id, editingWorkout.id_treino, upperName, exerciseIds);
      Alert.alert("Guardado! ✅", "Treino atualizado com sucesso.");
      setShowCreateModal(false);
      setEditingWorkout(null);
      loadData();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar treino");
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
              router.push(`/workout/${workout.id_treino}`);
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
      `Tens a certeza que queres apagar "${workout.nome}"? O histórico de sessões também será apagado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await workoutApi.deleteWorkout(user!.id, workout.id_treino);
              loadData();
            } catch (error: any) {
              Alert.alert("Erro", error.message || "Não foi possível apagar o treino");
            }
          },
        },
      ]
    );
  }

  function handleShareTemplate(workout: any) {
    if (userCommunities.length === 0) {
      Alert.alert("Sem comunidades", "Entra numa comunidade para poderes partilhar treinos.");
      return;
    }
    setShareWorkoutData(workout);
    setShowShareModal(true);
  }

  async function sendShareToCommunity(community: any) {
    if (!shareWorkoutData || sharingToComm) return;
    setSharingToComm(true);
    try {
      // Carregar exercícios com IDs do servidor
      const resp = await workoutApi.getWorkoutExercises(shareWorkoutData.id_treino).catch(() => ({ exercicios: [] }));
      const exercicios = (resp?.exercicios || []).map((ex: any) => ({
        id: ex.id_exercicio,
        nome: ex.nome,
        grupo_tipo: ex.grupo_tipo || null,
      }));
      const payload = JSON.stringify({
        tipo: "template",
        nome: shareWorkoutData.nome,
        exercicios,
      });
      await sendMessage(community.id, `🏋️__SHARE__${payload}`);
      setShowShareModal(false);
      Alert.alert("Partilhado! 💪", `Treino enviado para ${community.nome}`);
    } catch {
      Alert.alert("Erro", "Não foi possível partilhar o treino");
    } finally {
      setSharingToComm(false);
    }
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
        contentContainerStyle={{ paddingBottom: 120 }}
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
              {adminWorkouts.map((workout: any, index: number) => (
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
              {myWorkouts.map((workout: any, index: number) => (
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
                      onPress={() => handleShareTemplate(workout)}
                      style={{ padding: 8, marginRight: 4 }}
                    >
                      <Ionicons name="share-social-outline" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditModal(workout)}
                      style={{ padding: 8, marginRight: 4 }}
                    >
                      <Ionicons name="create-outline" size={20} color={theme.accent} />
                    </TouchableOpacity>
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
        onRequestClose={() => { setShowCreateModal(false); setEditingWorkout(null); }}
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
                {editingWorkout ? "Editar Treino" : "Criar Treino"}
              </Text>
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setEditingWorkout(null); }}>
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
                    {selectedExercises.map((ex: any, i: number) => (
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
                      new Set(availableExercises.map((e: any) => e.category).filter(Boolean))
                    ).map((bodyPart: any) => (
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
                    .filter((exercise: any) => {
                      if (modalFilterBodyPart && exercise.category !== modalFilterBodyPart) {
                        return false;
                      }
                      return true;
                    })
                    .map((exercise: any) => {
                      const isSelected = selectedExercises.find(
                        (e: any) => e.id === exercise.id
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
                onPress={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
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
                    {editingWorkout ? "Guardar Alterações" : "Criar Treino"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Partilhar Template de Treino */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" }}
            activeOpacity={1}
            onPress={() => setShowShareModal(false)}
          />
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%" }}>
              <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />

              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>Partilhar Treino</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                    🏋️‍♂️ {shareWorkoutData?.nome} — Escolhe uma comunidade
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowShareModal(false)}
                  style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 20, padding: 8 }}
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={userCommunities}
                keyExtractor={(item) => String(item.id)}
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => sendShareToCommunity(item)}
                    disabled={sharingToComm}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.backgroundTertiary,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: theme.background, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                      <Ionicons name="people" size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{item.nome}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{item.membros} membros</Text>
                    </View>
                    {sharingToComm ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Ionicons name="send" size={18} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                )}
              />
          </View>
        </View>
      </Modal>
    </View>
  );
}
