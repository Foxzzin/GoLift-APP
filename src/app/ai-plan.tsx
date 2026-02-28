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
        <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>Plano Mensal IA</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.textTertiary} />
          <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, marginTop: 16, textAlign: "center" }}>
            Plano Pro necessário
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
            Subscreve o GoLift Pro para gerares planos de treino mensais com IA.
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>Plano Mensal IA</Text>
          {mes && (
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
              {formatMes(mes)}
            </Text>
          )}
        </View>
      </View>

      {/* Estado: pode gerar */}
      {podeGerar && !generating && (
        <View style={{ padding: 24 }}>
          <View style={{
            backgroundColor: theme.backgroundSecondary, borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: theme.border,
          }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Ionicons name="calendar-outline" size={48} color={theme.accent} />
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 12 }}>
                Gerar Plano para {formatMes(mes)}
              </Text>
              <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
                A IA vai criar um plano personalizado com base no teu objetivo e nível de experiência.
              </Text>
            </View>

            {/* Dias por semana */}
            <Text style={{ fontWeight: "600", color: theme.text, marginBottom: 10 }}>
              Dias de treino por semana
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              {DIAS_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDiasSelecionados(d)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: diasSelecionados === d ? theme.accent : theme.backgroundTertiary,
                    borderWidth: 1,
                    borderColor: diasSelecionados === d ? theme.accent : theme.border,
                  }}
                >
                  <Text style={{
                    fontWeight: "700", fontSize: 16,
                    color: diasSelecionados === d ? "#fff" : theme.text,
                  }}>{d}</Text>
                  <Text style={{
                    fontSize: 10, marginTop: 2,
                    color: diasSelecionados === d ? "#fff" : theme.textSecondary,
                  }}>dias</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleGenerate}
              style={{
                backgroundColor: isAdmin ? theme.accentGreen : theme.accent,
                borderRadius: 12, paddingVertical: 14,
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
              }}
            >
              <Ionicons name="sparkles-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {isAdmin ? "Gerar novo plano mensal (Admin)" : "Gerar Plano com IA"}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: theme.textTertiary, fontSize: 11, textAlign: "center", marginTop: 10 }}>
              {isAdmin ? "Como admin, podes gerar quantos planos quiseres." : "Podes gerar um plano por mês."}
            </Text>
          </View>
        </View>
      )}

      {/* Loading de geração */}
      {generating && (
        <View style={{ alignItems: "center", padding: 60 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 14 }}>
            A gerar o teu plano personalizado...
          </Text>
          <Text style={{ color: theme.textTertiary, marginTop: 6, fontSize: 12 }}>
            Pode demorar alguns segundos
          </Text>
        </View>
      )}

      {/* Plano gerado */}
      {plano && !generating && (
        <View style={{ paddingHorizontal: 20 }}>
          {/* Descrição */}
          <View style={{
            backgroundColor: theme.backgroundSecondary, borderRadius: 14, padding: 16, marginBottom: 16,
            borderLeftWidth: 3, borderLeftColor: theme.accent,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={16} color={theme.accent} />
              <Text style={{ fontWeight: "700", color: theme.text, marginLeft: 6, fontSize: 14 }}>Método</Text>
            </View>
            <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{plano.descricao}</Text>
          </View>

          {/* Dias de treino */}
          {plano.split?.map((dia, idx) => {
            const cor = getFocoColor(dia.foco);
            const aberto = diaExpandido === idx;
            return (
              <View key={idx} style={{
                backgroundColor: theme.backgroundSecondary, borderRadius: 14,
                marginBottom: 10, overflow: "hidden",
                borderWidth: 1, borderColor: aberto ? cor + "66" : theme.border,
              }}>
                {/* Header do dia */}
                <TouchableOpacity
                  onPress={() => setDiaExpandido(aberto ? null : idx)}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    padding: 14,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: cor + "22", justifyContent: "center", alignItems: "center",
                    }}>
                      <Ionicons name="fitness-outline" size={18} color={cor} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: "700", color: theme.text, fontSize: 14 }}>{dia.dia}</Text>
                      <Text style={{ color: cor, fontSize: 12, marginTop: 1 }}>{dia.foco}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      {dia.exercicios?.length || 0} exercícios
                    </Text>
                    <Ionicons
                      name={aberto ? "chevron-up" : "chevron-down"}
                      size={16} color={theme.textTertiary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Exercícios */}
                {aberto && dia.exercicios?.map((ex, ei) => (
                  <View key={ei} style={{
                    marginHorizontal: 14, marginBottom: 10,
                    paddingTop: ei === 0 ? 0 : 10,
                    borderTopWidth: ei === 0 ? 1 : 0,
                    borderTopColor: theme.backgroundTertiary,
                  }}>
                    {ei === 0 && <View style={{ height: 1, backgroundColor: theme.backgroundTertiary, marginBottom: 10 }} />}
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <Text style={{ fontWeight: "600", color: theme.text, fontSize: 14, flex: 1, marginRight: 8 }}>
                        {ex.nome}
                      </Text>
                      <View style={{
                        backgroundColor: cor + "22", borderRadius: 6,
                        paddingHorizontal: 8, paddingVertical: 3,
                        flexDirection: "row", alignItems: "center", gap: 4,
                      }}>
                        <Text style={{ color: cor, fontWeight: "700", fontSize: 12 }}>
                          {ex.series}×{ex.repeticoes}
                        </Text>
                      </View>
                    </View>
                    {ex.observacao ? (
                      <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 3 }}>
                        {ex.observacao}
                      </Text>
                    ) : null}
                  </View>
                ))}
                {aberto && (
                  <View style={{ marginHorizontal: 14, marginBottom: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleImportDay(dia, idx)}
                      disabled={importedDays.has(idx) || importingDay !== null}
                      style={{
                        backgroundColor: importedDays.has(idx) ? "#22c55e22" : cor + "22",
                        borderColor: importedDays.has(idx) ? "#22c55e" : cor,
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {importingDay === idx ? (
                        <ActivityIndicator size="small" color={cor} />
                      ) : importedDays.has(idx) ? (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                          <Text style={{ color: "#22c55e", fontWeight: "600", fontSize: 13 }}>Adicionado aos treinos</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="add-circle-outline" size={16} color={cor} />
                          <Text style={{ color: cor, fontWeight: "600", fontSize: 13 }}>Adicionar aos meus treinos</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                {aberto && <View style={{ height: 4 }} />}
              </View>
            );
          })}

          {/* Info */}
          {criadoEm && (
            <Text style={{ color: theme.textTertiary, fontSize: 11, textAlign: "center", marginTop: 12 }}>
              Gerado em {new Date(criadoEm).toLocaleDateString("pt-PT")} com IA.
              O próximo plano pode ser gerado em {new Date(new Date(criadoEm).getFullYear(), new Date(criadoEm).getMonth() + 1, 1).toLocaleDateString("pt-PT")}.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
