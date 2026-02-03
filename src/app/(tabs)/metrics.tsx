import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, userApi } from "../../services/api";
import { useTheme } from "../../styles/theme";

const { width } = Dimensions.get("window");
const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Metrics() {
  const { user } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalTime: 0,
    avgDuration: 0,
    thisMonth: 0,
  });
  
  // Estado do calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [workoutsByDate, setWorkoutsByDate] = useState<{[key: string]: any}>({}); // Armazenar treinos por data
  const [selectedDayWorkout, setSelectedDayWorkout] = useState<any>(null); // Treino selecionado
  const [workoutDetails, setWorkoutDetails] = useState<any>(null); // Detalhes completos do treino
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading para detalhes
  
  // Draggable modal state
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        // Handle drag movement
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dy > 100) {
          setShowWorkoutModal(false);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // Carregar dados em paralelo: métricas, perfil, histórico
      const [recordsData, historyData, statsData, profileData] = await Promise.all([
        metricsApi.getRecords(user!.id).catch(() => []),
        metricsApi.getHistory(user!.id).catch(() => ({ treinos: [] })),
        metricsApi.getStats(user!.id).catch(() => null),
        userApi.getProfile(user!.id).catch(() => null), // Carregar perfil com peso e objetivo
      ]);

      setRecords(recordsData || []);
      
      // Processar perfil para obter peso e peso alvo
      if (profileData?.user) {
        setProfile({
          peso: profileData.user.weight,
          altura: profileData.user.height,
          idade: profileData.user.age,
          pesoAlvo: profileData.user.pesoAlvo,
          objetivo: profileData.user.objetivo,
        });
      }
      
      // Processar histórico e datas para calendário
      const historyItems = historyData?.treinos || historyData || [];
      setHistory(Array.isArray(historyItems) ? historyItems : []);
      
      // Extrair datas dos treinos para o calendário e mapear treinos por data
      const dates = new Set<string>();
      const workoutMap: {[key: string]: any} = {};
      
      (Array.isArray(historyItems) ? historyItems : []).forEach((item: any) => {
        const dateStr = item.data_inicio || item.data_treino || item.data;
        if (dateStr) {
          // Converter data para formato local (YYYY-MM-DD)
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          dates.add(dateKey);
          // Armazenar o primeiro treino dessa data (ou agrupá-los)
          if (!workoutMap[dateKey]) {
            workoutMap[dateKey] = [];
          }
          workoutMap[dateKey].push(item);
        }
      });
      
      setWorkoutDates(dates);
      setWorkoutsByDate(workoutMap);
      
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
  }
  
  // Funções do calendário
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const days: (number | null)[] = [];
    // Dias vazios no início
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }
  
  function isWorkoutDay(day: number | null) {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutDates.has(dateStr);
  }
  
  function isToday(day: number | null) {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  }
  
  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  // Abrir modal ao clicar num dia com treino
  function handleDayPress(day: number | null) {
    if (!day) return;
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workouts = workoutsByDate[dateStr];
    
    if (workouts && workouts.length > 0) {
      const workout = workouts[0];
      setSelectedDayWorkout(workout);
      setWorkoutDetails(null);
      setShowWorkoutModal(true);
      setLoadingDetails(true);
      
      // Carregar detalhes completos se tiver id_sessao válido
      if (workout.id_sessao && workout.id_sessao > 0) {
        metricsApi.getSessionDetails(workout.id_sessao)
          .then(details => {
            setWorkoutDetails(details);
          })
          .catch(err => {
            console.error(`Erro ao carregar detalhes:`, err);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      } else {
        setLoadingDetails(false);
      }
    }
  }

  // Memoizar cálculos de calendário
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weeklyProgressData = useMemo(() => getWeeklyProgress(), [workoutDates]);
  const weightProgressData = useMemo(() => getWeightProgress(), [profile]);

  // Formatar hora para exibir no modal
  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Calcular meta semanal de treinos (exemplo: 4 treinos por semana)
  function getWeeklyProgress() {
    const targetWorkouts = 4;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    // Contar treinos desta semana
    let weekWorkouts = 0;
    const weekDates = new Set<string>();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      if (workoutDates.has(dateStr)) {
        weekWorkouts++;
      }
      weekDates.add(dateStr);
    }
    
    const percentage = Math.min((weekWorkouts / targetWorkouts) * 100, 100);
    return { weekWorkouts, targetWorkouts, percentage };
  }

  // Renderizar barra de progresso visual
  function renderProgressBar(percentage: number, height: number = 12) {
    const filledWidth = (percentage / 100) * (width - 80);
    
    return (
      <View
        style={{
          height,
          backgroundColor: theme.backgroundTertiary,
          borderRadius: height / 2,
          overflow: "hidden",
          marginVertical: 12,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor:
              percentage >= 100
                ? theme.accentGreen
                : percentage >= 75
                ? "#f59e0b"
                : percentage >= 50
                ? theme.accentBlue
                : theme.accent,
            borderRadius: height / 2,
          }}
        />
      </View>
    );
  }

  // Calcular progresso do peso alvo (comparação entre peso atual e peso alvo)
  // Nota: Para um cálculo preciso seria necessário ter o peso inicial registado no registo
  function getWeightProgress() {
    if (!profile?.peso || !profile?.pesoAlvo) {
      return null;
    }

    const currentWeight = profile.peso;
    const targetWeight = profile.pesoAlvo;
    
    // Calcular quanto falta para atingir o objetivo
    const weightDifference = Math.abs(currentWeight - targetWeight);
    
    // Se o objetivo é perder peso
    if (targetWeight < currentWeight) {
      // Mostrar 0% pois estamos a começar, precisa de histórico para progresso real
      return { 
        percentage: 0, 
        difference: weightDifference, 
        direction: "down",
        message: `Precisa perder ${weightDifference.toFixed(1)}kg`
      };
    }
    
    // Se o objetivo é ganhar peso
    if (targetWeight > currentWeight) {
      // Mostrar 0% pois estamos a começar, precisa de histórico para progresso real
      return { 
        percentage: 0, 
        difference: weightDifference, 
        direction: "up",
        message: `Precisa ganhar ${weightDifference.toFixed(1)}kg`
      };
    }
    
    // Se já atingiu o objetivo
    return { 
      percentage: 100, 
      difference: 0, 
      direction: "none",
      message: "Objetivo atingido!"
    };
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.text }}>
          Métricas
        </Text>
        <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 14 }}>
          Acompanha o teu progresso
        </Text>
      </View>

      {/* Stats Overview com Gráficos */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        {/* Progresso Semanal */}
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            padding: 20,
            borderColor: theme.border,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: theme.backgroundTertiary,
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="flame" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                Meta Semanal
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                Objetivo: 4 treinos por semana
              </Text>
            </View>
          </View>

          {/* Barra de progresso semanal */}
          {renderProgressBar(getWeeklyProgress().percentage)}

          {/* Informação do progresso */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 16 }}>
              {getWeeklyProgress().weekWorkouts} / {getWeeklyProgress().targetWorkouts}
            </Text>
            <Text
              style={{
                color:
                  getWeeklyProgress().percentage >= 100
                    ? theme.accentGreen
                    : getWeeklyProgress().percentage >= 50
                    ? theme.accentBlue
                    : theme.accent,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {Math.round(getWeeklyProgress().percentage)}%
            </Text>
          </View>
        </View>

        {/* Card de Objetivo de Peso (se houver dados) */}
        {profile?.peso && profile?.pesoAlvo && getWeightProgress() && (
          <View
            style={{
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              padding: 16,
              borderColor: theme.border,
              borderWidth: 1,
              marginTop: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: theme.backgroundTertiary,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons 
                  name={getWeightProgress()?.direction === "down" ? "trending-down" : "trending-up"} 
                  size={20} 
                  color={theme.accentGreen}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                  Objetivo de Peso
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {profile.pesoAlvo}kg ({getWeightProgress()?.direction === "down" ? "Perder" : "Ganhar"})
                </Text>
              </View>
            </View>

            {/* Barra de progresso de peso */}
            {renderProgressBar(getWeightProgress()?.percentage || 0)}

            {/* Informação do peso e mensagem */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 16 }}>
                {profile.peso}kg → {profile.pesoAlvo}kg
              </Text>
              <Text
                style={{
                  color:
                    getWeightProgress()?.percentage && getWeightProgress()!.percentage >= 100
                      ? theme.accentGreen
                      : theme.accent,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {Math.round(getWeightProgress()?.percentage || 0)}%
              </Text>
            </View>

            {/* Mensagem do objetivo */}
            <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: "center" }}>
              {getWeightProgress()?.message}
            </Text>
          </View>
        )}

        {/* Estatísticas */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
          <View
            style={{
              width: (width - 60) / 2,
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              padding: 16,
              borderColor: theme.border,
              borderWidth: 1,
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
              <Ionicons name="fitness" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Total de Treinos
            </Text>
          </View>

          <View
            style={{
              width: (width - 60) / 2,
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              padding: 16,
              borderColor: theme.border,
              borderWidth: 1,
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
              <Ionicons name="calendar" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {stats.thisMonth}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              Este Mês
            </Text>
          </View>

        </View>
      </View>

      {/* Recordes Pessoais */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 16 }}>
          🏆 Recordes Pessoais
        </Text>

        {records.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 32,
              paddingHorizontal: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="trophy-outline" size={40} color={theme.textTertiary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, textAlign: "center", fontSize: 14 }}>
              Ainda não tens recordes registados
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {records.map((record, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.accent,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
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
                  <Ionicons name="trophy" size={24} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                    {record.nome_exercicio || record.exercicio || record.exercise}
                  </Text>
                  {(record.data_serie || record.data) && (
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                      {formatDate(record.data_serie || record.data)}
                    </Text>
                  )}
                </View>
                <Text style={{ color: theme.accent, fontWeight: "bold", fontSize: 16 }}>
                  {record.peso || record.weight} kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Calendário de Treinos */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 16 }}>
          📅 Calendário de Treinos
        </Text>
        
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          {/* Navegação do mês */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <TouchableOpacity onPress={previousMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 16 }}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Dias da semana */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {DAYS.map((day, index) => (
              <View key={index} style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "500" }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Grid do calendário */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {daysInMonth.map((day, index) => (
              <TouchableOpacity 
                key={index} 
                style={{
                  width: (width - 80) / 7,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => handleDayPress(day)}
                activeOpacity={isWorkoutDay(day) ? 0.7 : 1}
              >
                {day && (
                  <View 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isToday(day)
                        ? theme.accent
                        : isWorkoutDay(day)
                          ? theme.backgroundTertiary
                          : "transparent",
                      borderColor: isWorkoutDay(day) && !isToday(day) ? theme.text : "transparent",
                      borderWidth: isWorkoutDay(day) && !isToday(day) ? 1 : 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: isToday(day)
                          ? "white"
                          : isWorkoutDay(day)
                            ? theme.text
                            : theme.textSecondary,
                        fontWeight: isToday(day) ? "bold" : "normal",
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Legenda */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 16, paddingTop: 12, borderTopColor: theme.border, borderTopWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Hoje</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, borderColor: theme.text, borderWidth: 1 }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Treino</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>

    {/* Modal de Detalhes do Treino */}
    <Modal
      visible={showWorkoutModal}
      transparent
      animationType="none"
      onRequestClose={() => setShowWorkoutModal(false)}
    >
      <TouchableOpacity 
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.15)",
          justifyContent: "flex-end",
        }}
        activeOpacity={1}
        onPress={() => setShowWorkoutModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          {...panResponder.panHandlers}
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: "85%",
            borderColor: theme.border,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
          }}
        >
          {/* Barra deslizável no topo */}
          <TouchableOpacity
            style={{
              width: 40,
              height: 4,
              backgroundColor: theme.textSecondary,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
              opacity: 0.3,
            }}
          />

          {/* Header minimalista */}
          <View
            style={{
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 28, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
                  {workoutDetails?.nome_treino ||
                    selectedDayWorkout?.nome_treino ||
                    selectedDayWorkout?.nome ||
                    "Treino"}
                </Text>
                
                {(workoutDetails?.data_inicio ||
                  selectedDayWorkout?.data_inicio ||
                  selectedDayWorkout?.data) && (
                  <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                    {formatDateTime(
                      workoutDetails?.data_inicio ||
                        selectedDayWorkout?.data_inicio ||
                        selectedDayWorkout?.data
                    )}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {selectedDayWorkout ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: "100%" }}>
              {/* Duração em destaque */}
              {(workoutDetails?.duracao_segundos ||
                selectedDayWorkout?.duracao_segundos) && (
                <View
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 24,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name="timer" size={20} color={theme.accent} />
                  <Text style={{ fontSize: 16, color: theme.text, fontWeight: "600" }}>
                    {formatTime(
                      workoutDetails?.duracao_segundos ||
                        selectedDayWorkout?.duracao_segundos
                    )}
                  </Text>
                </View>
              )}

              {/* Carregando detalhes */}
              {loadingDetails && (
                <View style={{ justifyContent: "center", alignItems: "center", padding: 24 }}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={{ color: theme.textSecondary, marginTop: 12 }}>A carregar...</Text>
                </View>
              )}

              {/* Exercícios */}
              {(workoutDetails?.exercicios || selectedDayWorkout?.exercicios) && 
               (workoutDetails?.exercicios?.length > 0 || selectedDayWorkout?.exercicios?.length > 0) ? (
                <View>
                  {workoutDetails?.exercicios && workoutDetails.exercicios.length > 0 ? (
                    workoutDetails.exercicios.map((ex: any, index: number) => (
                      <View key={index} style={{ marginBottom: 20 }}>
                        {/* Cabeçalho do exercício */}
                        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 8 }}>
                          {ex.nome_exercicio || `Exercício ${index + 1}`}
                        </Text>
                        {ex.grupo_tipo && (
                          <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 12 }}>
                            {ex.grupo_tipo}
                            {ex.sub_tipo ? ` • ${ex.sub_tipo}` : ""}
                          </Text>
                        )}

                        {/* Séries */}
                        {ex.series && ex.series.length > 0 ? (
                          <View style={{ gap: 8 }}>
                            {ex.series.map((serie: any, serieIdx: number) => (
                              <View
                                key={serieIdx}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  backgroundColor: theme.background,
                                  borderRadius: 10,
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  gap: 12,
                                }}
                              >
                                <View
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    backgroundColor: theme.accent,
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                                    {serie.numero_serie}
                                  </Text>
                                </View>

                                <View style={{ flex: 1, flexDirection: "row", gap: 20 }}>
                                  {serie.repeticoes && (
                                    <View>
                                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                                        REPS
                                      </Text>
                                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text }}>
                                        {serie.repeticoes}
                                      </Text>
                                    </View>
                                  )}
                                  {serie.peso && (
                                    <View>
                                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>
                                        PESO
                                      </Text>
                                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.accentGreen }}>
                                        {serie.peso}kg
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: "italic" }}>
                            Nenhuma série registada
                          </Text>
                        )}
                      </View>
                    ))
                  ) : selectedDayWorkout?.exercicios?.length > 0 ? (
                    selectedDayWorkout.exercicios.map((ex: any, index: number) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: theme.background,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
                          {ex.nome || ex.exercicio || `Exercício ${index + 1}`}
                        </Text>
                      </View>
                    ))
                  ) : null}
                </View>
              ) : null}

              {/* Espaço no final */}
              <View style={{ height: 20 }} />
            </ScrollView>
          ) : (
            <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14 }}>
              Nenhum dado disponível
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    </View>
  );
}
