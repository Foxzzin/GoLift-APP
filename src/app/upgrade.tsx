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
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";

const FREE_FEATURES = [
  "Registo de treinos ilimitado",
  "Histórico de métricas",
  "Comunidades públicas",
  "Exercícios da biblioteca",
];

const PRO_FEATURES = [
  "Tudo do plano Free",
  "Relatório semanal com IA",
  "Plano de treino mensal com IA",
  "Análise de progressão avançada",
  "Sugestões personalizadas",
];

export default function Upgrade() {
  const { user } = useAuth();
  const theme = useTheme();
  const [plano, setPlano] = useState<"free" | "pago">("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ativoAte, setAtivoAte] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadPlan();
  }, [user]);

  async function loadPlan() {
    try {
      const data = await planoApi.getUserPlan(user!.id);
      setPlano(data.plano);
      setAtivoAte(data.ativo_ate);
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!user?.id) return;
    setCheckoutLoading(true);
    try {
      const data = await planoApi.createCheckoutSession(user.id);
      if (data.url) {
        const result = await WebBrowser.openBrowserAsync(data.url);
        // Após fechar o browser, recarregar o plano
        loadPlan();
      }
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível iniciar o pagamento. Tenta mais tarde.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const isPro = plano === "pago";

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
        <Text style={{ fontSize: 22, fontWeight: "700", color: theme.text }}>Planos GoLift</Text>
      </View>

      {/* Status atual */}
      {isPro && (
        <View style={{
          marginHorizontal: 20,
          padding: 14,
          borderRadius: 12,
          backgroundColor: theme.accentGreen + "22",
          borderWidth: 1,
          borderColor: theme.accentGreen,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}>
          <Ionicons name="checkmark-circle" size={20} color={theme.accentGreen} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.accentGreen, fontWeight: "700", fontSize: 15 }}>
              Plano GoLift Pro ativo
            </Text>
            {ativoAte && (
              <Text style={{ color: theme.accentGreen, fontSize: 12, marginTop: 2 }}>
                Válido até {new Date(ativoAte).toLocaleDateString("pt-PT")}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Hero */}
      <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: theme.accent + "22",
          justifyContent: "center", alignItems: "center", marginBottom: 16,
        }}>
          <Ionicons name="star" size={36} color={theme.accent} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, textAlign: "center" }}>
          GoLift Pro
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
          Desbloqueia relatórios e planos gerados por IA{"\n"}personalizados para os teus objetivos.
        </Text>
      </View>

      {/* Cartões de planos */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 28 }}>
        {/* Free */}
        <View style={{
          flex: 1, borderRadius: 16, padding: 18,
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 1, borderColor: theme.border,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary, marginBottom: 4 }}>FREE</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, marginBottom: 14 }}>0€</Text>
          {FREE_FEATURES.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="checkmark" size={14} color={theme.textSecondary} />
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 6, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pro */}
        <View style={{
          flex: 1, borderRadius: 16, padding: 18,
          backgroundColor: theme.accent + "15",
          borderWidth: 2, borderColor: theme.accent,
        }}>
          <View style={{
            backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
            alignSelf: "flex-start", marginBottom: 4,
          }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>RECOMENDADO</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.accent, marginBottom: 4 }}>PRO</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>4,99€</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 2, marginBottom: 3 }}>/mês</Text>
          </View>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
              <Text style={{ fontSize: 12, color: theme.text, marginLeft: 6, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botão upgrade */}
      {!isPro && (
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={checkoutLoading}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {checkoutLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                  Subscrever GoLift Pro
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={{ textAlign: "center", fontSize: 11, color: theme.textTertiary, marginTop: 10 }}>
            Pagamento seguro via Stripe. Cancela quando quiseres.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
