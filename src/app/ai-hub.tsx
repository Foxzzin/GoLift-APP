import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIHub() {
  const theme = useTheme();
  const { user } = useAuth();
  const { paddingTop: safeTop } = useAndroidInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isAdmin = user?.tipo === 1;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 34, fontWeight: "800", color: theme.text, letterSpacing: -1.2 }}>
          Assistente IA
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 22 }}>
          Planos e análises personalizadas com inteligência artificial.
        </Text>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Label */}
        <Text style={{
          fontSize: 11, fontWeight: "700", letterSpacing: 1,
          textTransform: "uppercase", color: theme.textSecondary, marginBottom: 12,
        }}>
          FUNCIONALIDADES
        </Text>

        {/* Card — Plano Mensal */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/ai-plan");
          }}
          accessibilityRole="button"
          accessibilityLabel="Gerar Plano Mensal com IA"
          style={({ pressed }) => ({
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: "#8B5CF618",
              justifyContent: "center", alignItems: "center",
              marginRight: 14,
            }}>
              <Ionicons name="calendar" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, letterSpacing: -0.3 }}>
                Plano Mensal
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Treino completo criado à medida dos teus objetivos e disponibilidade.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ marginLeft: 8 }} />
          </View>
        </Pressable>

        {/* Card — Relatório Semanal */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/ai-report");
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver Relatório Semanal com IA"
          style={({ pressed }) => ({
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 28,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: theme.accentGreen + "18",
              justifyContent: "center", alignItems: "center",
              marginRight: 14,
            }}>
              <Ionicons name="bar-chart" size={22} color={theme.accentGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, letterSpacing: -0.3 }}>
                Relatório Semanal
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Análise de progresso, equilíbrio muscular e sugestões de melhoria.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ marginLeft: 8 }} />
          </View>
        </Pressable>

        {/* Info Banner */}
        <View style={{
          backgroundColor: theme.accent + "0A",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 20,
        }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: theme.accent + "18",
            justifyContent: "center", alignItems: "center",
            marginTop: 1,
          }}>
            <Ionicons name="sparkles" size={16} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.text, letterSpacing: -0.1, marginBottom: 4 }}>
              Potenciado por IA
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
              Os planos e relatórios são gerados com inteligência artificial, adaptados ao teu nível e objetivos.
            </Text>
          </View>
        </View>

        {/* Upgrade banner */}
        {!isAdmin && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/upgrade");
            }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade para Pro"
            style={({ pressed }) => ({
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 20,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.accent + "18",
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name="star" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15, letterSpacing: -0.3 }}>
                GoLift Pro
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
                Desbloqueia todas as funcionalidades IA
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </Pressable>
        )}
      </Animated.ScrollView>
    </View>
  );
}
