import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCommunities } from "../../../contexts/CommunitiesContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../styles/theme";

export default function CommunityDetail() {
  const theme = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const {
    communities,
    userCommunities,
    messages,
    loadCommunityMessages,
    sendMessage,
    leaveCommunity,
    getCommunityMembers,
  } = useCommunities();

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const communityId = Number(id);
  const community = communities.find((c) => c.id === communityId) ||
    userCommunities.find((c) => c.id === communityId);
  const communityMessages = messages[communityId] || [];
  const isJoined = userCommunities.some((c) => c.id === communityId);

  useEffect(() => {
    if (communityId) {
      loadInitialData();
    }
  }, [communityId]);

  async function loadInitialData() {
    try {
      setLoading(true);
      await Promise.all([
        loadCommunityMessages(communityId),
        getCommunityMembers(communityId).then(setMembers),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(communityId, messageText);
      setMessageText("");
      // Scroll para o final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      alert("Erro ao enviar mensagem");
    }
  };

  const handleLeave = async () => {
    Alert.alert(
      "Sair da comunidade",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", onPress: () => {}, style: "cancel" },
        {
          text: "Sair",
          onPress: async () => {
            try {
              await leaveCommunity(communityId);
              router.back();
            } catch (error) {
              alert("Erro ao sair da comunidade");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (!community) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.textTertiary} />
        <Text style={{ color: theme.text, marginTop: 12 }}>Comunidade não encontrada</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 56,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>
              {community.nome}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              👥 {members.length} membros
            </Text>
          </View>
          {isJoined && (
            <TouchableOpacity onPress={handleLeave}>
              <Ionicons name="exit-outline" size={24} color={theme.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView ref={scrollViewRef} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12 }}>
        {communityMessages.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.textTertiary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>
              Nenhuma mensagem ainda
            </Text>
          </View>
        ) : (
          communityMessages.map((msg, index) => {
            const isOwn = msg.user_id === user?.id;

            return (
              <View
                key={msg.id || index}
                style={{
                  marginBottom: 12,
                  alignItems: isOwn ? "flex-end" : "flex-start",
                }}
              >
                <View
                  style={{
                    backgroundColor: isOwn ? theme.accent : theme.backgroundSecondary,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    maxWidth: "80%",
                    borderWidth: 1,
                    borderColor: isOwn ? theme.accent : theme.border,
                  }}
                >
                  {!isOwn && (
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>
                      {msg.user_nome}
                    </Text>
                  )}
                  <Text
                    style={{
                      color: isOwn ? "white" : theme.text,
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {msg.mensagem}
                  </Text>
                  <Text
                    style={{
                      color: isOwn ? "rgba(255,255,255,0.7)" : theme.textTertiary,
                      fontSize: 11,
                    }}
                  >
                    {new Date(msg.criada_em).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      {isJoined ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <TextInput
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={theme.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            style={{
              flex: 1,
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={{
              backgroundColor: theme.accent,
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.backgroundSecondary,
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>
            Você precisa entrar na comunidade para enviar mensagens
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
