import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { useTheme } from "../../styles/theme";
import { workoutApi, metricsApi } from "../../services/api";

interface Serie {
  numero: number;
  repeticoes: string;
  peso: string;
  concluida: boolean;
}

interface ExercicioAtivo {
  id: number;
  nome: string;
  series: Serie[];
  expandido: boolean;
  previousSeries?: Serie[]; // Dados do treino anterior
}

export default function WorkoutActive() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { userCommunities, sendMessage } = useCommunities();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercicios, setExercicios] = useState<ExercicioAtivo[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // Partilha de resultados
  const [showShareResultsModal, setShowShareResultsModal] = useState(false);
  const [shareResultsData, setShareResultsData] = useState<any>(null);
  const [sharingToComm, setSharingToComm] = useState(false);

  useEffect(() => {
    loadWorkout();
    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function startTimer() {
    timerRef.current = setInterval(() => {
      if (!timerPaused) {
        setTempoDecorrido((prev: number) => prev + 1);
      }
    }, 1000) as unknown as number;
  }

  async function loadWorkout() {
    try {
      // Carregar todos os treinos do utilizador
      const allWorkouts = await workoutApi.getUserWorkouts(user!.id).catch(() => []);
      
      // Encontrar e guardar o treino atual (Bug 1: setWorkout nunca era chamado)
      const currentWorkout = allWorkouts.find((w: any) => w.id_treino === Number(id));
      if (currentWorkout) setWorkout(currentWorkout);

      // Carregar exercícios diretamente (Bug 2: antes só carregava se exercicios_nomes não fosse vazio)
      const response = await workoutApi.getWorkoutExercises(Number(id)).catch(() => ({ exercicios: [] }));
      const exerciciosDoTreino: any[] = response?.exercicios || [];

      if (exerciciosDoTreino.length === 0) {
        Alert.alert("Aviso", "Este treino não tem exercícios definidos.");
      }

      // Bug 5: Buscar dados da última sessão DESTE treino específico para sugestões
      let previousWorkoutData: any = null;
      const history = await metricsApi.getHistory(user!.id).catch(() => []);
      const thisTreinoSession = Array.isArray(history)
        ? history.find((s: any) => s.id_treino === Number(id))
        : null;
      if (thisTreinoSession?.id_sessao) {
        previousWorkoutData = await metricsApi.getSessionDetails(thisTreinoSession.id_sessao).catch(() => null);
      }

      // Transformar exercícios para o formato ativo
      const exerciciosAtivos: ExercicioAtivo[] = exerciciosDoTreino.map((ex: any) => {
        let previousSeries: Serie[] | undefined = undefined;
        
        // Procurar dados do treino anterior
        if (previousWorkoutData?.exercicios) {
          const previousEx = previousWorkoutData.exercicios.find(
            (pex: any) => pex.id_exercicio === ex.id_exercicio
          );
          if (previousEx?.series) {
            previousSeries = previousEx.series.map((s: any) => ({
              numero: s.numero_serie,
              repeticoes: String(s.repeticoes ?? ""),
              peso: String(s.peso ?? ""),
              concluida: false,
            }));
          }
        }

        return {
          id: ex.id_exercicio,
          nome: ex.nome,
          expandido: false,
          previousSeries,
          series: [
            { numero: 1, repeticoes: "", peso: "", concluida: false },
            { numero: 2, repeticoes: "", peso: "", concluida: false },
            { numero: 3, repeticoes: "", peso: "", concluida: false },
          ],
        };
      });
      
      setExercicios(exerciciosAtivos);
    } catch (error) {
      console.error("Erro ao carregar treino:", error);
      Alert.alert("Erro", "Não foi possível carregar o treino");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  function formatarTempo(segundos: number) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, "0")}:${segs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutos.toString().padStart(2, "0")}:${segs
      .toString()
      .padStart(2, "0")}`;
  }

  // Obter placeholder/sugestão do treino anterior
  function getPlaceholder(exercicioId: number, serieIndex: number, campo: "peso" | "repeticoes"): string {
    const exercicio = exercicios.find((ex: any) => ex.id === exercicioId);
    if (!exercicio?.previousSeries || !exercicio.previousSeries[serieIndex]) {
      return "-";
    }
    return campo === "peso" ? exercicio.previousSeries[serieIndex].peso : exercicio.previousSeries[serieIndex].repeticoes;
  }

  // Auto-preencher com dados anteriores quando clica no check
  function autoFillFromPrevious(exercicioId: number, serieIndex: number) {
    const exercicio = exercicios.find((ex: any) => ex.id === exercicioId);
    if (!exercicio?.previousSeries || !exercicio.previousSeries[serieIndex]) {
      return;
    }

    const previousSerie = exercicio.previousSeries[serieIndex];
    if (!exercicio.series[serieIndex].peso) {
      atualizarSerie(exercicioId, serieIndex, "peso", previousSerie.peso);
    }
    if (!exercicio.series[serieIndex].repeticoes) {
      atualizarSerie(exercicioId, serieIndex, "repeticoes", previousSerie.repeticoes);
    }
  }

  function toggleExpandir(exercicioId: number) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId ? { ...ex, expandido: !ex.expandido } : ex
      )
    );
  }

  function atualizarSerie(
    exercicioId: number,
    serieIndex: number,
    campo: "repeticoes" | "peso",
    valor: string
  ) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s: any, i: number) =>
                i === serieIndex ? { ...s, [campo]: valor } : s
              ),
            }
          : ex
      )
    );
  }

  function toggleSerieConcluida(exercicioId: number, serieIndex: number) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s: any, i: number) =>
                i === serieIndex ? { ...s, concluida: !s.concluida } : s
              ),
            }
          : ex
      )
    );
  }

  function adicionarSerie(exercicioId: number) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: [
                ...ex.series,
                {
                  numero: ex.series.length + 1,
                  repeticoes: "",
                  peso: "",
                  concluida: false,
                },
              ],
            }
          : ex
      )
    );
  }

  function cancelarTreino() {
    Alert.alert(
      "Cancelar Treino",
      "Tens a certeza? Todo o progresso será perdido.",
      [
        { text: "Continuar Treino", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => {
            // Bug 6: parar o timer ao cancelar
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          },
        },
      ]
    );
  }

  async function concluirTreino() {
    // Verificar se há pelo menos uma série concluída
    const temSeriesConcluidas = exercicios.some((ex: any) =>
      ex.series.some((s: any) => s.concluida)
    );

    if (!temSeriesConcluidas) {
      Alert.alert("Atenção", "Completa pelo menos uma série antes de terminar.");
      return;
    }

    Alert.alert("Concluir Treino", "Queres terminar este treino?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Concluir",
        onPress: async () => {
          try {
            // Construir lista de todas as séries concluídas
            const todasAsSeries: { id_exercicio: number; numero_serie: number; repeticoes: number; peso: number }[] = [];
            for (const exercicio of exercicios) {
              for (const serie of exercicio.series.filter((s: any) => s.concluida)) {
                todasAsSeries.push({
                  id_exercicio: exercicio.id,
                  numero_serie: serie.numero,
                  repeticoes: parseInt(serie.repeticoes) || 0,
                  peso: parseFloat(serie.peso) || 0,
                });
              }
            }

            // Guardar sessão completa num único request
            await workoutApi.saveSession(user!.id, Number(id), tempoDecorrido, todasAsSeries);

            // Parar timer
            if (timerRef.current) clearInterval(timerRef.current);

            // Mostrar opção de partilha se houver comunidades
            if (userCommunities.length > 0) {
              const resultsPayload = {
                nome: workout?.nome || "Treino",
                duracao: tempoDecorrido,
                exercicios: exercicios.map((ex) => ({
                  nome: ex.nome,
                  series: ex.series
                    .filter((s) => s.concluida)
                    .map((s) => ({ reps: parseInt(s.repeticoes) || 0, peso: parseFloat(s.peso) || 0 })),
                })).filter((ex) => ex.series.length > 0),
              };
              setShareResultsData(resultsPayload);
              setShowShareResultsModal(true);
            } else {
              Alert.alert("Parabéns! 🎉", "Treino concluído com sucesso!", [
                { text: "OK", onPress: () => router.back() },
              ]);
            }
          } catch (error) {
            console.error("Erro ao concluir treino:", error);
            Alert.alert("Erro", "Não foi possível guardar o treino");
          }
        },
      },
    ]);
  }

  async function sendShareResultsToCommunity(community: any) {
    if (!shareResultsData || sharingToComm) return;
    setSharingToComm(true);
    try {
      const payload = JSON.stringify({ tipo: "resultado", ...shareResultsData });
      await sendMessage(community.id, `\u{1F3CB}\uFE0F__SHARE__${payload}`);
      setShowShareResultsModal(false);
      Alert.alert("Partilhado! 💪", `Resultados enviados para ${community.nome}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível partilhar");
      setShowShareResultsModal(false);
      router.back();
    } finally {
      setSharingToComm(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={{ color: theme.textSecondary, marginTop: 16 }}>A carregar treino...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.border, borderBottomWidth: 1 }}>
        <TouchableOpacity onPress={cancelarTreino} style={{ padding: 8 }}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTimerPaused(!timerPaused)}
          style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
        >
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>
            {formatarTempo(tempoDecorrido)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={concluirTreino}
          style={{ backgroundColor: theme.text, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 }}
        >
          <Ionicons name="checkmark" size={24} color={theme.background} />
        </TouchableOpacity>
      </View>

      {/* Título do treino */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>
          {workout?.nome || "Treino"}
        </Text>
        <Text style={{ color: theme.textSecondary }}>
          {exercicios.length} exercícios
        </Text>
      </View>

      {/* Lista de exercícios */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {exercicios.map((exercicio: any, index: number) => (
          <View
            key={exercicio.id}
            style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, marginBottom: 16, borderColor: theme.border, borderWidth: 1, overflow: "hidden" }}
          >
            {/* Header do exercício */}
            <TouchableOpacity
              onPress={() => toggleExpandir(exercicio.id)}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                  <Text style={{ color: theme.text, fontWeight: "bold" }}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600" }}>{exercicio.nome}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {exercicio.series.filter((s: any) => s.concluida).length}/{exercicio.series.length} séries
                  </Text>
                </View>
              </View>
              <Ionicons
                name={exercicio.expandido ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {/* Séries (expandido) */}
            {exercicio.expandido && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {/* Header da tabela */}
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomColor: theme.border, borderBottomWidth: 1 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, width: 64 }}>Série</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, flex: 1, textAlign: "center" }}>
                    Peso (kg)
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, flex: 1, textAlign: "center" }}>
                    Reps
                  </Text>
                  <View style={{ width: 48 }} />
                </View>

                {/* Séries */}
                {exercicio.series.map((serie: any, serieIndex: number) => (
                  <View
                    key={serieIndex}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomColor: theme.border,
                      borderBottomWidth: 1,
                      opacity: serie.concluida ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", width: 64 }}>
                      {serie.numero}
                    </Text>
                    <View style={{ flex: 1, paddingHorizontal: 8, position: "relative" }}>
                      <TextInput
                        style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.text, textAlign: "center" }}
                        placeholder={getPlaceholder(exercicio.id, serieIndex, "peso")}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={serie.peso}
                        onChangeText={(v: string) => {
                          atualizarSerie(exercicio.id, serieIndex, "peso", v);
                          if (v.length > 0) setFocusedField(null); // Limpar dados anteriores quando começa a digitar
                        }}
                        onFocus={() => setFocusedField(`peso-${exercicio.id}-${serieIndex}`)}
                        onBlur={() => setFocusedField(null)}
                        editable={!serie.concluida}
                      />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <TextInput
                        style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.text, textAlign: "center" }}
                        placeholder={getPlaceholder(exercicio.id, serieIndex, "repeticoes")}
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                        value={serie.repeticoes}
                        onChangeText={(v: string) => {
                          atualizarSerie(exercicio.id, serieIndex, "repeticoes", v);
                          if (v.length > 0) setFocusedField(null); // Limpar dados anteriores quando começa a digitar
                        }}
                        onFocus={() => setFocusedField(`reps-${exercicio.id}-${serieIndex}`)}
                        onBlur={() => setFocusedField(null)}
                        editable={!serie.concluida}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        autoFillFromPrevious(exercicio.id, serieIndex); // Auto-preencher se não tiver valores
                        toggleSerieConcluida(exercicio.id, serieIndex);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: serie.concluida ? theme.text : theme.backgroundTertiary
                      }}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={serie.concluida ? theme.background : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Adicionar série */}
                <TouchableOpacity
                  onPress={() => adicionarSerie(exercicio.id)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, marginTop: 8, borderColor: theme.border, borderWidth: 1, borderStyle: "dashed", borderRadius: 12 }}
                >
                  <Ionicons name="add" size={20} color={theme.text} />
                  <Text style={{ color: theme.text, marginLeft: 8 }}>Adicionar Série</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Botão flutuante concluir */}
      <View style={{ position: "absolute", bottom: 32, left: 24, right: 24 }}>
        <TouchableOpacity
          onPress={concluirTreino}
          style={{ backgroundColor: theme.text, paddingVertical: 16, borderRadius: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
        >
          <Ionicons name="checkmark-circle" size={24} color={theme.background} />
          <Text style={{ color: theme.background, fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
            Concluir Treino
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Partilhar Resultados */}
      <Modal
        visible={showShareResultsModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowShareResultsModal(false); router.back(); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%" }}>
            <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />

            <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "700" }}>Parabéns! 🎉</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>
                Treino concluído! Queres partilhar os resultados numa comunidade?
              </Text>
            </View>

            {/* Preview do treino */}
            {shareResultsData && (
              <View style={{ marginHorizontal: 24, marginBottom: 16, backgroundColor: theme.backgroundTertiary, borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, flex: 1 }}>{shareResultsData.nome}</Text>
                  <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>
                    ⏱ {Math.floor(shareResultsData.duracao / 60)} min
                  </Text>
                </View>
                {shareResultsData.exercicios?.slice(0, 3).map((ex: any, i: number) => (
                  <Text key={i} style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    • {ex.nome} — {ex.series.length} série{ex.series.length !== 1 ? "s" : ""}
                  </Text>
                ))}
              </View>
            )}

            <FlatList
              data={userCommunities}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              ListHeaderComponent={
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  Escolhe uma comunidade
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => sendShareResultsToCommunity(item)}
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

            <TouchableOpacity
              onPress={() => { setShowShareResultsModal(false); router.back(); }}
              style={{ marginHorizontal: 24, marginBottom: 32, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: theme.border }}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Não partilhar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
