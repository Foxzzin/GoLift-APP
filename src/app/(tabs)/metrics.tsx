import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi } from "../../services/api";

const { width } = Dimensions.get("window");

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
      setHistory(historyData?.treinos || []);
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
                    {record.exercicio}
                  </Text>
                  {record.data && (
                    <Text className="text-gray-400 text-sm">
                      {formatDate(record.data)}
                    </Text>
                  )}
                </View>
                <Text className="text-yellow-400 font-bold text-lg">
                  {record.weight} kg
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Histórico */}
      <View className="px-6">
        <Text className="text-white text-lg font-bold mb-4">
          📅 Histórico de Treinos
        </Text>

        {history.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-6 items-center border border-dashed border-white/20">
            <Ionicons name="calendar-outline" size={40} color="#6b7280" />
            <Text className="text-gray-400 mt-3 text-center">
              Sem treinos no histórico
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {history.slice(0, 10).map((workout, index) => (
              <View
                key={index}
                className="bg-white/5 rounded-2xl p-4 border border-white/10 flex-row items-center"
              >
                <View className="bg-blue-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                  <Text className="text-blue-400 font-bold text-sm">
                    {formatDate(workout.data)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {workout.nome || "Treino"}
                  </Text>
                  <View className="flex-row gap-4 mt-1">
                    <Text className="text-gray-400 text-sm">
                      {workout.exercicios?.length || 0} exercícios
                    </Text>
                    {workout.duracao_segundos && (
                      <Text className="text-gray-400 text-sm">
                        ⏱️ {formatTime(workout.duracao_segundos)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
