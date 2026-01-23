import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { workoutApi } from "../../services/api";

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
}

export default function WorkoutActive() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercicios, setExercicios] = useState<ExercicioAtivo[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [sessaoId, setSessaoId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        setTempoDecorrido((prev) => prev + 1);
      }
    }, 1000);
  }

  async function loadWorkout() {
    try {
      // Carregar detalhes do treino
      const data = await workoutApi.getWorkoutDetails(user!.id, Number(id));
      setWorkout(data);

      // Iniciar sessão de treino
      const sessaoResponse = await workoutApi.startSession(user!.id, Number(id));
      if (sessaoResponse.sucesso && sessaoResponse.id_sessao) {
        setSessaoId(sessaoResponse.id_sessao);
      }

      // Transformar exercícios para o formato ativo
      const exerciciosAtivos: ExercicioAtivo[] = (data.exercicios || []).map(
        (ex: any) => ({
          id: ex.id || ex.id_exercicio,
          nome: ex.nome,
          expandido: false,
          series: [
            { numero: 1, repeticoes: "", peso: "", concluida: false },
            { numero: 2, repeticoes: "", peso: "", concluida: false },
            { numero: 3, repeticoes: "", peso: "", concluida: false },
          ],
        })
      );
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

  function toggleExpandir(exercicioId: number) {
    setExercicios(
      exercicios.map((ex) =>
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
      exercicios.map((ex) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s, i) =>
                i === serieIndex ? { ...s, [campo]: valor } : s
              ),
            }
          : ex
      )
    );
  }

  function toggleSerieConcluida(exercicioId: number, serieIndex: number) {
    setExercicios(
      exercicios.map((ex) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s, i) =>
                i === serieIndex ? { ...s, concluida: !s.concluida } : s
              ),
            }
          : ex
      )
    );
  }

  function adicionarSerie(exercicioId: number) {
    setExercicios(
      exercicios.map((ex) =>
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
          onPress: () => router.back(),
        },
      ]
    );
  }

  async function concluirTreino() {
    // Verificar se há pelo menos uma série concluída
    const temSeriesConcluidas = exercicios.some((ex) =>
      ex.series.some((s) => s.concluida)
    );

    if (!temSeriesConcluidas) {
      Alert.alert("Atenção", "Completa pelo menos uma série antes de terminar.");
      return;
    }

    if (!sessaoId) {
      Alert.alert("Erro", "Sessão não iniciada corretamente");
      return;
    }

    Alert.alert("Concluir Treino", "Queres terminar este treino?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Concluir",
        onPress: async () => {
          try {
            // Guardar todas as séries concluídas
            for (const exercicio of exercicios) {
              const seriesConcluidas = exercicio.series.filter((s) => s.concluida);
              for (const serie of seriesConcluidas) {
                await workoutApi.addSerie(sessaoId, {
                  id_exercicio: exercicio.id,
                  numero_serie: serie.numero,
                  repeticoes: parseInt(serie.repeticoes) || 0,
                  peso: parseFloat(serie.peso) || 0,
                });
              }
            }

            // Finalizar a sessão
            await workoutApi.finishSession(sessaoId, tempoDecorrido);
            
            Alert.alert("Parabéns! 🎉", "Treino concluído com sucesso!", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (error) {
            console.error("Erro ao concluir treino:", error);
            Alert.alert("Erro", "Não foi possível guardar o treino");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0d1b2a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">A carregar treino...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0d1b2a]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4 bg-[#1a2332] border-b border-white/10">
        <TouchableOpacity onPress={cancelarTreino} className="p-2">
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTimerPaused(!timerPaused)}
          className="bg-white/10 px-4 py-2 rounded-xl"
        >
          <Text className="text-white text-xl font-bold">
            {formatarTempo(tempoDecorrido)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={concluirTreino}
          className="bg-blue-600 p-3 rounded-xl"
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Título do treino */}
      <View className="px-6 py-4">
        <Text className="text-white text-xl font-bold">
          {workout?.nome || "Treino"}
        </Text>
        <Text className="text-gray-400">
          {exercicios.length} exercícios
        </Text>
      </View>

      {/* Lista de exercícios */}
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        {exercicios.map((exercicio, index) => (
          <View
            key={exercicio.id}
            className="bg-white/5 rounded-2xl mb-4 border border-white/10 overflow-hidden"
          >
            {/* Header do exercício */}
            <TouchableOpacity
              onPress={() => toggleExpandir(exercicio.id)}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
                  <Text className="text-blue-400 font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{exercicio.nome}</Text>
                  <Text className="text-gray-400 text-sm">
                    {exercicio.series.filter((s) => s.concluida).length}/{exercicio.series.length} séries
                  </Text>
                </View>
              </View>
              <Ionicons
                name={exercicio.expandido ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>

            {/* Séries (expandido) */}
            {exercicio.expandido && (
              <View className="px-4 pb-4">
                {/* Header da tabela */}
                <View className="flex-row items-center py-2 border-b border-white/10">
                  <Text className="text-gray-400 text-sm w-16">Série</Text>
                  <Text className="text-gray-400 text-sm flex-1 text-center">
                    Peso (kg)
                  </Text>
                  <Text className="text-gray-400 text-sm flex-1 text-center">
                    Reps
                  </Text>
                  <View className="w-12" />
                </View>

                {/* Séries */}
                {exercicio.series.map((serie, serieIndex) => (
                  <View
                    key={serieIndex}
                    className={`flex-row items-center py-3 border-b border-white/5 ${
                      serie.concluida ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white text-sm w-16 font-medium">
                      {serie.numero}
                    </Text>
                    <View className="flex-1 px-2">
                      <TextInput
                        className="bg-white/10 rounded-lg px-3 py-2 text-white text-center"
                        placeholder="-"
                        placeholderTextColor="#6b7280"
                        keyboardType="decimal-pad"
                        value={serie.peso}
                        onChangeText={(v) =>
                          atualizarSerie(exercicio.id, serieIndex, "peso", v)
                        }
                        editable={!serie.concluida}
                      />
                    </View>
                    <View className="flex-1 px-2">
                      <TextInput
                        className="bg-white/10 rounded-lg px-3 py-2 text-white text-center"
                        placeholder="-"
                        placeholderTextColor="#6b7280"
                        keyboardType="number-pad"
                        value={serie.repeticoes}
                        onChangeText={(v) =>
                          atualizarSerie(exercicio.id, serieIndex, "repeticoes", v)
                        }
                        editable={!serie.concluida}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleSerieConcluida(exercicio.id, serieIndex)}
                      className={`w-10 h-10 rounded-xl items-center justify-center ${
                        serie.concluida ? "bg-green-500" : "bg-white/10"
                      }`}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={serie.concluida ? "white" : "#6b7280"}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Adicionar série */}
                <TouchableOpacity
                  onPress={() => adicionarSerie(exercicio.id)}
                  className="flex-row items-center justify-center py-3 mt-2 border border-dashed border-white/20 rounded-xl"
                >
                  <Ionicons name="add" size={20} color="#3b82f6" />
                  <Text className="text-blue-500 ml-2">Adicionar Série</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Botão flutuante concluir */}
      <View className="absolute bottom-8 left-6 right-6">
        <TouchableOpacity
          onPress={concluirTreino}
          className="bg-blue-600 py-4 rounded-2xl items-center flex-row justify-center"
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            Concluir Treino
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
