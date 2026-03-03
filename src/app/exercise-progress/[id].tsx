import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

interface HistoryEntry {
  peso: number;
  repeticoes: number;
  data_serie: string;
}

const CHART_H = 180;
const PAD = { left: 40, right: 20, top: 16, bottom: 36 };

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function LineChart({
  data,
  accent,
  bg,
  textSecondary,
}: {
  data: HistoryEntry[];
  accent: string;
  bg: string;
  textSecondary: string;
}) {
  const screenWidth = Dimensions.get("window").width;
  const chartW = screenWidth - 48;
  const plotW = chartW - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const weights = data.map((e) => e.peso);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const pts = data.map((entry, i) => ({
    x: PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    y: PAD.top + plotH - ((entry.peso - minW) / range) * plotH,
    entry,
  }));

  const segments = pts.slice(0, -1).map((p1, i) => {
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return {
      left: p1.x, top: p1.y,
      width: Math.sqrt(dx * dx + dy * dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  });

  const yLabels = [minW, minW + range / 2, maxW];

  return (
    <View style={{ height: CHART_H, width: chartW }}>
      {yLabels.map((val, i) => {
        const y = PAD.top + plotH - ((val - minW) / range) * plotH;
        return (
          <View key={i} style={{ position: "absolute", left: 0, top: y, width: chartW, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ width: PAD.left - 8, textAlign: "right", color: textSecondary, fontSize: 10, fontWeight: "600" }}>
              {Math.round(val)}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: bg }} />
          </View>
        );
      })}

      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: s.left, top: s.top,
            width: s.width, height: 2.5,
            backgroundColor: accent,
            borderRadius: 2,
            transformOrigin: "left center",
            transform: [{ rotate: `${s.angle}deg` }],
          }}
        />
      ))}

      {pts.map((p, i) => (
        <View key={i}>
          <View
            style={{
              position: "absolute",
              left: p.x - 5, top: p.y - 5,
              width: 10, height: 10,
              borderRadius: 5,
              backgroundColor: accent,
              borderWidth: 2, borderColor: "white",
            }}
          />
          {(i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1) && (
            <Text
              style={{
                position: "absolute",
                left: p.x - 22,
                top: PAD.top + plotH + 8,
                width: 44, textAlign: "center",
                color: textSecondary, fontSize: 10, fontWeight: "600",
              }}
            >
              {formatDate(p.entry.data_serie)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function ExerciseProgress() {
  const theme = useTheme();
  const { paddingTop } = useAndroidInsets();
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function load() {
    setError(false);
    setLoading(true);
    metricsApi
      .getExerciseHistory(user!.id, Number(id))
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.data_serie).getTime() - new Date(b.data_serie).getTime()
        );
        setHistory(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.id && id) load();
  }, [user, id]);

  const exerciseName = nome || `Exercício #${id}`;
  const maxPeso = history.length > 0 ? Math.max(...history.map((e) => e.peso)) : 0;
  const lastEntry = history[history.length - 1];
  const firstEntry = history[0];
  const progress = history.length > 1 ? lastEntry.peso - firstEntry.peso : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: paddingTop + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.backgroundTertiary,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: theme.backgroundSecondary,
            alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 1 }}>
            Progressão
          </Text>
        </View>

        {progress !== 0 && (
          <View
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
              backgroundColor: progress > 0 ? "#30D15820" : "#FF453A20",
            }}
          >
            <Text style={{ color: progress > 0 ? "#30D158" : "#FF453A", fontWeight: "700", fontSize: 13 }}>
              {progress > 0 ? "+" : ""}{progress.toFixed(1)} kg
            </Text>
          </View>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 14, fontSize: 14 }}>A carregar…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 12 }}>
            Não foi possível carregar os dados
          </Text>
          <Pressable
            onPress={load}
            accessibilityLabel="Tentar novamente"
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 20, backgroundColor: theme.accent,
              paddingHorizontal: 24, paddingVertical: 12,
              borderRadius: 14, opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : history.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 12 }}>
            Ainda não há registos para este exercício
          </Text>
          <Text style={{ color: theme.textTertiary, fontSize: 14, textAlign: "center", marginTop: 6 }}>
            Completa um treino com {exerciseName} para ver o teu progresso
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Máximo", value: `${maxPeso} kg`, icon: "trophy" as const, color: "#FFD60A" },
              { label: "Sessões", value: String(history.length), icon: "calendar" as const, color: theme.accent },
              { label: "Último", value: lastEntry ? `${lastEntry.peso} kg` : "—", icon: "time-outline" as const, color: "#30D158" },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1, backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16, padding: 14,
                  alignItems: "center", gap: 4,
                }}
              >
                <Ionicons name={stat.icon} size={20} color={stat.color} />
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.4 }}>
                  {stat.value}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Line chart */}
          {history.length > 1 && (
            <View
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20, padding: 16, marginBottom: 24,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, marginBottom: 12 }}>
                Evolução do Peso
              </Text>
              <LineChart
                data={history}
                accent={theme.accent}
                bg={theme.backgroundTertiary}
                textSecondary={theme.textSecondary}
              />
            </View>
          )}

          {/* Session list */}
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Histórico
          </Text>
          <View style={{ gap: 10 }}>
            {[...history].reverse().map((entry, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
                  flexDirection: "row", alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: theme.backgroundTertiary,
                    alignItems: "center", justifyContent: "center", marginRight: 14,
                  }}
                >
                  <Ionicons name="barbell" size={18} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
                    {entry.peso} kg
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {entry.repeticoes} rep · {formatDate(entry.data_serie)}
                  </Text>
                </View>
                {index === 0 && (
                  <View style={{ backgroundColor: "#30D15820", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: "#30D158", fontSize: 11, fontWeight: "700" }}>ÚLTIMO</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}


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
