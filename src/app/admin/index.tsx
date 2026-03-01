import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { adminApi } from "../../services/api";
import type { AdminStats } from "../../services/api/admin";

// ─── KPI card ─────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

function KPICard({ label, value, icon, color, subtitle }: KPICardProps) {
  const theme = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: theme.backgroundSecondary,
      borderRadius: 18, padding: 18, minWidth: "44%",
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 0.8, textTransform: "uppercase" }}>
          {label}
        </Text>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color + "22", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
      </View>
      <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1.2, lineHeight: 34 }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 6 }}>{subtitle}</Text>
      )}
    </View>
  );
}

// ─── Nav card ─────────────────────────────────────────────────────────────────
interface NavCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

function NavCard({ title, subtitle, icon, color, route }: NavCardProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(route as any)}
      accessibilityLabel={title}
      accessibilityRole="button"
      style={({ pressed }) => ({
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 20, paddingHorizontal: 18,
        paddingVertical: 18, flexDirection: "row",
        alignItems: "center", opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: color + "22",
        justifyContent: "center", alignItems: "center", marginRight: 16,
      }}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, letterSpacing: -0.2 }}>{title}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const theme = useTheme();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      // stats remain null — UI handles gracefully
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  const PRO_PRICE = 4.99;
  const estimatedRevenue = stats?.proUsers != null
    ? (stats.proUsers * PRO_PRICE).toFixed(2)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <View style={{ backgroundColor: "#EF444420", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>ADMIN</Text>
              </View>
            </View>
            <Text style={{ color: theme.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.8 }}>
              Dashboard
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
              Olá, {user?.nome?.split(" ")[0]}
            </Text>
          </View>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            accessibilityLabel="Voltar ao início"
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: theme.backgroundSecondary,
              padding: 12, borderRadius: 14,
              opacity: pressed ? 0.7 : 1, marginTop: 4,
            })}
          >
            <Ionicons name="home-outline" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={{ paddingHorizontal: 24, marginTop: 20, marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Visão Geral
        </Text>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <KPICard
                label="Utilizadores"
                value={stats?.totalUsers ?? "—"}
                icon="people-outline"
                color="#0A84FF"
                subtitle={stats?.newUsersThisWeek != null ? `+${stats.newUsersThisWeek} esta semana` : undefined}
              />
              <KPICard
                label="Membros Pro"
                value={stats?.proUsers ?? "—"}
                icon="star-outline"
                color="#F59E0B"
                subtitle={estimatedRevenue ? `~€${estimatedRevenue}/mês` : undefined}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <KPICard
                label="Treinos"
                value={stats?.totalTreinos ?? "—"}
                icon="barbell-outline"
                color="#8B5CF6"
                subtitle="Sessões registadas"
              />
              <KPICard
                label="Exercícios"
                value={stats?.totalExercises ?? "—"}
                icon="fitness-outline"
                color="#10B981"
                subtitle="Na biblioteca"
              />
            </View>
            {stats?.sessionsThisWeek != null && (
              <View style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 18, padding: 18,
                flexDirection: "row", alignItems: "center", gap: 14,
              }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#30D15820", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="trending-up" size={22} color="#30D158" />
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    Sessões Esta Semana
                  </Text>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text, letterSpacing: -0.8, marginTop: 2 }}>
                    {stats.sessionsThisWeek}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Revenue card — derivado de proUsers × preço */}
      {!loading && estimatedRevenue && (
        <View style={{ paddingHorizontal: 24, marginVertical: 8 }}>
          <View style={{ backgroundColor: "#F59E0B18", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#F59E0B30" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#F59E0B", letterSpacing: 1, textTransform: "uppercase" }}>
                Receita Estimada / Mês
              </Text>
              <Ionicons name="card-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={{ fontSize: 40, fontWeight: "800", color: theme.text, letterSpacing: -1.5 }}>
              €{estimatedRevenue}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 6 }}>
              {stats?.proUsers} membros Pro × €{PRO_PRICE}/mês
            </Text>
          </View>
        </View>
      )}

      {/* Gestão */}
      <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Gestão
        </Text>
        <View style={{ gap: 12 }}>
          <NavCard title="Utilizadores"          subtitle="Gerir contas e permissões"       icon="people-outline"   color="#0A84FF" route="/admin/users" />
          <NavCard title="Exercícios"             subtitle="Biblioteca de movimentos"         icon="barbell-outline"  color="#10B981" route="/admin/exercises" />
          <NavCard title="Treinos Recomendados"   subtitle="Planos para todos os utilizadores" icon="star-outline"   color="#8B5CF6" route="/admin/workouts" />
          <NavCard title="Comunidades"            subtitle="Verificar e gerir grupos"        icon="people-circle-outline" color="#F97316" route="/admin/communities" />
        </View>
      </View>
    </ScrollView>
  );
}

