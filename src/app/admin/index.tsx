import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: "Utilizadores",
      description: "Gerir utilizadores da plataforma",
      icon: "people",
      color: "#3b82f6",
      route: "/admin/users",
    },
    {
      title: "Exercícios",
      description: "Adicionar e editar exercícios",
      icon: "barbell",
      color: "#22c55e",
      route: "/admin/exercises",
    },
    {
      title: "Treinos Recomendados",
      description: "Criar treinos para todos os utilizadores",
      icon: "fitness",
      color: "#a855f7",
      route: "/admin/workouts",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-[#0d1b2a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400">Painel de Administração</Text>
            <Text className="text-white text-2xl font-bold">
              Olá, {user?.nome} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-white/10 p-3 rounded-xl"
          >
            <Ionicons name="home" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats rápidos */}
      <View className="px-6 mb-6">
        <View className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl p-6 border border-blue-500/30">
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={24} color="#3b82f6" />
            <Text className="text-white font-bold text-lg ml-2">
              Modo Administrador
            </Text>
          </View>
          <Text className="text-gray-300">
            Tens acesso total às funcionalidades de gestão da plataforma GoLift.
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View className="px-6 gap-4">
        <Text className="text-white text-lg font-semibold mb-2">
          Gestão
        </Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(item.route as any)}
            className="bg-white/5 rounded-2xl p-5 border border-white/10 flex-row items-center"
          >
            <View
              className="w-14 h-14 rounded-xl items-center justify-center mr-4"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{item.title}</Text>
              <Text className="text-gray-400 text-sm">{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <View className="px-6 mt-8 mb-10">
        <TouchableOpacity
          onPress={logout}
          className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text className="text-red-400 font-semibold ml-2">Terminar Sessão</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
