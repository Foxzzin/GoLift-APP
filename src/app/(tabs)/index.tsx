import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, workoutApi } from "../../services/api";

export default function Home() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
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

  async function loadData() {
    try {
      const [workouts, statsData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id),
        metricsApi.getStats(user!.id).catch(() => null),
      ]);
      
      setRecentWorkouts(workouts?.slice(0, 3) || []);
      if (statsData) {
        setStats(statsData);
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

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
      <View className="px-6 pt-14 pb-6">
        <Text className="text-gray-400 text-base">Olá,</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.nome || "Atleta"} 👋
        </Text>
      </View>

      {/* Quick Action */}
      <View className="px-6 mb-6">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/workouts")}
          className="bg-blue-600 rounded-2xl p-6 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-white text-lg font-bold mb-1">
              Começar Treino
            </Text>
            <Text className="text-blue-200">
              Escolhe um treino e começa agora
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-3">
            <Ionicons name="play" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View className="flex-row px-6 gap-3 mb-6">
        <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
          <View className="bg-blue-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
            <Ionicons name="barbell" size={20} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-bold text-white">
            {stats.totalWorkouts}
          </Text>
          <Text className="text-gray-400 text-sm">Treinos Total</Text>
        </View>

        <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
          <View className="bg-green-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
            <Ionicons name="calendar" size={20} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-white">{stats.thisWeek}</Text>
          <Text className="text-gray-400 text-sm">Esta Semana</Text>
        </View>

        <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/10">
          <View className="bg-purple-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
            <Ionicons name="time" size={20} color="#a855f7" />
          </View>
          <Text className="text-2xl font-bold text-white">
            {formatTime(stats.totalTime)}
          </Text>
          <Text className="text-gray-400 text-sm">Tempo Total</Text>
        </View>
      </View>

      {/* Recent Workouts */}
      <View className="px-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-bold">Treinos Recentes</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
            <Text className="text-blue-500">Ver todos</Text>
          </TouchableOpacity>
        </View>

        {recentWorkouts.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-8 items-center border border-white/10">
            <Ionicons name="barbell-outline" size={48} color="#6b7280" />
            <Text className="text-gray-400 mt-4 text-center">
              Ainda não tens treinos registados
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/workouts")}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Criar Primeiro Treino</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-3">
            {recentWorkouts.map((workout, index) => (
              <TouchableOpacity
                key={workout.id_treino || index}
                className="bg-white/5 rounded-2xl p-4 border border-white/10 flex-row items-center"
              >
                <View className="bg-blue-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="barbell" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {workout.nome || "Treino"}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {workout.exercicios?.length || 0} exercícios
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Motivational Quote */}
      <View className="px-6 mt-6">
        <View className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/20">
          <Text className="text-white text-center text-lg font-medium italic">
            "O único treino ruim é aquele que não aconteceu."
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
