import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";

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
        <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>Relatório Semanal</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.textTertiary} />
          <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, marginTop: 16, textAlign: "center" }}>
            Plano Pro necessário
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Subscreve o GoLift Pro para acederes a relatórios semanais gerados por IA.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/upgrade")}
            style={{
              marginTop: 24, backgroundColor: theme.accent, borderRadius: 12,
              paddingVertical: 14, paddingHorizontal: 28,
              flexDirection: "row", alignItems: "center", gap: 8,
            }}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ver Planos</Text>
          </TouchableOpacity>
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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>Relatório Semanal</Text>
        </View>
        <TouchableOpacity
          onPress={handleManualGenerate}
          disabled={generating}
          style={{
            backgroundColor: theme.backgroundSecondary, borderRadius: 10,
            padding: 8, borderWidth: 1, borderColor: theme.border,
          }}
        >
          {generating
            ? <ActivityIndicator size="small" color={theme.accent} />
            : <Ionicons name="refresh-outline" size={20} color={theme.accent} />
          }
        </TouchableOpacity>
      </View>

      {/* Semana */}
      {semanaInicio && (
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: theme.backgroundSecondary, borderRadius: 10,
            paddingVertical: 8, paddingHorizontal: 12, alignSelf: "flex-start",
          }}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <Text style={{ fontSize: 13, color: theme.textSecondary }}>
              Semana {formatSemana(semanaInicio)}
            </Text>
          </View>
        </View>
      )}

      {generating && !relatorio && (
        <View style={{ alignItems: "center", padding: 40 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14 }}>
            A analisar os teus treinos...
          </Text>
        </View>
      )}

      {!relatorio && !generating && (
        <View style={{ alignItems: "center", padding: 40 }}>
          <Ionicons name="bar-chart-outline" size={56} color={theme.textTertiary} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 16 }}>
            Nenhum relatório ainda
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            O relatório é gerado automaticamente às segundas-feiras.{"\n"}
            Podes também gerar manualmente com os dados da semana passada.
          </Text>
          <TouchableOpacity
            onPress={generateReport}
            style={{
              marginTop: 24, backgroundColor: theme.accent, borderRadius: 12,
              paddingVertical: 14, paddingHorizontal: 28,
              flexDirection: "row", alignItems: "center", gap: 8,
            }}
          >
            <Ionicons name="sparkles-outline" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Gerar Relatório</Text>
          </TouchableOpacity>
        </View>
      )}

      {relatorio && !generating && (
        <View style={{ paddingHorizontal: 20 }}>
          {/* Secções */}
          {sections.map((s, i) => (
            <View
              key={i}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: s.color,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name={s.icon} size={18} color={s.color} />
                <Text style={{ fontWeight: "700", color: theme.text, marginLeft: 8, fontSize: 14 }}>{s.label}</Text>
              </View>
              <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{s.value}</Text>
            </View>
          ))}

          {/* Melhorias */}
          <View style={{
            backgroundColor: theme.backgroundSecondary, borderRadius: 14, padding: 16, marginTop: 4,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
              <Text style={{ fontWeight: "700", color: theme.text, marginLeft: 8, fontSize: 14 }}>
                Sugestões para esta semana
              </Text>
            </View>
            {relatorio.melhorias.map((m, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: "#f59e0b22",
                  justifyContent: "center", alignItems: "center",
                  marginRight: 10, marginTop: 1,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#f59e0b" }}>{i + 1}</Text>
                </View>
                <Text style={{ color: theme.textSecondary, flex: 1, lineHeight: 22, fontSize: 14 }}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Nota IA */}
          <View style={{
            marginTop: 20, padding: 12, borderRadius: 10,
            backgroundColor: theme.backgroundTertiary,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}>
            <Ionicons name="sparkles-outline" size={14} color={theme.textTertiary} />
            <Text style={{ color: theme.textTertiary, fontSize: 11, flex: 1 }}>
              Relatório gerado por IA com base nos teus treinos da semana passada. Atualiza às segundas-feiras.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
