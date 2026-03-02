import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

interface SessionPoint {
  date: string;
  maxPeso: number;
  totalSeries: number;
}

export default function ExerciseProgress() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionPoint[]>([]);
  const [bestRecord, setBestRecord] = useState<{ peso: number; date: string } | null>(null);

  useEffect(() => {
    if (user?.id && id) loadData();
  }, [user, id]);

  async function loadData() {
    setLoading(true);
    try {
      const history = await metricsApi.getHistory(user!.id).catch(() => []);
      const historyItems: any[] = Array.isArray(history?.treinos)
        ? history.treinos
        : Array.isArray(history)
        ? history
        : [];

      // Filtrar sessões que têm este exercício
      const exercicioId = Number(id);
      const sessionPoints: SessionPoint[] = [];

      for (const sessao of historyItems) {
        if (!sessao.id_sessao) continue;
        try {
          const details = await metricsApi.getSessionDetails(sessao.id_sessao);
          if (!details?.exercicios) continue;

          const exercicio = details.exercicios.find(
            (ex: any) => ex.id_exercicio === exercicioId || String(ex.id_exercicio) === String(id)
          );
          if (!exercicio?.series?.length) continue;

          const maxPeso = Math.max(...exercicio.series.map((s: any) => Number(s.peso) || 0));
          if (maxPeso === 0) continue;

          sessionPoints.push({
            date: sessao.data_inicio || sessao.data || "",
            maxPeso,
            totalSeries: exercicio.series.length,
          });
        } catch {
          // skip session
        }
      }

      // Sort by date descending, take last 12
      sessionPoints.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last12 = sessionPoints.slice(0, 12).reverse(); // oldest first for chart
      setSessions(last12);

      if (last12.length > 0) {
        const best = last12.reduce((prev, curr) => (curr.maxPeso > prev.maxPeso ? curr : prev));
        setBestRecord({ peso: best.maxPeso, date: best.date });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  }

  const exerciseName = nome || `Exercício #${id}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: safeTop + 20, paddingBottom: 20 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center", alignItems: "center",
            marginRight: 14, opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.6 }} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
            Histórico de progressão
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 14, fontSize: 14 }}>A carregar histórico…</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📊</Text>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
            Sem dados ainda
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 20 }}>
            Faz pelo menos uma sessão com este exercício para ver a tua progressão
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>

          {/* Hero record */}
          {bestRecord && (
            <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 24, marginBottom: 20 }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                Melhor Marca
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: "#fff", fontSize: 56, fontWeight: "800", letterSpacing: -2, lineHeight: 58 }}>
                  {bestRecord.peso}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, fontWeight: "600", marginBottom: 6 }}>
                  kg
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
                {formatDate(bestRecord.date)}
              </Text>
            </View>
          )}

          {/* Bar chart */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 20, marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
              Progressão (kg máx por sessão)
            </Text>
            {(() => {
              const maxVal = Math.max(...sessions.map(s => s.maxPeso), 1);
              return (
                <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 4 }}>
                  {sessions.map((s, i) => {
                    const isLast = i === sessions.length - 1;
                    const isBest = s.maxPeso === bestRecord?.peso;
                    const pct = s.maxPeso / maxVal;
                    return (
                      <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                        <View style={{
                          width: "100%",
                          height: Math.max(4, pct * 64),
                          borderRadius: 4,
                          backgroundColor: isBest
                            ? theme.accentGreen
                            : isLast
                            ? theme.accent
                            : theme.accent + "50",
                        }} />
                        <Text style={{
                          fontSize: 8,
                          color: isLast ? theme.accent : theme.textTertiary,
                          fontWeight: isLast ? "700" : "400",
                          textAlign: "center",
                        }} numberOfLines={1}>
                          {formatDate(s.date).split(" ")[0]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>

          {/* History table */}
          <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
            Histórico
          </Text>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, overflow: "hidden" }}>
            {[...sessions].reverse().slice(0, 10).map((s, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderBottomWidth: i < ([...sessions].reverse().slice(0, 10).length - 1) ? 1 : 0,
                  borderBottomColor: theme.backgroundTertiary,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{formatDate(s.date)}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{s.totalSeries} série{s.totalSeries !== 1 ? "s" : ""}</Text>
                </View>
                <Text style={{ color: s.maxPeso === bestRecord?.peso ? theme.accentGreen : theme.accent, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                  {s.maxPeso}
                  <Text style={{ fontSize: 13, fontWeight: "600" }}> kg</Text>
                </Text>
                {s.maxPeso === bestRecord?.peso && (
                  <Text style={{ marginLeft: 6, fontSize: 16 }}>🏆</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
