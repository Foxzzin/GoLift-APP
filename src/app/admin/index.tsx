import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const menuItems = [
    {
      title: "Utilizadores",
      description: "Gerir utilizadores da plataforma",
      icon: "people",
      route: "/admin/users",
    },
    {
      title: "Exercícios",
      description: "Adicionar e editar exercícios",
      icon: "barbell",
      route: "/admin/exercises",
    },
    {
      title: "Treinos Recomendados",
      description: "Criar treinos para todos os utilizadores",
      icon: "fitness",
      route: "/admin/workouts",
    },
    {
      title: "Comunidades",
      description: "Verificar e gerir comunidades",
      icon: "people-circle",
      route: "/admin/communities",
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Painel de Administração
            </Text>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "bold", marginTop: 4 }}>
              Olá, {user?.nome}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={{
              backgroundColor: theme.backgroundSecondary,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 10,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Ionicons name="home" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Panel */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 12,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderColor: theme.border,
          borderWidth: 1,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons name="shield-checkmark" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 16, marginLeft: 12 }}>
              Modo Administrador
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            Tens acesso total às funcionalidades de gestão da plataforma GoLift.
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>
          Gestão
        </Text>
        <View style={{ gap: 12 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(item.route as any)}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderColor: theme.border,
                borderWidth: 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.backgroundTertiary,
                  marginRight: 12,
                }}
              >
                <Ionicons name={item.icon as any} size={24} color={theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 14 }}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={logout}
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="log-out" size={20} color={theme.text} />
          <Text style={{ color: theme.text, fontWeight: "600", marginLeft: 8, fontSize: 14 }}>
            Terminar Sessão
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
