import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, workoutApi } from "../../services/api";
import { useTheme } from "../../styles/theme";

export default function Home() {
  const { user } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakHistory, setStreakHistory] = useState<Array<{day: string, date: string, completed: boolean}>>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalTime: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  // Gerar histórico de streak da semana (dom-sab)
  // Esta função cria um array com os 7 dias da semana atual
  function generateStreakWeek() {
    const today = new Date();
    // Calcular o domingo da semana atual (dia 0 = domingo)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekDays = [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    
    // Criar um dia para cada dia da semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push({
        day: dayNames[i],
        date: date.toISOString().split('T')[0], // Formato: YYYY-MM-DD
        completed: false // Será actualizado com dados reais
      });
    }
    
    return weekDays;
  }

  async function loadData() {
    try {
      const [workouts, statsData, streakData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        metricsApi.getStreak(user!.id).catch(() => null),
      ]);
      
      // Obter histórico de treinos para marcar dias com atividade
      const history = await metricsApi.getHistory(user!.id).catch(() => ({ treinos: [] }));
      const historyItems = history?.treinos || history || [];
      
      // Pegar os últimos 3 treinos (remover duplicados)
      let workoutsList = Array.isArray(workouts) ? workouts : [];
      
      // Remover duplicados - manter apenas um treino por tipo/nome
      const seenWorkouts = new Set<string>();
      const uniqueWorkouts = workoutsList.filter((workout) => {
        const key = workout.nome || workout.name || workout.id_treino;
        if (seenWorkouts.has(key)) {
          return false;
        }
        seenWorkouts.add(key);
        return true;
      });
      
      setRecentWorkouts(uniqueWorkouts.slice(0, 3) || []);
      
      // Actualizar streak week com dados reais
      const weekDays = generateStreakWeek();
      
      // Extrair datas dos treinos do histórico
      const workoutDates = new Set(
        (Array.isArray(historyItems) ? historyItems : []).map((item: any) => {
          const dateStr = item.data_inicio || item.data;
          if (dateStr) {
            // Converter para formato YYYY-MM-DD local (não UTC)
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return null;
        }).filter(Boolean)
      );
      
      console.log("Datas de treinos encontradas:", Array.from(workoutDates));
      console.log("Dias da semana para validação:", weekDays.map(d => d.date));
      
      // Marcar dias que têm treinos
      weekDays.forEach((day) => {
        day.completed = workoutDates.has(day.date);
      });
      
      console.log("Dias com streak marcados:", weekDays.filter(d => d.completed).map(d => d.day));
      
      setStreakHistory(weekDays);
      
      if (statsData) {
        setStats(statsData);
      }
      if (streakData) {
        setStreak(streakData.streak || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleStartWorkout(workout: any) {
    const workoutName = workout.nome || workout.name || "Treino";
    
    Alert.alert(
      "Começar Treino",
      `Deseja começar: ${workoutName}?`,
      [
        {
          text: "Cancelar",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim, começar",
          onPress: async () => {
            try {
              // Iniciar a sessão de treino
              const response = await workoutApi.startSession(user!.id, workout.id_treino);
              if (response.sucesso) {
                // Redirecionar para a página de treino
                router.push({
                  pathname: "/workout/[id]",
                  params: { 
                    id: workout.id_treino,
                    sessionId: response.id_sessao
                  }
                });
              }
            } catch (error) {
              Alert.alert("Erro", "Erro ao iniciar treino");
              console.error("Erro ao iniciar treino:", error);
            }
          },
          style: "default",
        },
      ]
    );
  }

  function getStreakColor(streak: number): string {
    if (streak === 0) return theme.textTertiary;
    if (streak <= 5) return theme.accentBlue;
    if (streak <= 10) return theme.accentGreen;
    if (streak <= 15) return "#f59e0b";
    if (streak <= 20) return theme.accent;
    return "#d946ef";
  }

  function getStreakBackgroundColor(streak: number): string {
    const colorMap: { [key: string]: string } = {
      [theme.textTertiary]: theme.backgroundTertiary,
      [theme.accentBlue]: theme.backgroundTertiary,
      [theme.accentGreen]: theme.backgroundTertiary,
      "#f59e0b": theme.backgroundTertiary,
      [theme.accent]: theme.backgroundTertiary,
      "#d946ef": theme.backgroundTertiary,
    };
    return colorMap[getStreakColor(streak)] || theme.backgroundTertiary;
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header com Streak */}
        <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 4 }}>
                Bem-vindo,
              </Text>
              <Text style={{ color: theme.text, fontSize: 28, fontWeight: "bold" }}>
                {user?.nome
                  ? user.nome.charAt(0).toUpperCase() + user.nome.slice(1)
                  : "Atleta"}
              </Text>
            </View>
            
            {/* Streak Badge - Interativa */}
            <TouchableOpacity
              onPress={() => setShowStreakModal(true)}
              style={{
                backgroundColor: getStreakBackgroundColor(streak),
                borderColor: getStreakColor(streak),
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="flame"
                size={20}
                color={getStreakColor(streak)}
                style={{ marginRight: 6 }}
              />
              <View>
                <Text style={{ color: getStreakColor(streak), fontWeight: "bold", fontSize: 16 }}>
                  {streak}
                </Text>
                <Text style={{ color: getStreakColor(streak), opacity: 0.6, fontSize: 11 }}>
                  dias
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
          <View style={{ backgroundColor: theme.backgroundTertiary, width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ionicons name="barbell" size={18} color={theme.text} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, marginBottom: 4 }}>
            {stats.totalWorkouts}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Treinos</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
          <View style={{ backgroundColor: theme.backgroundTertiary, width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ionicons name="calendar" size={18} color={theme.text} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, marginBottom: 4 }}>
            {stats.thisWeek}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Esta Semana</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
          <View style={{ backgroundColor: theme.backgroundTertiary, width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ionicons name="time" size={18} color={theme.text} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, marginBottom: 4 }}>
            {formatTime(stats.totalTime)}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Tempo</Text>
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>
            Treinos Recentes
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
              Ver todos
            </Text>
          </TouchableOpacity>
        </View>

        {recentWorkouts.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 32, alignItems: "center", borderColor: theme.border, borderWidth: 1 }}>
            <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: "center", fontSize: 14 }}>
              Ainda não tens treinos registados
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/workouts")}
              style={{ marginTop: 16, backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            >
              <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                Criar Primeiro Treino
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {recentWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={workout.id_sessao || workout.id_treino || index}
                onPress={() => handleStartWorkout(workout)}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", borderColor: theme.border, borderWidth: 1 }}
                activeOpacity={0.7}
              >
                <View style={{ backgroundColor: theme.backgroundTertiary, width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="barbell" size={22} color={theme.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                    {workout.nome || workout.name || "Treino"}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {workout.num_exercicios ?? 0} exercícios • {formatTime(workout.duracao_segundos || 0)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Motivational Quote */}
      <View style={{ paddingHorizontal: 24, marginTop: 24, marginBottom: 24 }}>
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 20, borderColor: theme.accent, borderWidth: 1, borderLeftWidth: 4 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "500", textAlign: "center", fontStyle: "italic", lineHeight: 24 }}>
            "O único treino mau é aquele que não aconteceu."
          </Text>
        </View>
      </View>
    </ScrollView>

    {/* Modal da Streak - Mostra a semana */}
    <Modal
      visible={showStreakModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStreakModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 24,
            borderColor: theme.border,
            borderWidth: 1,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Header do Modal */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
            <Ionicons
              name="flame"
              size={28}
              color={getStreakColor(streak)}
              style={{ marginRight: 12 }}
            />
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text, flex: 1 }}>
              Tua Sequência
            </Text>
            <TouchableOpacity onPress={() => setShowStreakModal(false)}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Número de dias */}
          <View
            style={{
              backgroundColor: getStreakBackgroundColor(streak),
              borderColor: getStreakColor(streak),
              borderWidth: 2,
              borderRadius: 12,
              paddingVertical: 16,
              marginBottom: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 48, fontWeight: "bold", color: getStreakColor(streak) }}>
              {streak}
            </Text>
            <Text style={{ fontSize: 14, color: getStreakColor(streak), marginTop: 4 }}>
              dias consecutivos
            </Text>
          </View>

          {/* Dias da semana */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 12 }}>
            Esta Semana
          </Text>
          
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {streakHistory.map((dayData, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Dia da semana */}
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.textSecondary }}>
                  {dayData.day}
                </Text>
                
                {/* Círculo do dia */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: dayData.completed
                      ? theme.accentGreen
                      : theme.backgroundTertiary,
                    borderColor: dayData.completed ? theme.accentGreen : theme.border,
                    borderWidth: 1,
                  }}
                >
                  {dayData.completed && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </View>
                
                {/* Data */}
                <Text style={{ fontSize: 10, color: theme.textTertiary }}>
                  {new Date(dayData.date).getDate()}
                </Text>
              </View>
            ))}
          </View>

          {/* Botão para fechar */}
          <TouchableOpacity
            onPress={() => setShowStreakModal(false)}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              Fechar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}
