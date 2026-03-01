import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { communitiesApi } from "../../services/api";

interface Member {
  user_id: number;
  user_nome: string;
  juntou_em: string;
}

interface Community {
  id: number;
  nome: string;
  descricao: string;
  criador_nome: string;
  criador_id: number;
  membros: number;
  verificada: number;
  privada: number;
  pais: string | null;
  criada_em: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminCommunities() {
  const theme = useTheme();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [members, setMembers] = useState<{ [id: number]: Member[] }>({});
  const [loadingMembers, setLoadingMembers] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  async function loadCommunities() {
    try {
      setLoading(true);
      const data = await communitiesApi.getAllCommunitiesAdmin();
      setCommunities(data || []);
    } catch (error) {
      console.error("Erro ao carregar comunidades:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    setRefreshing(false);
  };

  const handleToggleExpand = async (communityId: number) => {
    if (expanded === communityId) {
      setExpanded(null);
      return;
    }
    setExpanded(communityId);
    if (!members[communityId]) {
      try {
        setLoadingMembers(communityId);
        const data = await communitiesApi.getCommunityMembers(communityId);
        setMembers((prev) => ({ ...prev, [communityId]: data || [] }));
      } catch {
        setMembers((prev) => ({ ...prev, [communityId]: [] }));
      } finally {
        setLoadingMembers(null);
      }
    }
  };

  const handleToggleVerificacao = async (communityId: number, currentStatus: number) => {
    try {
      setToggling(communityId);
      if (currentStatus) {
        await communitiesApi.toggleVerification(communityId, false);
      } else {
        await communitiesApi.verifyCommunity(communityId);
      }
      setCommunities(communities.map((c) =>
        c.id === communityId ? { ...c, verificada: c.verificada ? 0 : 1 } : c
      ));
    } catch {
      Alert.alert("Erro", "Erro ao atualizar verificação");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (communityId: number, nome: string) => {
    Alert.alert(
      "Eliminar comunidade",
      `Tens a certeza que queres eliminar "${nome}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(communityId);
              await communitiesApi.rejectCommunity(communityId);
              setCommunities(communities.filter((c) => c.id !== communityId));
              if (expanded === communityId) setExpanded(null);
            } catch {
              Alert.alert("Erro", "Erro ao eliminar comunidade");
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const verified = communities.filter((c) => c.verificada === 1);
  const unverified = communities.filter((c) => c.verificada === 0);

  const renderCommunity = (community: Community) => {
    const isExpanded = expanded === community.id;
    const communityMembers = members[community.id] || [];

    return (
      <View
        key={community.id}
        style={{
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 20,
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <Pressable
          onPress={() => handleToggleExpand(community.id)}
          accessibilityLabel={`${isExpanded ? "Recolher" : "Expandir"} ${community.nome}`}
          accessibilityRole="button"
          style={({ pressed }) => ({ padding: 16, opacity: pressed ? 0.85 : 1 })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>
                {community.nome}
              </Text>
              {!!community.verificada && (
                <Text style={{ fontSize: 12, color: theme.accent }}>✓</Text>
              )}
              {!!community.privada && (
                <Text style={{ fontSize: 12, color: theme.textTertiary }}>🔒</Text>
              )}
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textTertiary}
            />
          </View>

          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 10 }} numberOfLines={isExpanded ? undefined : 2}>
            {community.descricao}
          </Text>

          {/* Meta row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="person-outline" size={13} color={theme.textTertiary} />
              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{community.criador_nome || "—"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="people-outline" size={13} color={theme.textTertiary} />
              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{community.membros} membros</Text>
            </View>
            {community.pais && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location-outline" size={13} color={theme.textTertiary} />
                <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{community.pais}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="calendar-outline" size={13} color={theme.textTertiary} />
              <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{formatDate(community.criada_em)}</Text>
            </View>
          </View>
        </Pressable>

        {/* Expanded details */}
        {isExpanded && (
          <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
            {/* DB Info strip */}
            <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 16, paddingVertical: 10, gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>ID</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontFamily: "monospace" }}>#{community.id}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>Criador ID</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontFamily: "monospace" }}>#{community.criador_id}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>Criada em</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{formatDate(community.criada_em)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>Tipo</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{community.privada ? "🔒 Privada" : "🌍 Pública"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>País</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{community.pais || "—"}</Text>
              </View>
            </View>

            {/* Members list */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                Membros ({community.membros})
              </Text>
              {loadingMembers === community.id ? (
                <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 12 }} />
              ) : communityMembers.length === 0 ? (
                <Text style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 12 }}>Nenhum membro carregado</Text>
              ) : (
                communityMembers.slice(0, 10).map((m, i) => (
                  <View key={m.user_id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: i < communityMembers.length - 1 ? 1 : 0, borderBottomColor: theme.border }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent + "33", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "bold" }}>
                        {(m.user_nome || "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, color: theme.text, fontSize: 13 }}>{m.user_nome || `User #${m.user_id}`}</Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 11 }}>{m.juntou_em ? new Date(m.juntou_em).toLocaleDateString("pt-PT") : ""}</Text>
                  </View>
                ))
              )}
              {communityMembers.length > 10 && (
                <Text style={{ color: theme.textTertiary, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 4 }}>
                  +{communityMembers.length - 10} mais membros
                </Text>
              )}
            </View>

            {/* Action row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.border, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.accent} />
                <Text style={{ color: theme.text, fontSize: 14 }}>Verificada</Text>
                {toggling === community.id ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Switch
                    value={community.verificada === 1}
                    onValueChange={() => handleToggleVerificacao(community.id, community.verificada)}
                    trackColor={{ false: theme.border, true: theme.accent }}
                    thumbColor="white"
                  />
                )}
              </View>
              <Pressable
                onPress={() => handleDelete(community.id, community.nome)}
                disabled={deleting === community.id}
                accessibilityLabel="Eliminar comunidade"
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF444422", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, opacity: pressed ? 0.7 : 1 })}
              >
                {deleting === community.id ? (
                  <ActivityIndicator size="small" color="#ff3b30" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>Eliminar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              marginRight: 14, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>Comunidades</Text>
        </View>
        {!loading && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ backgroundColor: theme.accent + "18", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "700" }}>{communities.length} total</Text>
            </View>
            <View style={{ backgroundColor: theme.accentGreen + "18", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Text style={{ color: theme.accentGreen, fontSize: 13, fontWeight: "700" }}>{verified.length} verificadas</Text>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : communities.length === 0 ? (
        <View style={{ paddingHorizontal: 24, paddingVertical: 60, alignItems: "center" }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>👥</Text>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700" }}>Sem comunidades</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {/* Unverified section */}
          {unverified.length > 0 && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff9f0a" }} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Por verificar ({unverified.length})
                </Text>
              </View>
              {unverified.map(renderCommunity)}
            </>
          )}

          {/* Verified section */}
          {verified.length > 0 && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: unverified.length > 0 ? 16 : 0, marginBottom: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Verificadas ({verified.length})
                </Text>
              </View>
              {verified.map(renderCommunity)}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

