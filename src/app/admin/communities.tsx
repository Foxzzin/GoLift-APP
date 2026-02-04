import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { communitiesApi } from "../../services/api";

interface Community {
  id: number;
  nome: string;
  descricao: string;
  criador_nome: string;
  membros: number;
  verificada: number;
  criada_em: string;
}

export default function AdminCommunities() {
  const theme = useTheme();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    loadCommunities();
  }, []);

  async function loadCommunities() {
    try {
      setLoading(true);
      const data = await communitiesApi.getCommunities();
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

  const handleToggleVerificacao = async (communityId: number, currentStatus: number) => {
    try {
      setToggling(communityId);
      await communitiesApi.toggleVerification(communityId, !currentStatus);
      setCommunities(
        communities.map((c) =>
          c.id === communityId ? { ...c, verificada: c.verificada ? 0 : 1 } : c
        )
      );
    } catch (error) {
      Alert.alert("Erro", "Erro ao atualizar verificação");
    } finally {
      setToggling(null);
    }
  };

  const handleVerify = async (communityId: number) => {
    try {
      await communitiesApi.verifyCommunity(communityId);
      setCommunities(communities.filter((c) => c.id !== communityId));
      alert("Comunidade verificada com sucesso!");
    } catch (error) {
      alert("Erro ao verificar comunidade");
    }
  };

  const handleReject = async (communityId: number) => {
    if (!confirm("Tem certeza que deseja rejeitar esta comunidade?")) return;

    try {
      await communitiesApi.rejectCommunity(communityId);
      setCommunities(communities.filter((c) => c.id !== communityId));
      alert("Comunidade rejeitada!");
    } catch (error) {
      alert("Erro ao rejeitar comunidade");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "bold" }}>
            Comunidades
          </Text>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          Gerencie e verifique comunidades
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : communities.length === 0 ? (
        <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: "center" }}>
          <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.text, marginTop: 12, fontSize: 16, fontWeight: "bold" }}>
            Sem comunidades
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {communities.map((community) => (
            <View
              key={community.id}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: community.verificada ? theme.accent : theme.border,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold", marginRight: 8 }}>
                      {community.nome}
                    </Text>
                    {community.verificada ? (
                      <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                    ) : null}
                  </View>
                  <Text
                    style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}
                    numberOfLines={2}
                  >
                    {community.descricao}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      👤 {community.criador_nome}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      👥 {community.membros}
                    </Text>
                  </View>
                </View>

                <Switch
                  style={{ marginLeft: 12 }}
                  value={community.verificada === 1}
                  onValueChange={() => handleToggleVerificacao(community.id, community.verificada)}
                  disabled={toggling === community.id}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={community.verificada ? theme.accent : theme.textTertiary}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
