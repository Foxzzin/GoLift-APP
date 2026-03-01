import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercicio {
  nome: string;
  series: number;
  repeticoes: string;
  observacao?: string;
}

interface DiaPlano {
  dia: string;
  foco: string;
  exercicios: Exercicio[];
}

interface PlanoIA {
  descricao: string;
  split: DiaPlano[];
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_OPTIONS = [3, 4, 5, 6];

const FOCO_COLORS: Record<string, string> = {
  peito: "#f87171",
  costas: "#60a5fa",
  ombros: "#fb923c",
  braços: "#a78bfa",
  pernas: "#4ade80",
  glúteos: "#f472b6",
  core: "#facc15",
  cardio: "#34d399",
  default: "#687C88",
};

function getFocoColor(foco: string): string {
  const lower = foco.toLowerCase();
  for (const key of Object.keys(FOCO_COLORS)) {
    if (lower.includes(key)) return FOCO_COLORS[key];
  }
  return FOCO_COLORS.default;
}

function formatMes(mesStr: string) {
  if (!mesStr) return "";
  const [ano, m] = mesStr.split("-");
  const data = new Date(Number(ano), Number(m) - 1, 1);
  return data.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

function formatSemana(dataStr: string) {
  if (!dataStr) return "";
  const inicio = new Date(dataStr);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${inicio.toLocaleDateString("pt-PT", opts)} – ${fim.toLocaleDateString("pt-PT", opts)}`;
}

// ─── Tab: Plano Mensal ───────────────────────────────────────────────────────

function PlanTab() {
  const { user } = useAuth();
  const theme = useTheme();
  const isAdmin = user?.tipo === 1;

  const [plano, setPlano] = useState<PlanoIA | null>(null);
  const [mes, setMes] = useState<string>("");
  const [criadoEm, setCriadoEm] = useState<string | null>(null);
  const [podeGerar, setPodeGerar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [semPlano, setSemPlano] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState(4);
  const [importedDays, setImportedDays] = useState<Set<number>>(new Set());
  const [importingDay, setImportingDay] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) loadPlan();
  }, [user]);

  async function loadPlan() {
    setLoading(true);
    try {
      const data = await planoApi.getPlan(user!.id);
      if (data.plano) {
        setPlano(data.plano);
        setMes(data.mes || "");
        setCriadoEm(data.criado_em || null);
        setPodeGerar(isAdmin ? true : false);
      } else {
        setPodeGerar(data.pode_gerar || isAdmin);
        setMes(data.mes || "");
      }
    } catch (err: any) {
      if (err?.status === 403) setSemPlano(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    Alert.alert(
      "Gerar Plano Mensal",
      `Gerar um plano de treino para ${diasSelecionados} dias por semana?\n\nNota: Só podes gerar um plano por mês.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Gerar", onPress: generatePlan },
      ]
    );
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const data = await planoApi.generatePlan(user!.id, diasSelecionados);
      if (data.plano) {
        setPlano(data.plano as PlanoIA);
        setMes(data.mes || "");
        setPodeGerar(false);
      }
    } catch (err: any) {
      Alert.alert(
        err?.message?.includes("Limite") ? "IA Indisponível" : "Erro",
        err?.message || "Não foi possível gerar o plano. Tenta mais tarde."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleImportDay(dia: DiaPlano, idx: number) {
    if (importedDays.has(idx) || importingDay !== null) return;
    setImportingDay(idx);
    try {
      await planoApi.importPlanDay(user!.id, dia.dia, dia.foco, dia.exercicios);
      setImportedDays((prev) => new Set([...prev, idx]));
      Alert.alert("Treino adicionado!", `"${dia.dia}" foi adicionado aos teus treinos.`);
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível importar o treino.");
    } finally {
      setImportingDay(null);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (semPlano) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 36 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 24,
          backgroundColor: "#8B5CF622",
          justifyContent: "center", alignItems: "center",
          marginBottom: 20,
        }}>
          <Ionicons name="sparkles" size={32} color="#8B5CF6" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, textAlign: "center", letterSpacing: -0.5, marginBottom: 10 }}>
          Funcionalidade Pro
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, fontSize: 15, marginBottom: 28 }}>
          Subscreve o GoLift Pro para gerares planos de treino mensais personalizados com IA.
        </Text>
        <Pressable
          onPress={() => router.push("/upgrade")}
          accessibilityRole="button"
          accessibilityLabel="Ver planos Pro"
          style={({ pressed }) => ({
            backgroundColor: "#8B5CF6", borderRadius: 14,
            paddingVertical: 14, paddingHorizontal: 32,
            flexDirection: "row", alignItems: "center", gap: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ver Planos Pro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}>
      {/* Gerar plano — estado disponível */}
      {podeGerar && !generating && (
        <View>
          {/* Hero IA card */}
          <View style={{
            backgroundColor: "#8B5CF6",
            borderRadius: 24, padding: 24, marginBottom: 16,
          }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
              PLANO PERSONALIZADO
            </Text>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5, lineHeight: 28, marginBottom: 8 }}>
              A IA cria o teu plano{"\n"}mensal de treino
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 }}>
              Baseado no teu objetivo, nível e frequência semanal que escolheres.
            </Text>
          </View>

          {/* Seletor de dias */}
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              Dias de treino por semana
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {DIAS_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDiasSelecionados(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d} dias por semana`}
                  style={({ pressed }) => ({
                    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center",
                    backgroundColor: diasSelecionados === d ? "#8B5CF6" : theme.backgroundTertiary,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontWeight: "800", fontSize: 18, color: diasSelecionados === d ? "#fff" : theme.text, letterSpacing: -0.5 }}>
                    {d}
                  </Text>
                  <Text style={{ fontSize: 11, marginTop: 2, color: diasSelecionados === d ? "rgba(255,255,255,0.7)" : theme.textSecondary }}>
                    dias
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Botão gerar */}
          <Pressable
            onPress={handleGenerate}
            accessibilityRole="button"
            accessibilityLabel="Gerar plano com IA"
            style={({ pressed }) => ({
              backgroundColor: isAdmin ? "#30D158" : "#8B5CF6",
              borderRadius: 16, paddingVertical: 16,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 10,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              {isAdmin ? "Gerar novo plano (Admin)" : "Gerar Plano com IA"}
            </Text>
          </Pressable>
          <Text style={{ color: theme.textTertiary, fontSize: 11, textAlign: "center", marginTop: 10 }}>
            {isAdmin ? "Como admin, podes gerar quantos planos quiseres." : "Podes gerar um plano por mês."}
          </Text>
        </View>
      )}

      {/* Gerando */}
      {generating && (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: "#8B5CF622",
            justifyContent: "center", alignItems: "center",
            marginBottom: 20,
          }}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 17, marginBottom: 6 }}>
            A criar o teu plano...
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            Pode demorar alguns segundos
          </Text>
        </View>
      )}

      {/* Plano gerado */}
      {plano && !generating && (
        <View>
          {/* Mês do plano */}
          {mes && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600" }}>
                {formatMes(mes)}
              </Text>
              {podeGerar && (
                <Pressable
                  onPress={handleGenerate}
                  accessibilityRole="button"
                  accessibilityLabel="Gerar novo plano"
                  style={({ pressed }) => ({
                    backgroundColor: theme.backgroundSecondary, borderRadius: 10,
                    paddingHorizontal: 12, paddingVertical: 6,
                    flexDirection: "row", alignItems: "center", gap: 5,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="refresh-outline" size={14} color="#8B5CF6" />
                  <Text style={{ color: "#8B5CF6", fontSize: 12, fontWeight: "700" }}>Regenerar</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Método */}
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20, padding: 18, marginBottom: 16,
            borderLeftWidth: 3, borderLeftColor: "#8B5CF6",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
              <Ionicons name="information-circle" size={16} color="#8B5CF6" />
              <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>Método</Text>
            </View>
            <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{plano.descricao}</Text>
          </View>

          {/* Dias de treino — sempre abertos (sem accordion) */}
          {plano.split?.map((dia, idx) => {
            const cor = getFocoColor(dia.foco);
            return (
              <View key={idx} style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20, marginBottom: 10, overflow: "hidden",
                borderWidth: 1, borderColor: cor + "40",
              }}>
                {/* Header do dia */}
                <View style={{
                  flexDirection: "row", alignItems: "center",
                  justifyContent: "space-between", padding: 16,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 12,
                      backgroundColor: cor + "22",
                      justifyContent: "center", alignItems: "center",
                    }}>
                      <Ionicons name="barbell-outline" size={18} color={cor} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15 }}>{dia.dia}</Text>
                      <Text style={{ color: cor, fontSize: 12, marginTop: 1, fontWeight: "600" }}>{dia.foco}</Text>
                    </View>
                  </View>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {dia.exercicios?.length || 0} exercícios
                  </Text>
                </View>

                {/* Exercícios — sempre visíveis */}
                <View style={{ borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
                  {dia.exercicios?.map((ex, ei) => (
                    <View key={ei} style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: ei < dia.exercicios.length - 1 ? 1 : 0,
                      borderBottomColor: theme.backgroundTertiary,
                    }}>
                      <Text style={{ fontWeight: "500", color: theme.text, fontSize: 14, flex: 1, marginRight: 12 }}>
                        {ex.nome}
                      </Text>
                      <View>
                        <View style={{
                          backgroundColor: cor + "22", borderRadius: 8,
                          paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                          <Text style={{ color: cor, fontWeight: "700", fontSize: 12 }}>
                            {ex.series}×{ex.repeticoes}
                          </Text>
                        </View>
                        {ex.observacao ? (
                          <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 4, textAlign: "right" }}>
                            {ex.observacao}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}

                  {/* Botão importar */}
                  <View style={{ padding: 16, paddingTop: 12 }}>
                    <Pressable
                      onPress={() => handleImportDay(dia, idx)}
                      disabled={importedDays.has(idx) || importingDay !== null}
                      accessibilityRole="button"
                      accessibilityLabel={importedDays.has(idx) ? "Treino já adicionado" : "Adicionar aos meus treinos"}
                      style={({ pressed }) => ({
                        backgroundColor: importedDays.has(idx) ? "#22c55e15" : cor + "15",
                        borderColor: importedDays.has(idx) ? "#22c55e" : cor,
                        borderWidth: 1,
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      {importingDay === idx ? (
                        <ActivityIndicator size="small" color={cor} />
                      ) : importedDays.has(idx) ? (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                          <Text style={{ color: "#22c55e", fontWeight: "600", fontSize: 14 }}>Adicionado aos treinos</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="add-circle-outline" size={16} color={cor} />
                          <Text style={{ color: cor, fontWeight: "600", fontSize: 14 }}>Adicionar aos meus treinos</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Footer info */}
          {criadoEm && (
            <View style={{
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 8,
              marginTop: 8,
            }}>
              <Ionicons name="sparkles-outline" size={14} color={theme.textTertiary} />
              <Text style={{ color: theme.textTertiary, fontSize: 11, flex: 1, lineHeight: 16 }}>
                Gerado em {new Date(criadoEm).toLocaleDateString("pt-PT")} com IA.
                {" "}Próximo plano disponível em{" "}
                {new Date(new Date(criadoEm).getFullYear(), new Date(criadoEm).getMonth() + 1, 1).toLocaleDateString("pt-PT")}.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Tab: Relatório Semanal ──────────────────────────────────────────────────

function ReportTab() {
  const { user } = useAuth();
  const theme = useTheme();

  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [semanaInicio, setSemanaInicio] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
      if (!data.relatorio && !data.cached) {
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

  const sections: ReportSection[] = relatorio ? [
    { icon: "trophy-outline", label: "Avaliação Geral", value: relatorio.avaliacao, color: "#30D158" },
    { icon: "body-outline", label: "Equilíbrio Muscular", value: relatorio.equilibrio, color: "#0A84FF" },
    { icon: "trending-up-outline", label: "Progressão", value: relatorio.progressao, color: "#FF9500" },
    { icon: "moon-outline", label: "Descanso & Recuperação", value: relatorio.descanso, color: "#a78bfa" },
  ] : [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 }}>
        <ActivityIndicator size="large" color="#30D158" />
      </View>
    );
  }

  if (semPlano) {
    return (
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
            backgroundColor: "#30D158", borderRadius: 14,
            paddingVertical: 14, paddingHorizontal: 32,
            flexDirection: "row", alignItems: "center", gap: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ver Planos Pro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}>
      {/* Semana + botão refresh */}
      {semanaInicio && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: "600" }}>
            {formatSemana(semanaInicio)}
          </Text>
          <Pressable
            onPress={handleManualGenerate}
            disabled={generating}
            accessibilityRole="button"
            accessibilityLabel="Gerar novo relatório"
            style={({ pressed }) => ({
              backgroundColor: theme.backgroundSecondary, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
              flexDirection: "row", alignItems: "center", gap: 5,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {generating
              ? <ActivityIndicator size="small" color="#30D158" />
              : <Ionicons name="refresh-outline" size={14} color="#30D158" />
            }
            {!generating && <Text style={{ color: "#30D158", fontSize: 12, fontWeight: "700" }}>Atualizar</Text>}
          </Pressable>
        </View>
      )}

      {/* Estado: a gerar */}
      {generating && !relatorio && (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
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

      {/* Estado: sem relatório */}
      {!relatorio && !generating && (
        <View>
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

      {/* Relatório gerado */}
      {relatorio && !generating && (
        <View>
          {sections.map((s, i) => (
            <View
              key={i}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20, padding: 18, marginBottom: 12,
                borderLeftWidth: 3, borderLeftColor: s.color,
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
            marginTop: 16, padding: 14, borderRadius: 14,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIHub() {
  const theme = useTheme();
  const { paddingTop: safeTop } = useAndroidInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: safeTop + 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.6 }}>
              Assistente IA
            </Text>
          </View>
          <View style={{ backgroundColor: "#8B5CF622", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="sparkles" size={12} color="#8B5CF6" />
            <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700" }}>IA</Text>
          </View>
        </View>
      </View>

      {/* Entry Cards */}
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Card — Plano Mensal */}
        <Pressable
          onPress={() => router.push("/ai-plan")}
          accessibilityRole="button"
          accessibilityLabel="Gerar Plano Mensal com IA"
          style={({ pressed }) => ({
            backgroundColor: "#8B5CF6",
            borderRadius: 24,
            padding: 24,
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          })}
        >
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="calendar" size={28} color="#fff" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 8 }}>
            Plano Mensal
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 16 }}>
            Gera um plano de treino personalizado para o mês com base nos teus objetivos e disponibilidade.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700" }}>Criar plano</Text>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
          </View>
        </Pressable>

        {/* Card — Relatório Semanal */}
        <Pressable
          onPress={() => router.push("/ai-report")}
          accessibilityRole="button"
          accessibilityLabel="Ver Relatório Semanal com IA"
          style={({ pressed }) => ({
            backgroundColor: "#30D158",
            borderRadius: 24,
            padding: 24,
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#30D158",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          })}
        >
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="bar-chart" size={28} color="#fff" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 8 }}>
            Relatório Semanal
          </Text>
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 16 }}>
            Analisa o teu treino semanal e recebe feedback personalizado sobre progresso e equilíbrio muscular.
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700" }}>Ver relatório</Text>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
