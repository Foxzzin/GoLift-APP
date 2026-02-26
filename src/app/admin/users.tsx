import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { adminApi } from "../../services/api";

export default function AdminUsers() {
  const theme = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
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
      `Tens a certeza que queres apagar "${user.userName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await adminApi.deleteUser(user.id);
              if (data.sucesso) {
                loadUsers();
              } else {
                Alert.alert("Erro", "Erro ao apagar utilizador");
              }
            } catch (error) {
              Alert.alert("Erro", "Erro ao apagar utilizador");
            }
          },
        },
      ]
    );
  }

  const filteredUsers = users.filter(
    (u: any) =>
      u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", flex: 1, color: theme.text }}>Utilizadores</Text>
        <View style={{ backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ color: theme.text, fontWeight: "600" }}>{users.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, paddingHorizontal: 16, borderColor: theme.border, borderWidth: 1 }}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 12, color: theme.text }}
            placeholder="Pesquisar utilizadores..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 32, alignItems: "center", borderColor: theme.border, borderWidth: 1, borderStyle: "dashed" }}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, textAlign: "center" }}>
              Nenhum utilizador encontrado
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredUsers.map((user: any, index: number) => (
              <View
                key={user.id || index}
                style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 16, borderColor: theme.border, borderWidth: 1 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                      backgroundColor: user.id_tipoUser === 1 ? theme.backgroundTertiary : theme.backgroundSecondary,
                    }}
                  >
                    <Ionicons
                      name={user.id_tipoUser === 1 ? "shield" : "person"}
                      size={24}
                      color={theme.text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 18 }}>
                        {user.userName}
                      </Text>
                      {user.id_tipoUser === 1 && (
                        <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{user.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteUser(user)}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* Info extra */}
                <View style={{ flexDirection: "row", marginTop: 12, gap: 16 }}>
                  {user.idade != null && (
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                      {`🎂 ${user.idade} anos`}
                    </Text>
                  )}
                  {user.peso != null && (
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                      {`⚖️ ${user.peso} kg`}
                    </Text>
                  )}
                  {user.altura != null && (
                    <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                      {`📏 ${user.altura} cm`}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
