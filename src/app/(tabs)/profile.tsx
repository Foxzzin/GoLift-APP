import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, metricsApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { getIMCCategory } from "../../utils/imc";
import { ProfileScreenSkeleton } from "../../components/ui/SkeletonLoader";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  lockHint: string;
}

interface WeekDay {
  day: string;
  date: string;
  completed: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeHelper(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

function relativeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
  return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

function generateStreakWeek(): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return { day: dayNames[i], date: `${y}-${m}-${d}`, completed: false };
  });
}

// IMC bar segments
const IMC_SEGMENTS: Array<{ color: string; from: number; to: number }> = [
  { color: "#6b7280", from: 14, to: 18.5 },
  { color: "#10b981", from: 18.5, to: 25 },
  { color: "#84cc16", from: 25, to: 27.5 },
  { color: "#f59e0b", from: 27.5, to: 30 },
  { color: "#f97316", from: 30, to: 35 },
  { color: "#ef4444", from: 35, to: 40 },
  { color: "#991b1b", from: 40, to: 42 },
];
const IMC_TOTAL = 42 - 14;

// Badge definitions
function computeBadges(
  totalWorkouts: number,
  maxStreak: number,
  totalTimeSec: number,
  recordsCount: number,
  planoTipo: "free" | "pago"
): Omit<Badge, "unlockedAt">[] {
  return [
    { id: "first_step",   emoji: "🏁", name: "Primeiro Passo",    description: "Completaste o teu primeiro treino",    unlocked: totalWorkouts >= 1,   lockHint: "Completa 1 treino" },
    { id: "perfect_week", emoji: "🔥", name: "Semana Perfeita",    description: "7 dias consecutivos de treino",        unlocked: maxStreak >= 7,       lockHint: "Treina 7 dias seguidos" },
    { id: "unstoppable",  emoji: "⚡", name: "Imparável",          description: "14 dias consecutivos de treino",       unlocked: maxStreak >= 14,      lockHint: "Treina 14 dias seguidos" },
    { id: "dedicated",    emoji: "💪", name: "Dedicado",            description: "25 treinos completados",              unlocked: totalWorkouts >= 25,  lockHint: "Completa 25 treinos" },
    { id: "veteran",      emoji: "🏆", name: "Veterano",            description: "50 treinos completados",              unlocked: totalWorkouts >= 50,  lockHint: "Completa 50 treinos" },
    { id: "centurion",    emoji: "👑", name: "Centenário",          description: "100 treinos completados",             unlocked: totalWorkouts >= 100, lockHint: "Completa 100 treinos" },
    { id: "marathoner",   emoji: "⏱", name: "Maratonista",         description: "50 horas de treino acumuladas",       unlocked: totalTimeSec >= 50 * 3600, lockHint: "Acumula 50h de treino" },
    { id: "elite",        emoji: "🥇", name: "Atleta de Elite",     description: "Primeiro recorde pessoal registado",  unlocked: recordsCount >= 1,    lockHint: "Regista um recorde pessoal" },
    { id: "progress",     emoji: "📈", name: "Em Progresso",        description: "3 recordes pessoais diferentes",      unlocked: recordsCount >= 3,    lockHint: "Regista 3 recordes diferentes" },
    { id: "pro",          emoji: "⭐", name: "Membro Pro",          description: "Subscrição GoLift Pro activa",         unlocked: planoTipo === "pago", lockHint: "Activa o GoLift Pro" },
  ];
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function IMCBar({ imc }: { imc: number }) {
  const theme = useTheme();
  const clamped = Math.max(14, Math.min(42, imc));
  const pct = ((clamped - 14) / IMC_TOTAL) * 100;
  const imcCategory = getIMCCategory(imc);

  return (
    <View>
      <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
        {IMC_SEGMENTS.map((seg) => (
          <View
            key={seg.from}
            style={{ width: `${((seg.to - seg.from) / IMC_TOTAL) * 100}%` as any, backgroundColor: seg.color }}
          />
        ))}
      </View>
      <View style={{ position: "relative", height: 14, marginBottom: 8 }}>
        <View style={{
          position: "absolute",
          left: `${pct}%` as any,
          transform: [{ translateX: -6 }],
          top: 0,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: imcCategory.color,
          borderWidth: 2,
          borderColor: theme.backgroundSecondary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: theme.textTertiary, fontSize: 10 }}>14</Text>
        <Text style={{ color: imcCategory.color, fontSize: 12, fontWeight: "700" }}>
          {imc.toFixed(1)} — {imcCategory.label}
        </Text>
        <Text style={{ color: theme.textTertiary, fontSize: 10 }}>42+</Text>
      </View>
    </View>
  );
}

function WeekStrip({ weekDays }: { weekDays: WeekDay[] }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
      {weekDays.map((d, i) => (
        <View key={i} style={{ alignItems: "center", gap: 4 }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: d.completed ? theme.accentGreen : theme.backgroundTertiary,
          }} />
          <Text style={{ color: theme.textTertiary, fontSize: 9, fontWeight: "600" }}>
            {d.day.charAt(0)}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface OptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  onPress: () => void;
  hasBorder: boolean;
  locked?: boolean;
}

function OptionRow({ icon, iconBg, label, onPress, hasBorder, locked }: OptionRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: hasBorder ? 1 : 0,
        borderBottomColor: theme.backgroundTertiary,
        opacity: pressed && !locked ? 0.7 : locked ? 0.5 : 1,
      })}
    >
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: locked ? theme.backgroundTertiary : iconBg,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
      }}>
        <Ionicons name={locked ? "lock-closed" : icon} size={17} color={locked ? theme.textTertiary : "#fff"} />
      </View>
      <Text style={{ color: locked ? theme.textTertiary : theme.text, flex: 1, fontSize: 15, fontWeight: "500" }}>
        {label}
      </Text>
      {locked && (
        <Text style={{ color: theme.textTertiary, fontSize: 12, fontWeight: "600" }}>Pro</Text>
      )}
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Profile() {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, thisMonth: 0 });
  const [streakData, setStreakData] = useState({ streak: 0, maxStreak: 0 });
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [weekDays, setWeekDays] = useState<WeekDay[]>(generateStreakWeek());
  const [lastSession, setLastSession] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);


  // Fade-in moderado apenas no hero (P24.1)
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileData, recordsData, statsData, streakResp, historyData, planData] =
        await Promise.all([
          userApi.getProfile(user!.id).catch(() => null),
          metricsApi.getRecords(user!.id).catch(() => []),
          metricsApi.getStats(user!.id).catch(() => null),
          metricsApi.getStreak(user!.id).catch(() => null),
          metricsApi.getHistory(user!.id).catch(() => null),
          planoApi.getUserPlan(user!.id).catch(() => ({ plano: "free" as const, ativo_ate: null })),
        ]);

      const mapped = profileData?.user
        ? { id: profileData.user.id, nome: profileData.user.name, email: profileData.user.email, idade: profileData.user.age, peso: profileData.user.weight, altura: profileData.user.height }
        : user;
      setProfile(mapped);

      const recs = recordsData || [];
      setRecords(recs);

      const sd = { streak: streakResp?.streak || 0, maxStreak: streakResp?.maxStreak || 0 };
      setStreakData(sd);

      const tipo = planData?.plano || "free";
      setPlanoTipo(tipo);

      if (statsData) {
        setStats({ totalWorkouts: statsData.totalWorkouts || 0, totalTime: statsData.totalTime || 0, thisMonth: statsData.thisMonth || 0 });
      }

      // Semana de actividade
      const sessoesList = Array.isArray(historyData) ? historyData : historyData?.treinos || [];
      const workoutDatesSet = new Set<string>(
        sessoesList.map((s: any) => {
          const raw = s.data_fim || s.data_inicio || s.data;
          if (!raw) return null;
          const d = new Date(raw);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }).filter(Boolean) as string[]
      );
      const week = generateStreakWeek();
      week.forEach((w) => { w.completed = workoutDatesSet.has(w.date); });
      setWeekDays(week);

      if (sessoesList.length > 0) setLastSession(sessoesList[0]);

      // Badges + AsyncStorage
      const allBadges = computeBadges(statsData?.totalWorkouts || 0, sd.maxStreak, statsData?.totalTime || 0, recs.length, tipo);
      const storedRaw = await AsyncStorage.getItem("@golift:badges").catch(() => null);
      const stored: Record<string, string> = storedRaw ? JSON.parse(storedRaw) : {};
      const now = new Date().toISOString();
      const updates: Record<string, string> = {};
      const finalBadges: Badge[] = allBadges.map((b) => {
        if (b.unlocked && !stored[b.id]) updates[b.id] = now;
        return { ...b, unlockedAt: stored[b.id] || (b.unlocked ? now : undefined) };
      });
      if (Object.keys(updates).length > 0) {
        await AsyncStorage.setItem("@golift:badges", JSON.stringify({ ...stored, ...updates })).catch(() => {});
      }
      setBadges(finalBadges);

    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setProfile(user);
    } finally {
      setLoading(false);
      Animated.timing(heroOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }





  function handleLogout() {
    Alert.alert("Sair", "Tens a certeza que queres sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  // Subtítulo contextual dinâmico (P17.3)
  const contextualSubtitle = useMemo(() => {
    const { streak } = streakData;
    if (streak >= 7) return `Em chamas · ${streak} dias seguidos 🔥`;
    if (streak >= 3) return `${streak} dias consecutivos · continua assim`;
    if (streak === 0 && lastSession) {
      const ago = relativeDate(lastSession.data_fim || lastSession.data_inicio);
      return ago ? `Último treino ${ago}` : "Volta ao ritmo";
    }
    if (!lastSession) return "Começa hoje — o primeiro passo é o mais difícil";
    return `${streak} dia consecutivo`;
  }, [streakData, lastSession]);

  const imc = useMemo(() => {
    if (!profile?.peso || !profile?.altura) return null;
    const h = profile.altura / 100;
    return profile.peso / (h * h);
  }, [profile]);

  if (loading) {
    return <ProfileScreenSkeleton />;
  }

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const orderedBadges = [...badges.filter((b) => b.unlocked), ...badges.filter((b) => !b.unlocked)];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1, flex: 1 }}>
            Perfil
          </Text>
          <Pressable
            onPress={() => router.push("/account")}
            accessibilityRole="button"
            accessibilityLabel="Definições da conta"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* HERO — avatar + nome + subtítulo + semana */}
        <Animated.View style={{ opacity: heroOpacity, alignItems: "center", paddingHorizontal: 24, marginBottom: 28, paddingTop: 16 }}>
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 26,
            backgroundColor: theme.accent,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: -1 }}>
              {(profile?.nome || user?.nome || "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 23, fontWeight: "800", color: theme.text, letterSpacing: -0.5, marginTop: 14, textAlign: "center" }}>
            {profile?.nome || "Atleta"}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 5, textAlign: "center", letterSpacing: 0.1 }}>
            {contextualSubtitle}
          </Text>
          {planoTipo === "pago" && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, backgroundColor: "#f59e0b22", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
              <Ionicons name="star" size={11} color="#f59e0b" style={{ marginRight: 5 }} />
              <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 12, letterSpacing: 0.2 }}>GoLift Pro</Text>
            </View>
          )}
          <WeekStrip weekDays={weekDays} />
        </Animated.View>

        {/* STAT HERÓI — Total de Treinos */}
        <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
          <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>
              Total de Treinos
            </Text>
            <Text style={{ fontSize: 64, fontWeight: "800", color: "#fff", letterSpacing: -2.5, lineHeight: 66 }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 6, fontWeight: "500" }}>
              sessões completadas
            </Text>
          </View>
        </View>

        {/* UPGRADE (apenas Free) — alta visibilidade logo após o hero */}
        {planoTipo !== "pago" && (
          <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <Pressable
              onPress={() => router.push("/upgrade")}
              accessibilityLabel="Desbloquear GoLift Pro"
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: theme.accent,
                borderRadius: 20,
                paddingHorizontal: 20,
                paddingVertical: 18,
                flexDirection: "row",
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: -0.3 }}>Desbloquea GoLift Pro ⭐</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3 }}>IA · relatórios · planos personalizados</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
        )}

        {/* STATS GRID 2×2 */}
        <View style={{ paddingHorizontal: 24, flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          {([
            { label: "Tempo Total",    value: formatTimeHelper(stats.totalTime) },
            { label: "Melhor Streak",  value: `${streakData.maxStreak}d` },
            { label: "Este Mês",       value: `${stats.thisMonth}` },
            { label: "Recordes",       value: `${records.length}` },
          ] as const).map((s) => (
            <View key={s.label} style={{
              flex: 1,
              minWidth: "45%",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 20,
              paddingVertical: 20,
              paddingHorizontal: 16,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                {s.label}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ÚLTIMA SESSÃO (P21.2) */}
        {lastSession && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              Última Sessão
            </Text>
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", flexDirection: "row" }}>
              <View style={{ width: 4, backgroundColor: theme.accentGreen }} />
              <View style={{ flex: 1, paddingHorizontal: 18, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, letterSpacing: -0.3, marginBottom: 3 }}>
                    {lastSession.nome_treino || lastSession.nome || "Treino"}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {relativeDate(lastSession.data_fim || lastSession.data_inicio)}
                    {(lastSession.duracao_segundos || 0) > 0 ? ` · ${formatTimeHelper(lastSession.duracao_segundos)}` : ""}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Recomeçar este treino"
                  accessibilityRole="button"
                  onPress={() => lastSession.id_treino && router.push({ pathname: "/workout/[id]", params: { id: lastSession.id_treino } })}
                  style={({ pressed }) => ({ backgroundColor: theme.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.8 : 1 })}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>▶ Recomeçar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* DADOS FÍSICOS */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
            Dados Físicos
          </Text>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, overflow: "hidden" }}>
            {[
              { label: "Idade",  value: profile?.idade  ? `${profile.idade} anos` : null },
              { label: "Peso",   value: profile?.peso   ? `${profile.peso} kg`    : null },
              { label: "Altura", value: profile?.altura ? `${profile.altura} cm`  : null },
            ].map((item) => (
              <View key={item.label} style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.backgroundTertiary,
              }}>
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>{item.label}</Text>
                <Text style={{ color: item.value ? theme.text : theme.textTertiary, fontWeight: "600", fontSize: 14 }}>
                  {item.value ?? "Não definido"}
                </Text>
              </View>
            ))}
            {/* IMC com barra visual */}
            <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: imc ? 16 : 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: imc ? 14 : 0 }}>
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>IMC</Text>
                {!imc && (
                  <Text style={{ color: theme.textTertiary, fontWeight: "600", fontSize: 13 }}>
                    Define peso e altura
                  </Text>
                )}
              </View>
              {imc ? <IMCBar imc={imc} /> : null}
            </View>
          </View>
        </View>

        {/* RECORDES PESSOAIS */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
              Melhores Recordes
            </Text>
            {records.length > 3 && (
              <Pressable onPress={() => setShowAllRecords(true)} accessibilityRole="button" accessibilityLabel="Ver todos os recordes">
                <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>Ver todos ({records.length})</Text>
              </Pressable>
            )}
          </View>

          {records.length === 0 ? (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 28, alignItems: "center" }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🏅</Text>
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, marginBottom: 6, textAlign: "center" }}>Ainda sem recordes</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 }}>
                Regista séries no treino activo para este espaço ganhar vida
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/workouts")}
                accessibilityRole="button"
                accessibilityLabel="Ir treinar"
                style={({ pressed }) => ({ backgroundColor: theme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ir Treinar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, overflow: "hidden" }}>
              {records.slice(0, 3).map((record, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const mc = ["#f59e0b", "#94a3b8", "#cd7f32"];
                const dateStr = relativeDate(record.data_recorde || record.data || record.created_at);
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Recorde de ${record.nome_exercicio || record.exercicio}`}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 18,
                      paddingVertical: 16,
                      borderBottomWidth: i < 2 ? 1 : 0,
                      borderBottomColor: theme.backgroundTertiary,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 22, marginRight: 14 }}>{medals[i] || "🏅"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600", marginBottom: 2 }}>
                        {record.nome_exercicio || record.exercicio || record.exercise}
                      </Text>
                      {dateStr && <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{dateStr}</Text>}
                    </View>
                    <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                      <Text style={{ color: mc[i] || theme.accent, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
                        {record.peso || record.weight}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>kg</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* CONQUISTAS (P22) */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
              Conquistas
            </Text>
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
              {unlockedBadges.length}/{badges.length} desbloqueadas
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {orderedBadges.map((badge) => (
              <Pressable
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                accessibilityRole="button"
                accessibilityLabel={badge.name}
                style={({ pressed }) => ({
                  width: "30%",
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 8,
                  alignItems: "center",
                  opacity: pressed ? 0.75 : badge.unlocked ? 1 : 0.4,
                })}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{badge.emoji}</Text>
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "700", color: badge.unlocked ? theme.text : theme.textTertiary, textAlign: "center" }}>
                  {badge.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* INFO DA CONTA */}
        {profile?.email && (
          <View style={{ paddingHorizontal: 24, marginBottom: 16, alignItems: "center" }}>
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{profile.email}</Text>
          </View>
        )}

        {/* LOGOUT */}
        <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
          <Pressable
            onPress={handleLogout}
            accessibilityLabel="Terminar sessão"
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              paddingVertical: 16,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 14 }}>Terminar Sessão</Text>
          </Pressable>
        </View>

        <Text style={{ color: theme.textTertiary, textAlign: "center", marginTop: 20, marginBottom: 8, fontSize: 11 }}>
          GoLift v1.0.0
        </Text>
      </ScrollView>

      {/* MODAL — Todos os recordes */}
      <Modal visible={showAllRecords} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40, maxHeight: "85%" }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>Todos os Recordes</Text>
              <Pressable
                onPress={() => setShowAllRecords(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: 12, padding: 8, opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              <View style={{ backgroundColor: theme.background, borderRadius: 20, overflow: "hidden" }}>
                {records.map((record, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const mc = ["#f59e0b", "#94a3b8", "#cd7f32"];
                  const dateStr = relativeDate(record.data_recorde || record.data || record.created_at);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 18,
                        paddingVertical: 14,
                        borderBottomWidth: i < records.length - 1 ? 1 : 0,
                        borderBottomColor: theme.backgroundSecondary,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 18, marginRight: 14 }}>{medals[i] || `#${i + 1}`}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: "500", marginBottom: 2 }}>
                          {record.nome_exercicio || record.exercicio || record.exercise}
                        </Text>
                        {dateStr && <Text style={{ color: theme.textTertiary, fontSize: 12 }}>{dateStr}</Text>}
                      </View>
                      <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                        <Text style={{ color: mc[i] || theme.accent, fontSize: 17, fontWeight: "800" }}>
                          {record.peso || record.weight}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11 }}>kg</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL — Detalhe de Badge */}
      <Modal visible={!!selectedBadge} animationType="fade" transparent>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 32 }}
          onPress={() => setSelectedBadge(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 28, alignItems: "center", width: 280 }}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>{selectedBadge?.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5, marginBottom: 6, textAlign: "center" }}>
                {selectedBadge?.name}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 16 }}>
                {selectedBadge?.unlocked ? selectedBadge.description : selectedBadge?.lockHint}
              </Text>
              {selectedBadge?.unlocked && selectedBadge.unlockedAt && (
                <Text style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 12 }}>
                  Desbloqueada {relativeDate(selectedBadge.unlockedAt)}
                </Text>
              )}
              {!selectedBadge?.unlocked && (
                <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="lock-closed" size={12} color={theme.textTertiary} />
                  <Text style={{ color: theme.textTertiary, fontSize: 12, fontWeight: "600" }}>Bloqueada</Text>
                </View>
              )}
              <Pressable
                onPress={() => setSelectedBadge(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={({ pressed }) => ({ marginTop: 12, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Fechar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>


    </>
  );
}