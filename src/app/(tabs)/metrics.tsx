import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi } from "../../services/api";
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
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalTime: 0,
    avgDuration: 0,
    thisMonth: 0,
  });
  
  // Estado do calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [recordsData, historyData, statsData] = await Promise.all([
        metricsApi.getRecords(user!.id).catch(() => []),
        metricsApi.getHistory(user!.id).catch(() => ({ treinos: [] })),
        metricsApi.getStats(user!.id).catch(() => null),
      ]);

      setRecords(recordsData || []);
      
      // Processar histórico e datas para calendário
      const historyItems = historyData?.treinos || historyData || [];
      setHistory(Array.isArray(historyItems) ? historyItems : []);
      
      // Extrair datas dos treinos para o calendário
      const dates = new Set<string>();
      (Array.isArray(historyItems) ? historyItems : []).forEach((item: any) => {
        const dateStr = item.data_inicio || item.data;
        if (dateStr) {
          dates.add(new Date(dateStr).toISOString().split('T')[0]);
        }
      });
      setWorkoutDates(dates);
      
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 20 }}
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

      {/* Stats Overview */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <View style={{ width: (width - 60) / 2, backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="fitness" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Treinos Completos</Text>
          </View>

          <View style={{ width: (width - 60) / 2, backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="time" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {formatTime(stats.totalTime)}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Tempo Total</Text>
          </View>

          <View style={{ width: (width - 60) / 2, backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="trending-up" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {formatTime(stats.avgDuration)}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Média por Treino</Text>
          </View>

          <View style={{ width: (width - 60) / 2, backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ backgroundColor: theme.backgroundTertiary, width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="calendar" size={20} color={theme.text} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
              {stats.thisMonth}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Este Mês</Text>
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
            {getDaysInMonth(currentMonth).map((day, index) => (
              <View 
                key={index} 
                style={{
                  width: (width - 80) / 7,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {day && (
                  <View 
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
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
              </View>
            ))}
          </View>
          
          {/* Legenda */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 16, paddingTop: 12, borderTopColor: theme.border, borderTopWidth: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Hoje</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, borderColor: theme.text, borderWidth: 1 }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Treino</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
