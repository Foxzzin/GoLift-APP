import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, metricsApi } from "../../services/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalTime: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileData, recordsData, statsData] = await Promise.all([
        userApi.getProfile(user!.id).catch(() => null),
        metricsApi.getRecords(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
      ]);

      setProfile(profileData || user);
      setRecords(recordsData || []);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfile(user);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function calculateIMC(peso: number, altura: number) {
    if (!peso || !altura) return null;
    const alturaM = altura / 100;
    const imc = peso / (alturaM * alturaM);
    return imc.toFixed(1);
  }

  function getIMCCategory(imc: number) {
    if (imc < 18.5) return { label: "Abaixo do peso", color: "#3b82f6" };
    if (imc < 25) return { label: "Peso normal", color: "#22c55e" };
    if (imc < 30) return { label: "Sobrepeso", color: "#f97316" };
    return { label: "Obesidade", color: "#ef4444" };
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }

  function handleLogout() {
    Alert.alert("Sair", "Tens a certeza que queres sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0d1b2a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const imc = calculateIMC(profile?.peso, profile?.altura);
  const imcCategory = imc ? getIMCCategory(parseFloat(imc)) : null;

  return (
    <ScrollView
      className="flex-1 bg-[#0d1b2a]"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 pt-14 pb-6">
        <Text className="text-white text-2xl font-bold">Perfil</Text>
      </View>

      {/* Avatar e Nome */}
      <View className="items-center px-6 mb-6">
        <View className="w-24 h-24 bg-blue-600/30 rounded-full items-center justify-center mb-4 border-2 border-blue-500">
          <Ionicons name="person" size={48} color="#3b82f6" />
        </View>
        <Text className="text-white text-2xl font-bold">
          {profile?.nome || "Atleta"}
        </Text>
        <Text className="text-gray-400 mt-1">{profile?.email}</Text>
      </View>

      {/* Stats rápidos */}
      <View className="flex-row px-6 gap-3 mb-6">
        <View className="flex-1 bg-white/5 rounded-2xl p-4 items-center border border-white/10">
          <Text className="text-3xl font-bold text-blue-400">
            {stats.totalWorkouts}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">Treinos</Text>
        </View>
        <View className="flex-1 bg-white/5 rounded-2xl p-4 items-center border border-white/10">
          <Text className="text-3xl font-bold text-green-400">
            {formatTime(stats.totalTime)}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">Tempo</Text>
        </View>
        <View className="flex-1 bg-white/5 rounded-2xl p-4 items-center border border-white/10">
          <Text className="text-3xl font-bold text-yellow-400">
            {records.length}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">Recordes</Text>
        </View>
      </View>

      {/* Dados Físicos */}
      <View className="px-6 mb-6">
        <Text className="text-white text-lg font-bold mb-4">Dados Físicos</Text>
        <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Idade */}
          <View className="flex-row items-center p-4 border-b border-white/5">
            <View className="bg-purple-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="calendar" size={20} color="#a855f7" />
            </View>
            <Text className="text-gray-300 flex-1">Idade</Text>
            <Text className="text-white font-semibold">
              {profile?.idade ? `${profile.idade} anos` : "Não definido"}
            </Text>
          </View>

          {/* Peso */}
          <View className="flex-row items-center p-4 border-b border-white/5">
            <View className="bg-blue-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="scale" size={20} color="#3b82f6" />
            </View>
            <Text className="text-gray-300 flex-1">Peso</Text>
            <Text className="text-white font-semibold">
              {profile?.peso ? `${profile.peso} kg` : "Não definido"}
            </Text>
          </View>

          {/* Altura */}
          <View className="flex-row items-center p-4 border-b border-white/5">
            <View className="bg-green-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="resize" size={20} color="#22c55e" />
            </View>
            <Text className="text-gray-300 flex-1">Altura</Text>
            <Text className="text-white font-semibold">
              {profile?.altura ? `${profile.altura} cm` : "Não definido"}
            </Text>
          </View>

          {/* IMC */}
          <View className="flex-row items-center p-4">
            <View className="bg-orange-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="heart" size={20} color="#f97316" />
            </View>
            <Text className="text-gray-300 flex-1">IMC</Text>
            <View className="items-end">
              <Text className="text-white font-semibold">
                {imc || "N/A"}
              </Text>
              {imcCategory && (
                <Text style={{ color: imcCategory.color }} className="text-xs">
                  {imcCategory.label}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Recordes */}
      {records.length > 0 && (
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-bold mb-4">
            🏆 Melhores Recordes
          </Text>
          <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {records.slice(0, 5).map((record, index) => (
              <View
                key={index}
                className={`flex-row items-center p-4 ${
                  index < records.length - 1 ? "border-b border-white/5" : ""
                }`}
              >
                <View className="bg-yellow-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="trophy" size={20} color="#eab308" />
                </View>
                <Text className="text-gray-300 flex-1">{record.nome_exercicio || record.exercicio || record.exercise}</Text>
                <Text className="text-yellow-400 font-bold">
                  {record.peso || record.weight} kg
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Painel Admin - apenas para admins */}
      {user?.tipo === 1 && (
        <View className="px-6 mb-6">
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            className="bg-purple-600/20 border border-purple-500/40 rounded-2xl p-4 flex-row items-center"
          >
            <View className="bg-purple-500/30 w-12 h-12 rounded-xl items-center justify-center mr-4">
              <Ionicons name="shield-checkmark" size={24} color="#a855f7" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">Painel de Admin</Text>
              <Text className="text-purple-300 text-sm">Gerir utilizadores, exercícios e treinos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#a855f7" />
          </TouchableOpacity>
        </View>
      )}

      {/* Opções */}
      <View className="px-6 mb-6">
        <Text className="text-white text-lg font-bold mb-4">Opções</Text>
        <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Editar Perfil */}
          <TouchableOpacity className="flex-row items-center p-4 border-b border-white/5">
            <View className="bg-blue-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="create" size={20} color="#3b82f6" />
            </View>
            <Text className="text-white flex-1">Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Definições */}
          <TouchableOpacity className="flex-row items-center p-4 border-b border-white/5">
            <View className="bg-gray-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="settings" size={20} color="#6b7280" />
            </View>
            <Text className="text-white flex-1">Definições</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Ajuda */}
          <TouchableOpacity className="flex-row items-center p-4">
            <View className="bg-green-500/20 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <Ionicons name="help-circle" size={20} color="#22c55e" />
            </View>
            <Text className="text-white flex-1">Ajuda</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View className="px-6">
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 items-center flex-row justify-center"
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2">Terminar Sessão</Text>
        </TouchableOpacity>
      </View>

      {/* Versão */}
      <Text className="text-gray-600 text-center mt-6 text-sm">
        GoLift v1.0.0
      </Text>
    </ScrollView>
  );
}
