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
import { useTheme } from "../../styles/theme";
import { getIMCCategory } from "../../utils/imc";

export default function Profile() {
  const { user, logout } = useAuth();
  const theme = useTheme();
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

      // Mapear campos do backend (name, age, weight, height) para o frontend (nome, idade, peso, altura)
      const mappedProfile = profileData?.user ? {
        id: profileData.user.id,
        nome: profileData.user.name,
        email: profileData.user.email,
        idade: profileData.user.age,
        peso: profileData.user.weight,
        altura: profileData.user.height,
      } : user;

      setProfile(mappedProfile);
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
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const imc = calculateIMC(profile?.peso, profile?.altura);
  const imcCategory = imc ? getIMCCategory(parseFloat(imc)) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.text }}>
          Perfil
        </Text>
      </View>

      {/* Avatar e Nome */}
      <View style={{ alignItems: "center", paddingHorizontal: 24, marginBottom: 24 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.accent,
            borderWidth: 2,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="person" size={48} color={theme.accent} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
          {profile?.nome || "Atleta"}
        </Text>
        <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 14 }}>
          {profile?.email}
        </Text>
      </View>

      {/* Stats rápidos */}
      <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 12, marginBottom: 24 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 12,
            alignItems: "center",
            borderColor: theme.border,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
            {stats.totalWorkouts}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            Treinos
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 12,
            alignItems: "center",
            borderColor: theme.border,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
            {formatTime(stats.totalTime)}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            Tempo
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 12,
            alignItems: "center",
            borderColor: theme.border,
            borderWidth: 1,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
            {records.length}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            Recordes
          </Text>
        </View>
      </View>

      {/* Dados Físicos */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 12 }}>
          Dados Físicos
        </Text>
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            borderColor: theme.border,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          {/* Idade */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="calendar" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
              Idade
            </Text>
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
              {profile?.idade ? `${profile.idade} anos` : "Não definido"}
            </Text>
          </View>

          {/* Peso */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="scale" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
              Peso
            </Text>
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
              {profile?.peso ? `${profile.peso} kg` : "Não definido"}
            </Text>
          </View>

          {/* Altura */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="resize" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
              Altura
            </Text>
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
              {profile?.altura ? `${profile.altura} cm` : "Não definido"}
            </Text>
          </View>

          {/* IMC */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="heart" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
              IMC
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                {imc || "N/A"}
              </Text>
              {imcCategory && (
                <Text style={{ color: imcCategory.color, fontSize: 11, marginTop: 2 }}>
                  {imcCategory.label}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Recordes */}
      {records.length > 0 && (
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 12 }}>
            🏆 Melhores Recordes
          </Text>
          <View
            style={{
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.accent,
              borderWidth: 1,
              overflow: "hidden",
            }}
          >
            {records.slice(0, 3).map((record, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomColor: index < 2 ? theme.border : "transparent",
                  borderBottomWidth: index < 2 ? 1 : 0,
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
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="trophy" size={20} color={theme.accent} />
                </View>
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
                  {record.nome_exercicio || record.exercicio || record.exercise}
                </Text>
                <Text style={{ color: theme.accent, fontWeight: "bold", fontSize: 14 }}>
                  {record.peso || record.weight} kg
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Painel Admin - apenas para admins */}
      {user?.tipo === 1 && (
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={{
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.accent,
              borderWidth: 1,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
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
              <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 14 }}>
                Painel de Admin
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                Gerir utilizadores, exercícios e treinos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Opções */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text, marginBottom: 12 }}>
          Opções
        </Text>
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 16,
            borderColor: theme.border,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          {/* GoLift Pro */}
          <TouchableOpacity
            onPress={() => router.push("/upgrade")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
              backgroundColor: theme.accent + "12",
            }}
          >
            <View
              style={{
                backgroundColor: theme.accent + "30",
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="star" size={20} color={theme.accent} />
            </View>
            <Text style={{ color: theme.text, flex: 1, fontSize: 14, fontWeight: "600" }}>
              GoLift Pro
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Editar Perfil */}
          <TouchableOpacity
            onPress={() => router.push("/edit-profile")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="create" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.text, flex: 1, fontSize: 14 }}>
              Editar Perfil
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Definições */}
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomColor: theme.border,
              borderBottomWidth: 1,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="settings" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.text, flex: 1, fontSize: 14 }}>
              Definições
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Ajuda */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
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
                marginRight: 12,
              }}
            >
              <Ionicons name="help-circle" size={20} color={theme.text} />
            </View>
            <Text style={{ color: theme.text, flex: 1, fontSize: 14 }}>
              Ajuda
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View style={{ paddingHorizontal: 24, gap: 12 }}>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.accent,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="log-out" size={20} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 14 }}>
            Terminar Sessão
          </Text>
        </TouchableOpacity>
      </View>

      {/* Versão */}
      <Text style={{ color: theme.textTertiary, textAlign: "center", marginTop: 24, fontSize: 12 }}>
        GoLift v1.0.0
      </Text>
    </ScrollView>
  );
}
