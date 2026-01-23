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

const { width } = Dimensions.get("window");
const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Metrics() {
  const { user } = useAuth();
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
      <View className="flex-1 bg-[#0d1b2a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#0d1b2a]"
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <Text className="text-white text-2xl font-bold">Métricas</Text>
        <Text className="text-gray-400 mt-1">Acompanha o teu progresso</Text>
      </View>

      {/* Stats Overview */}
      <View className="px-6 mb-6">
        <View className="flex-row flex-wrap gap-3">
          <View className="bg-white/5 rounded-2xl p-4 border border-white/10" style={{ width: (width - 60) / 2 }}>
            <View className="bg-blue-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
              <Ionicons name="fitness" size={20} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-white">
              {stats.totalWorkouts}
            </Text>
            <Text className="text-gray-400 text-sm">Treinos Completos</Text>
          </View>

          <View className="bg-white/5 rounded-2xl p-4 border border-white/10" style={{ width: (width - 60) / 2 }}>
            <View className="bg-green-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
              <Ionicons name="time" size={20} color="#22c55e" />
            </View>
            <Text className="text-2xl font-bold text-white">
              {formatTime(stats.totalTime)}
            </Text>
            <Text className="text-gray-400 text-sm">Tempo Total</Text>
          </View>

          <View className="bg-white/5 rounded-2xl p-4 border border-white/10" style={{ width: (width - 60) / 2 }}>
            <View className="bg-purple-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
              <Ionicons name="trending-up" size={20} color="#a855f7" />
            </View>
            <Text className="text-2xl font-bold text-white">
              {formatTime(stats.avgDuration)}
            </Text>
            <Text className="text-gray-400 text-sm">Média por Treino</Text>
          </View>

          <View className="bg-white/5 rounded-2xl p-4 border border-white/10" style={{ width: (width - 60) / 2 }}>
            <View className="bg-orange-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
              <Ionicons name="calendar" size={20} color="#f97316" />
            </View>
            <Text className="text-2xl font-bold text-white">
              {stats.thisMonth}
            </Text>
            <Text className="text-gray-400 text-sm">Este Mês</Text>
          </View>
        </View>
      </View>

      {/* Recordes Pessoais */}
      <View className="px-6 mb-6">
        <Text className="text-white text-lg font-bold mb-4">
          🏆 Recordes Pessoais
        </Text>

        {records.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-6 items-center border border-dashed border-white/20">
            <Ionicons name="trophy-outline" size={40} color="#6b7280" />
            <Text className="text-gray-400 mt-3 text-center">
              Ainda não tens recordes registados
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {records.map((record, index) => (
              <View
                key={index}
                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 border border-yellow-500/20 flex-row items-center"
              >
                <View className="bg-yellow-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="trophy" size={24} color="#eab308" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {record.nome_exercicio || record.exercicio || record.exercise}
                  </Text>
                  {(record.data_serie || record.data) && (
                    <Text className="text-gray-400 text-sm">
                      {formatDate(record.data_serie || record.data)}
                    </Text>
                  )}
                </View>
                <Text className="text-yellow-400 font-bold text-lg">
                  {record.peso || record.weight} kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Calendário de Treinos */}
      <View className="px-6 mb-6">
        <Text className="text-white text-lg font-bold mb-4">
          📅 Calendário de Treinos
        </Text>
        
        <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
          {/* Navegação do mês */}
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={previousMonth} className="p-2">
              <Ionicons name="chevron-back" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text className="text-white font-semibold text-lg">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={nextMonth} className="p-2">
              <Ionicons name="chevron-forward" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {/* Dias da semana */}
          <View className="flex-row mb-2">
            {DAYS.map((day, index) => (
              <View key={index} className="flex-1 items-center py-2">
                <Text className="text-gray-400 text-sm font-medium">{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Grid do calendário */}
          <View className="flex-row flex-wrap">
            {getDaysInMonth(currentMonth).map((day, index) => (
              <View 
                key={index} 
                className="items-center justify-center"
                style={{ width: (width - 80) / 7, height: 40 }}
              >
                {day && (
                  <View 
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      isToday(day) 
                        ? 'bg-blue-600' 
                        : isWorkoutDay(day) 
                          ? 'bg-green-500' 
                          : ''
                    }`}
                  >
                    <Text className={`text-sm ${
                      isToday(day) || isWorkoutDay(day) 
                        ? 'text-white font-bold' 
                        : 'text-gray-300'
                    }`}>
                      {day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          {/* Legenda */}
          <View className="flex-row justify-center gap-6 mt-4 pt-3 border-t border-white/10">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-blue-600" />
              <Text className="text-gray-400 text-sm">Hoje</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full bg-green-500" />
              <Text className="text-gray-400 text-sm">Treino</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
