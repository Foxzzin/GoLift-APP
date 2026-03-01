import { useState, useEffect } from "react";
import { planoApi } from "../../services/api/plano";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { adminApi } from "../../services/api";

const GRUPO_COLORS: Record<string, string> = {};

export default function AdminUsers() {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState<{ [userId: number]: boolean }>({});

  async function handleGeneratePlan(user: any) {
    setGenerating((prev) => ({ ...prev, [user.id]: true }));
    try {
      const resp = await planoApi.generatePlan(user.id, 4);
      if (resp.sucesso) {
        Alert.alert("Plano gerado!", `Plano de ${resp.mes} criado para ${user.userName}.`);
      } else {
        Alert.alert("Erro", "Não foi possível gerar o plano.");
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Erro ao gerar plano.");
    } finally {
      setGenerating((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const data = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar os utilizadores.");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }

  async function deleteUser(user: any) {
    Alert.alert(
      "Apagar Utilizador",
      `Tens a certeza que queres apagar "${user.userName}"? Esta ação é permanente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await adminApi.deleteUser(user.id);
              if (data.sucesso) loadUsers();
              else Alert.alert("Erro", "Erro ao apagar utilizador");
            } catch {
              Alert.alert("Erro", "Erro ao apagar utilizador");
            }
          },
        },
      ]
    );
  }

  const filteredUsers = users.filter((u: any) =>
    u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
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
        <Text style={{ fontSize: 22, fontWeight: "800", flex: 1, color: theme.text, letterSpacing: -0.6 }}>Utilizadores</Text>
        <View style={{ backgroundColor: theme.accent + "20", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
          <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 13 }}>{users.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 14, paddingHorizontal: 16 }}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: theme.text, fontSize: 15 }}
            placeholder="Pesquisar utilizadores..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel="Limpar pesquisa">
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {filteredUsers.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 48, alignItems: "center" }}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} style={{ marginBottom: 16 }} />
            <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "600", textAlign: "center" }}>
              Nenhum utilizador encontrado
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredUsers.map((user: any, index: number) => (
              <View
                key={user.id || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 16 }}
              >
                {/* User header row */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 14,
                    backgroundColor: user.id_tipoUser === 1 ? "#EF444420" : theme.accent + "20",
                    justifyContent: "center", alignItems: "center", marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: user.id_tipoUser === 1 ? "#EF4444" : theme.accent }}>
                      {(user.userName || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.2 }}>
                        {user.userName}
                      </Text>
                      {user.id_tipoUser === 1 && (
                        <View style={{ backgroundColor: "#EF444420", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                          <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "700" }}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>

                {/* Stats row */}
                {(user.idade != null || user.peso != null || user.altura != null) && (
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                    {user.idade != null && (
                      <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{user.idade} anos</Text>
                      </View>
                    )}
                    {user.peso != null && (
                      <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{user.peso} kg</Text>
                      </View>
                    )}
                    {user.altura != null && (
                      <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{user.altura} cm</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {user.id_tipoUser !== 1 && (
                    <Pressable
                      onPress={() => handleGeneratePlan(user)}
                      disabled={!!generating[user.id]}
                      accessibilityLabel="Gerar plano IA"
                      accessibilityRole="button"
                      style={({ pressed }) => ({
                        flex: 1, paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: "#8B5CF620",
                        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                        opacity: pressed || !!generating[user.id] ? 0.7 : 1,
                      })}
                    >
                      {generating[user.id]
                        ? <ActivityIndicator size={14} color="#8B5CF6" />
                        : <Ionicons name="sparkles-outline" size={14} color="#8B5CF6" />
                      }
                      <Text style={{ color: "#8B5CF6", fontWeight: "700", fontSize: 13 }}>Plano IA</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => deleteUser(user)}
                    accessibilityLabel="Apagar utilizador"
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      paddingVertical: 10, paddingHorizontal: 18,
                      borderRadius: 12,
                      backgroundColor: "#EF444420",
                      flexDirection: "row", alignItems: "center", gap: 6,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Apagar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
