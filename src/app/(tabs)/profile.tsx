import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, metricsApi, planoApi } from "../../services/api";
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
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [showAllRecords, setShowAllRecords] = useState(false);

  const RANK_STYLES = [
    { medal: "🥇", color: "#f59e0b", border: "#f59e0b" },
    { medal: "🥈", color: "#94a3b8", border: "#94a3b8" },
    { medal: "🥉", color: "#cd7f32", border: "#cd7f32" },
  ];

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
      planoApi.getUserPlan(user!.id).then(d => setPlanoTipo(d.plano)).catch(() => {});

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
            backgroundColor: theme.backgroundTertiary,
            borderColor: theme.border,
            borderWidth: 2,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="person" size={48} color={planoTipo === "pago" ? "#f59e0b" : theme.accent} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.text }}>
          {profile?.nome || "Atleta"}
        </Text>
        {planoTipo === "pago" ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: "#f59e0b22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderColor: "#f59e0b", borderWidth: 1 }}>
            <Ionicons name="star" size={13} color="#f59e0b" style={{ marginRight: 5 }} />
            <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13 }}>GoLift Pro</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderColor: theme.border, borderWidth: 1 }}>
            <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Free</Text>
          </View>
        )}
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

      {/* Banner GoLift Pro - apenas para utilizadores free */}
      {planoTipo !== "pago" && (
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push("/upgrade")}
            style={{
              backgroundColor: theme.accent + "18",
              borderColor: theme.accent,
              borderWidth: 1.5,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{
              backgroundColor: theme.accent + "30",
              width: 44, height: 44, borderRadius: 12,
              justifyContent: "center", alignItems: "center", marginRight: 14,
            }}>
              <Ionicons name="star" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.accent, fontWeight: "800", fontSize: 15 }}>Desbloqueia GoLift Pro</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>IA + relatórios + planos personalizados</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      )}

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
          <TouchableOpacity
            onPress={() => setShowAllRecords(true)}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: theme.text }}>
              🏆 Melhores Recordes
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>
                Ver todos ({records.length})
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.accent} />
            </View>
          </TouchableOpacity>
          <View
            style={{
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              overflow: "hidden",
            }}
          >
            {records.slice(0, 3).map((record, index) => {
              const rank = RANK_STYLES[index];
              return (
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
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: theme.backgroundTertiary,
                      borderColor: theme.border,
                      borderWidth: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{rank?.medal || "🏅"}</Text>
                  </View>
                  <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
                    {record.nome_exercicio || record.exercicio || record.exercise}
                  </Text>
                  <Text style={{ color: rank?.color || theme.accent, fontWeight: "bold", fontSize: 14 }}>
                    {record.peso || record.weight} kg
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Modal Todos os Recordes */}
      <Modal visible={showAllRecords} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "85%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: theme.text }}>🏆 Todos os Recordes</Text>
              <TouchableOpacity onPress={() => setShowAllRecords(false)}>
                <Ionicons name="close" size={26} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
              {records.map((record, index) => {
                const rank = RANK_STYLES[index];
                const color = rank?.color || theme.textSecondary;
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.backgroundSecondary,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom: 10,
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      borderWidth: 1,
                      borderColor: rank ? rank.border : theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{rank?.medal || `#${index + 1}`}</Text>
                    <Text style={{ color: theme.text, flex: 1, fontSize: 14, fontWeight: "500" }}>
                      {record.nome_exercicio || record.exercicio || record.exercise}
                    </Text>
                    <Text style={{ color, fontWeight: "bold", fontSize: 15 }}>
                      {record.peso || record.weight} kg
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
