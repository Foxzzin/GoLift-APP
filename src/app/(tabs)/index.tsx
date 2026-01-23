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
import { useTheme } from "../../styles/theme";

export default function Home() {
  const { user } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
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
      const [workouts, statsData, streakData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id),
        metricsApi.getStats(user!.id).catch(() => null),
        metricsApi.getStreak(user!.id).catch(() => null),
      ]);
      
      setRecentWorkouts(workouts?.slice(0, 3) || []);
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
              {user?.nome || "Atleta"}
            </Text>
          </View>
          
          {/* Streak Badge */}
          <View
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
          </View>
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
                key={workout.id_treino || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", borderColor: theme.border, borderWidth: 1 }}
              >
                <View style={{ backgroundColor: theme.backgroundTertiary, width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="barbell" size={22} color={theme.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                    {workout.nome || "Treino"}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {workout.exercicios?.length || 0} exercícios
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
  );
}
