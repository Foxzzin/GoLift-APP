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

export default function AIPlan() {
  const { user } = useAuth();
  const theme = useTheme();
  const [plano, setPlano] = useState<PlanoIA | null>(null);
  const [mes, setMes] = useState<string>("");
  const [criadoEm, setCriadoEm] = useState<string | null>(null);
  const [podeGerar, setPodeGerar] = useState(false);
  const isAdmin = user?.tipo === 1;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [semPlano, setSemPlano] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState(4);
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null);
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
        setDiaExpandido(0);
      } else {
        setPodeGerar(data.pode_gerar || isAdmin);
        setMes(data.mes || "");
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setSemPlano(true);
      }
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

  async function handleImportDay(dia: DiaPlano, idx: number) {
    if (importedDays.has(idx) || importingDay !== null) return;
    setImportingDay(idx);
    try {
      await planoApi.importPlanDay(user!.id, dia.dia, dia.foco, dia.exercicios);
      setImportedDays(prev => new Set([...prev, idx]));
      Alert.alert("Treino adicionado!", `"${dia.dia}" foi adicionado aos teus treinos.`);
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível importar o treino.");
    } finally {
      setImportingDay(null);
    }
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const data = await planoApi.generatePlan(user!.id, diasSelecionados);
      if (data.plano) {
        setPlano(data.plano as PlanoIA);
        setMes(data.mes || "");
        setPodeGerar(false);
        setDiaExpandido(0);
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

  function formatMes(mesStr: string) {
    if (!mesStr) return "";
    const [ano, m] = mesStr.split("-");
    const data = new Date(Number(ano), Number(m) - 1, 1);
    return data.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
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
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
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
            Plano Mensal IA
          </Text>
        </View>
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
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
            Plano Mensal IA
          </Text>
          {mes && (
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 1 }}>
              {formatMes(mes)}
            </Text>
          )}
        </View>
        <View style={{ backgroundColor: "#8B5CF622", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="sparkles" size={12} color="#8B5CF6" />
          <Text style={{ color: "#8B5CF6", fontSize: 11, fontWeight: "700" }}>IA</Text>
        </View>
      </View>

      {/* Gerar plano — estado disponível */}
      {podeGerar && !generating && (
        <View style={{ padding: 20 }}>
          {/* Hero IA card */}
          <View style={{
            backgroundColor: "#8B5CF6",
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
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
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: diasSelecionados === d ? theme.accent : theme.backgroundTertiary,
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
              backgroundColor: isAdmin ? theme.accentGreen : "#8B5CF6",
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
        <View style={{ alignItems: "center", paddingVertical: 80 }}>
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
        <View style={{ paddingHorizontal: 20 }}>
          {/* Método */}
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
            borderLeftWidth: 3,
            borderLeftColor: "#8B5CF6",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
              <Ionicons name="information-circle" size={16} color="#8B5CF6" />
              <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>Método</Text>
            </View>
            <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{plano.descricao}</Text>
          </View>

          {/* Dias de treino */}
          {plano.split?.map((dia, idx) => {
            const cor = getFocoColor(dia.foco);
            const aberto = diaExpandido === idx;
            return (
              <View key={idx} style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20,
                marginBottom: 10,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: aberto ? cor + "55" : "transparent",
              }}>
                <Pressable
                  onPress={() => setDiaExpandido(aberto ? null : idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dia.dia} — ${dia.foco}`}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      {dia.exercicios?.length || 0} exercícios
                    </Text>
                    <Ionicons name={aberto ? "chevron-up" : "chevron-down"} size={16} color={theme.textTertiary} />
                  </View>
                </Pressable>

                {/* Exercícios */}
                {aberto && (
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
                )}
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
