import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
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
  previousSeries?: Serie[]; // Dados do treino anterior
}

export default function WorkoutActive() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercicios, setExercicios] = useState<ExercicioAtivo[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const REST_DEFAULT = 90; // segundos

  // Partilha de resultados — gerida no ecrã summary

  useEffect(() => {
    loadWorkout();
    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
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

  function startRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(REST_DEFAULT);
    restTimerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(restTimerRef.current!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return null;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  }

  function skipRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(null);
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

  function toggleExpandir(_exercicioId: number) {
    // Exercícios sempre visíveis — função mantida por compatibilidade
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
    const exercicio = exercicios.find((ex) => ex.id === exercicioId);
    const serieAtual = exercicio?.series[serieIndex];
    if (serieAtual && !serieAtual.concluida) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startRestTimer();
    } else {
      skipRestTimer();
    }
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

            await workoutApi.saveSession(user!.id, Number(id), tempoDecorrido, todasAsSeries);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (timerRef.current) clearInterval(timerRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);

            // Calcular volume total e navegar para o ecrã de resumo
            const volume = todasAsSeries.reduce((acc, s) => acc + s.peso * s.repeticoes, 0);
            const exerciciosPayload = exercicios
              .map((ex) => ({
                nome: ex.nome,
                series: ex.series
                  .filter((s) => s.concluida)
                  .map((s) => ({ reps: parseInt(s.repeticoes) || 0, peso: parseFloat(s.peso) || 0 })),
              }))
              .filter((ex) => ex.series.length > 0);

            router.replace({
              pathname: "/workout/summary",
              params: {
                nome: workout?.nome || "Treino",
                duracao: String(tempoDecorrido),
                totalSeries: String(todasAsSeries.length),
                volume: String(Math.round(volume)),
                exercicios: JSON.stringify(exerciciosPayload),
              },
            });
          } catch (error) {
            console.error("Erro ao concluir treino:", error);
            Alert.alert("Erro", "Não foi possível guardar o treino");
          }
        },
      },
    ]);
  }

  // Calcular progresso global
  const totalSeries = exercicios.reduce((acc: number, ex: any) => acc + ex.series.length, 0);
  const seriesConcluidas = exercicios.reduce(
    (acc: number, ex: any) => acc + ex.series.filter((s: any) => s.concluida).length,
    0
  );
  const progressoPct = totalSeries > 0 ? seriesConcluidas / totalSeries : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 15 }}>A carregar treino...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* ── Header compacto ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: safeTop + 16, paddingBottom: 12 }}>
        <Pressable
          onPress={cancelarTreino}
          accessibilityLabel="Cancelar treino"
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 8, borderRadius: 12, backgroundColor: theme.backgroundSecondary })}
        >
          <Ionicons name="close" size={22} color={theme.textSecondary} />
        </Pressable>

        <View style={{ alignItems: "center", flex: 1, marginHorizontal: 12 }}>
          <Text
            numberOfLines={1}
            style={{ color: theme.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.3 }}
          >
            {workout?.nome || "Treino"}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 1 }}>
            {exercicios.length} exercícios
          </Text>
        </View>

        <Pressable
          onPress={concluirTreino}
          accessibilityLabel="Concluir treino"
          accessibilityRole="button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.85 : 1,
            backgroundColor: theme.accent,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
          })}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Concluir</Text>
        </Pressable>
      </View>

      {/* ── Barra de progresso global ── */}
      <View style={{ height: 3, backgroundColor: theme.backgroundTertiary, marginHorizontal: 20, borderRadius: 2, marginBottom: 4 }}>
        <View style={{ height: 3, width: `${progressoPct * 100}%` as any, backgroundColor: theme.accent, borderRadius: 2 }} />
      </View>

      {/* ── Banner de descanso ── */}
      {restTimer !== null && (
        <Pressable
          onPress={skipRestTimer}
          accessibilityLabel={`Descanso: ${restTimer} segundos restantes. Toca para saltar.`}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginHorizontal: 20,
            marginTop: 8,
            borderRadius: 16,
            backgroundColor: "#1E3A5F",
            padding: 14,
            opacity: pressed ? 0.8 : 1,
            overflow: "hidden",
          })}
        >
          {/* Barra de progresso do descanso */}
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(restTimer / REST_DEFAULT) * 100}%` as any, backgroundColor: "#007AFF22", borderRadius: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="timer-outline" size={18} color="#007AFF" />
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginLeft: 8, letterSpacing: 0.2 }}>
                Descanso
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ color: "#007AFF", fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
                {`${Math.floor(restTimer / 60).toString().padStart(2, "0")}:${(restTimer % 60).toString().padStart(2, "0")}`}
              </Text>
              <View style={{ backgroundColor: "#ffffff15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: "#ffffffaa", fontSize: 11, fontWeight: "600" }}>Saltar</Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      {/* ── Timer Herói ── */}
      <Pressable
        onPress={() => setTimerPaused(!timerPaused)}
        accessibilityLabel={timerPaused ? "Retomar cronómetro" : "Pausar cronómetro"}
        accessibilityRole="button"
        style={({ pressed }) => ({
          alignItems: "center",
          paddingVertical: 20,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: theme.text, fontSize: 52, fontWeight: "800", letterSpacing: -2, lineHeight: 56 }}>
          {formatarTempo(tempoDecorrido)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Ionicons
            name={timerPaused ? "play-circle" : "pause-circle"}
            size={16}
            color={timerPaused ? theme.accent : theme.textSecondary}
          />
          <Text style={{ color: timerPaused ? theme.accent : theme.textSecondary, fontSize: 12, fontWeight: "600", marginLeft: 4 }}>
            {timerPaused ? "PAUSADO" : "EM CURSO"}
          </Text>
        </View>
      </Pressable>

      {/* ── Lista de exercícios (sempre aberta) ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {exercicios.map((exercicio: any, index: number) => {
          const concluidas = exercicio.series.filter((s: any) => s.concluida).length;
          const todasConcluidas = concluidas === exercicio.series.length && exercicio.series.length > 0;

          return (
            <View
              key={exercicio.id}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20,
                marginBottom: 14,
                overflow: "hidden",
                flexDirection: "row",
              }}
            >
              {/* Stripe lateral */}
              <View style={{ width: 4, backgroundColor: todasConcluidas ? theme.accentGreen : theme.accent }} />

              <View style={{ flex: 1, padding: 16 }}>
                {/* Header do exercício */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: todasConcluidas ? theme.accentGreen + "20" : theme.accent + "18",
                    alignItems: "center", justifyContent: "center", marginRight: 10,
                  }}>
                    <Text style={{ color: todasConcluidas ? theme.accentGreen : theme.accent, fontSize: 12, fontWeight: "800" }}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700", letterSpacing: -0.3 }}>
                      {exercicio.nome}
                    </Text>
                    <Text style={{ color: todasConcluidas ? theme.accentGreen : theme.textSecondary, fontSize: 12, marginTop: 1 }}>
                      {concluidas}/{exercicio.series.length} séries{todasConcluidas ? " ✓" : ""}
                    </Text>
                  </View>
                </View>

                {/* Header da tabela */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", width: 36 }}>Nº</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", flex: 1, textAlign: "center" }}>KG</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", flex: 1, textAlign: "center" }}>REPS</Text>
                  <View style={{ width: 44 }} />
                </View>

                {/* Séries */}
                {exercicio.series.map((serie: any, serieIndex: number) => (
                  <View
                    key={serieIndex}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      opacity: serie.concluida ? 0.55 : 1,
                    }}
                  >
                    <Text style={{ color: theme.textTertiary, fontSize: 13, fontWeight: "600", width: 36 }}>
                      {serie.numero}
                    </Text>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <TextInput
                        style={{
                          backgroundColor: theme.backgroundTertiary,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                          color: theme.text,
                          textAlign: "center",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                        placeholder={getPlaceholder(exercicio.id, serieIndex, "peso")}
                        placeholderTextColor={theme.accent + "55"}
                        keyboardType="decimal-pad"
                        value={serie.peso}
                        onChangeText={(v: string) => atualizarSerie(exercicio.id, serieIndex, "peso", v)}
                        onFocus={() => setFocusedField(`peso-${exercicio.id}-${serieIndex}`)}
                        onBlur={() => setFocusedField(null)}
                        editable={!serie.concluida}
                      />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 6 }}>
                      <TextInput
                        style={{
                          backgroundColor: theme.backgroundTertiary,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                          color: theme.text,
                          textAlign: "center",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                        placeholder={getPlaceholder(exercicio.id, serieIndex, "repeticoes")}
                        placeholderTextColor={theme.accent + "55"}
                        keyboardType="number-pad"
                        value={serie.repeticoes}
                        onChangeText={(v: string) => atualizarSerie(exercicio.id, serieIndex, "repeticoes", v)}
                        onFocus={() => setFocusedField(`reps-${exercicio.id}-${serieIndex}`)}
                        onBlur={() => setFocusedField(null)}
                        editable={!serie.concluida}
                      />
                    </View>
                    <Pressable
                      onPress={() => {
                        autoFillFromPrevious(exercicio.id, serieIndex);
                        toggleSerieConcluida(exercicio.id, serieIndex);
                      }}
                      accessibilityLabel={serie.concluida ? "Desmarcar série" : "Marcar série como concluída"}
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 4,
                        opacity: pressed ? 0.7 : 1,
                        backgroundColor: serie.concluida ? theme.accentGreen : theme.backgroundTertiary,
                      })}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={serie.concluida ? "#fff" : theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                ))}

                {/* Adicionar série */}
                <Pressable
                  onPress={() => adicionarSerie(exercicio.id)}
                  accessibilityLabel="Adicionar série"
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 10,
                    marginTop: 4,
                    opacity: pressed ? 0.6 : 1,
                    borderRadius: 12,
                    backgroundColor: theme.accent + "12",
                  })}
                >
                  <Ionicons name="add" size={16} color={theme.accent} />
                  <Text style={{ color: theme.accent, marginLeft: 6, fontSize: 13, fontWeight: "600" }}>Adicionar Série</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Botão flutuante: Concluir Treino ── */}
      <View style={{ position: "absolute", bottom: 32, left: 20, right: 20 }}>
        <Pressable
          onPress={concluirTreino}
          accessibilityLabel="Concluir treino"
          accessibilityRole="button"
          style={({ pressed }) => ({
            backgroundColor: theme.accent,
            paddingVertical: 18,
            borderRadius: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            opacity: pressed ? 0.88 : 1,
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.38,
            shadowRadius: 14,
            elevation: 8,
          })}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17, marginLeft: 8, letterSpacing: -0.3 }}>
            Concluir Treino
          </Text>
          {totalSeries > 0 && (
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", marginLeft: 8 }}>
              {seriesConcluidas}/{totalSeries}
            </Text>
          )}
        </Pressable>
      </View>

    </View>
  );
}
