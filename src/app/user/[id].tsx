import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userApi, metricsApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { getIMCCategory } from "../../utils/imc";

export default function UserProfile() {
  const theme = useTheme();
  const { id, nome: nomeParam } = useLocalSearchParams<{ id: string; nome?: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");

  useEffect(() => {
    if (id) loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const [profileData, recordsData] = await Promise.all([
        userApi.getProfile(Number(id)).catch(() => null),
        metricsApi.getRecords(Number(id)).catch(() => []),
      ]);
      planoApi.getUserPlan(Number(id)).then(d => setPlanoTipo(d.plano)).catch(() => {});
      const u = profileData?.user || profileData;
      setProfile({
        id: Number(id),
        nome: u?.name || u?.nome || nomeParam || "Utilizador",
        email: u?.email,
        idade: u?.age ?? u?.idade,
        peso: u?.weight ?? u?.peso,
        altura: u?.height ?? u?.altura,
        objetivo: u?.objetivo,
      });
      setRecords(recordsData || []);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfile({ id: Number(id), nome: nomeParam || "Utilizador" });
    } finally {
      setLoading(false);
    }
  }

  function calculateIMC(peso: number, altura: number) {
    if (!peso || !altura) return null;
    return (peso / Math.pow(altura / 100, 2)).toFixed(1);
  }

  const imc = calculateIMC(profile?.peso, profile?.altura);
  const imcCategory = imc ? getIMCCategory(parseFloat(imc)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 56,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>
          {loading ? "Perfil" : profile?.nome || "Perfil"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar + nome */}
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: theme.backgroundTertiary,
                borderColor: theme.border,
                borderWidth: 2,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: planoTipo === "pago" ? "#f59e0b" : theme.accent, fontSize: 40, fontWeight: "bold" }}>
                {(profile?.nome || "?")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "bold" }}>
              {profile?.nome}
            </Text>
            {planoTipo === "pago" ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: "#f59e0b22", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderColor: "#f59e0b", borderWidth: 1 }}>
                <Ionicons name="star" size={13} color="#f59e0b" style={{ marginRight: 5 }} />
                <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13 }}>GoLift Pro</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderColor: theme.border, borderWidth: 1 }}>
                <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Free</Text>
              </View>
            )}
          </View>

          {/* Dados físicos */}
          {(profile?.idade || profile?.peso || profile?.altura) && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: theme.text, marginBottom: 12 }}
              >
                Dados Físicos
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  overflow: "hidden",
                }}
              >
                {!!profile?.idade && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar" size={20} color={theme.text} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Idade</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.idade} anos
                    </Text>
                  </View>
                )}
                {!!profile?.peso && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: profile?.altura ? 1 : 0,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="scale" size={20} color={theme.text} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Peso</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.peso} kg
                    </Text>
                  </View>
                )}
                {!!profile?.altura && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="resize" size={20} color={theme.text} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Altura</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.altura} cm
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* IMC */}
          {imc && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="heart" size={20} color={theme.text} />
                </View>
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>IMC</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{imc}</Text>
                  {imcCategory && (
                    <Text style={{ color: imcCategory.color, fontSize: 11, marginTop: 2 }}>
                      {imcCategory.label}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Objetivo */}
          {!!profile?.objetivo && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: theme.text, marginBottom: 12 }}
              >
                Objetivo
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 16,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
                  {profile.objetivo}
                </Text>
              </View>
            </View>
          )}

          {/* Recordes */}
          {records.length > 0 && (
            <View style={{ paddingHorizontal: 24 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: theme.text, marginBottom: 12 }}
              >
                🏆 Melhores Recordes
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.accent,
                  overflow: "hidden",
                }}
              >
                {records.slice(0, 3).map((record, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: index < Math.min(records.length, 3) - 1 ? 1 : 0,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>
                      {["🥇","🥈","🥉"][index]}
                    </Text>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>
                      {record.nome_exercicio || record.exercicio || record.exercise}
                    </Text>
                    <Text style={{ color: theme.accent, fontWeight: "bold", fontSize: 14 }}>
                      {record.peso || record.weight} kg
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
