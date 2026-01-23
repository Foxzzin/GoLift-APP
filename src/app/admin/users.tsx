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

const API_URL = "http://10.0.2.2:5000";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`);
      const data = await response.json();
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
              const response = await fetch(
                `${API_URL}/api/admin/users/${user.id}`,
                { method: "DELETE" }
              );
              const data = await response.json();
              if (data.sucesso) {
                loadUsers();
              } else {
                Alert.alert("Erro", data.erro || "Erro ao apagar utilizador");
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
    (u) =>
      u.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 bg-[#0d1b2a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0d1b2a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Utilizadores</Text>
        <View className="bg-blue-500/20 px-3 py-1 rounded-full">
          <Text className="text-blue-400 font-semibold">{users.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 mb-4">
        <View className="flex-row items-center bg-white/5 rounded-xl px-4 border border-white/10">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 py-3 px-3 text-white"
            placeholder="Pesquisar utilizadores..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View className="bg-white/5 rounded-2xl p-8 items-center border border-dashed border-white/20">
            <Ionicons name="people-outline" size={48} color="#6b7280" />
            <Text className="text-gray-400 mt-4 text-center">
              Nenhum utilizador encontrado
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredUsers.map((user, index) => (
              <View
                key={user.id || index}
                className="bg-white/5 rounded-2xl p-4 border border-white/10"
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                      user.id_tipoUser === 1 ? "bg-purple-500/20" : "bg-blue-500/20"
                    }`}
                  >
                    <Ionicons
                      name={user.id_tipoUser === 1 ? "shield" : "person"}
                      size={24}
                      color={user.id_tipoUser === 1 ? "#a855f7" : "#3b82f6"}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-lg">
                        {user.userName}
                      </Text>
                      {user.id_tipoUser === 1 && (
                        <View className="bg-purple-500/20 px-2 py-1 rounded ml-2">
                          <Text className="text-purple-400 text-xs">Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-sm">{user.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteUser(user)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* Info extra */}
                <View className="flex-row mt-3 gap-4">
                  {user.idade != null && (
                    <Text className="text-gray-500 text-sm">
                      {`🎂 ${user.idade} anos`}
                    </Text>
                  )}
                  {user.peso != null && (
                    <Text className="text-gray-500 text-sm">
                      {`⚖️ ${user.peso} kg`}
                    </Text>
                  )}
                  {user.altura != null && (
                    <Text className="text-gray-500 text-sm">
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
