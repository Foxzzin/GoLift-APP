import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";

interface Relatorio {
  avaliacao: string;
  equilibrio: string;
  progressao: string;
  descanso: string;
  melhorias: string[];
}

interface ReportSection {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

export default function AIReport() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [semanaInicio, setSemanaInicio] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [podeGerar, setPodeGerar] = useState(false);
  const [semPlano, setSemPlano] = useState(false);

  useEffect(() => {
    if (user?.id) loadReport();
  }, [user]);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await planoApi.getReport(user!.id);
      setRelatorio(data.relatorio);
      setSemanaInicio(data.semana_inicio || "");
      // Se ainda não há relatório e pode gerar, auto-gerar
      if (!data.relatorio && !data.cached) {
        setPodeGerar(true);
        // Auto-gerar ao abrir (lógica de segunda-feira)
        autoGenerate();
      }
    } catch (err: any) {
      if (err?.message?.includes("PLANO_NECESSARIO") || err?.status === 403) {
        setSemPlano(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function autoGenerate() {
    // Gera apenas às segundas-feiras automaticamente
    const hoje = new Date();
    if (hoje.getDay() === 1) {
      await generateReport();
    }
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const data = await planoApi.getReport(user!.id);
      if (data.relatorio) {
        setRelatorio(data.relatorio);
        setSemanaInicio(data.semana_inicio || "");
        setPodeGerar(false);
      } else {
        Alert.alert("Relatório", "Ainda não há dados suficientes na semana passada para gerar um relatório.");
      }
    } catch (err: any) {
      Alert.alert(
        err?.message?.includes("Limite") ? "IA Indisponível" : "Erro",
        err?.message || "Não foi possível gerar o relatório. Tenta mais tarde."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleManualGenerate() {
    Alert.alert(
      "Gerar Relatório",
      "Gerar um novo relatório com base nos treinos da semana passada?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Gerar", onPress: generateReport },
      ]
    );
  }

  function formatSemana(dataStr: string) {
    if (!dataStr) return "";
    const inicio = new Date(dataStr);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
    return `${inicio.toLocaleDateString("pt-PT", opts)} – ${fim.toLocaleDateString("pt-PT", opts)}`;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (semPlano) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: safeTop + 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              marginRight: 14, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
            Relatório Semanal
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 36 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: "#30D15822",
            justifyContent: "center", alignItems: "center",
            marginBottom: 20,
          }}>
            <Ionicons name="bar-chart" size={32} color="#30D158" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, textAlign: "center", letterSpacing: -0.5, marginBottom: 10 }}>
            Funcionalidade Pro
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, fontSize: 15, marginBottom: 28 }}>
            Subscreve o GoLift Pro para acederes a relatórios semanais gerados por IA.
          </Text>
          <Pressable
            onPress={() => router.push("/upgrade")}
            accessibilityRole="button"
            accessibilityLabel="Ver planos Pro"
            style={({ pressed }) => ({
              backgroundColor: theme.accent, borderRadius: 14,
              paddingVertical: 14, paddingHorizontal: 32,
              flexDirection: "row", alignItems: "center", gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ver Planos Pro</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const sections: ReportSection[] = relatorio ? [
    { icon: "trophy-outline", label: "Avaliação Geral", value: relatorio.avaliacao, color: theme.accentGreen },
    { icon: "body-outline", label: "Equilíbrio Muscular", value: relatorio.equilibrio, color: theme.accentBlue },
    { icon: "trending-up-outline", label: "Progressão", value: relatorio.progressao, color: theme.accent },
    { icon: "moon-outline", label: "Descanso & Recuperação", value: relatorio.descanso, color: "#a78bfa" },
  ] : [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: safeTop + 16, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center", alignItems: "center",
            marginRight: 14, opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
            Relatório Semanal
          </Text>
          {semanaInicio && (
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 1 }}>
              {formatSemana(semanaInicio)}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ backgroundColor: "#30D15822", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="sparkles" size={12} color="#30D158" />
            <Text style={{ color: "#30D158", fontSize: 11, fontWeight: "700" }}>IA</Text>
          </View>
          <Pressable
            onPress={handleManualGenerate}
            disabled={generating}
            accessibilityRole="button"
            accessibilityLabel="Gerar novo relatório"
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {generating
              ? <ActivityIndicator size="small" color={theme.accent} />
              : <Ionicons name="refresh-outline" size={18} color={theme.accent} />
            }
          </Pressable>
        </View>
      </View>

      {generating && !relatorio && (
        <View style={{ alignItems: "center", paddingVertical: 80 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: "#30D15822",
            justifyContent: "center", alignItems: "center",
            marginBottom: 20,
          }}>
            <ActivityIndicator size="large" color="#30D158" />
          </View>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 17, marginBottom: 6 }}>
            A analisar os teus treinos...
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Pode demorar alguns segundos</Text>
        </View>
      )}

      {!relatorio && !generating && (
        <View style={{ padding: 20 }}>
          {/* Hero card */}
          <View style={{
            backgroundColor: "#30D158",
            borderRadius: 24, padding: 24, marginBottom: 20,
          }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
              ANÁLISE SEMANAL
            </Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5, lineHeight: 28, marginBottom: 8 }}>
              A IA analisa a tua{"\n"}semana de treino
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 }}>
              Desempenho, equilíbrio muscular, progressão e sugestões personalizadas.
            </Text>
          </View>
          <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, fontSize: 14, marginBottom: 24 }}>
            O relatório é gerado automaticamente às segundas-feiras.{"\n"}
            Podes também gerar manualmente com os dados da semana passada.
          </Text>
          <Pressable
            onPress={generateReport}
            accessibilityRole="button"
            accessibilityLabel="Gerar relatório"
            style={({ pressed }) => ({
              backgroundColor: "#30D158",
              borderRadius: 16, paddingVertical: 16,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Gerar Relatório</Text>
          </Pressable>
        </View>
      )}

      {relatorio && !generating && (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* Cards de secções */}
          {sections.map((s, i) => (
            <View
              key={i}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20,
                padding: 18,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: s.color,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: s.color + "22", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name={s.icon} size={16} color={s.color} />
                </View>
                <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>{s.label}</Text>
              </View>
              <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{s.value}</Text>
            </View>
          ))}

          {/* Sugestões */}
          {relatorio.melhorias?.length > 0 && (
            <View style={{
              backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18, marginTop: 4,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#f59e0b22", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="bulb" size={16} color="#f59e0b" />
                </View>
                <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>Sugestões para esta semana</Text>
              </View>
              {relatorio.melhorias.map((m: string, i: number) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: "#f59e0b22",
                    justifyContent: "center", alignItems: "center",
                    marginRight: 10, marginTop: 1, flexShrink: 0,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#f59e0b" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: theme.textSecondary, flex: 1, lineHeight: 22, fontSize: 14 }}>{m}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Nota IA */}
          <View style={{
            marginTop: 16, marginBottom: 8, padding: 14, borderRadius: 14,
            backgroundColor: theme.backgroundSecondary,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}>
            <Ionicons name="sparkles-outline" size={14} color={theme.textTertiary} />
            <Text style={{ color: theme.textTertiary, fontSize: 11, flex: 1, lineHeight: 16 }}>
              Relatório gerado por IA com base nos teus treinos da semana passada. Atualiza às segundas-feiras.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
