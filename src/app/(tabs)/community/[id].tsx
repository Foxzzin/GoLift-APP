import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Keyboard,
  ActivityIndicator,
  Modal,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAndroidInsets } from "../../../hooks/useAndroidInsets";
import { useCommunities } from "../../../contexts/CommunitiesContext";
import { useAuth } from "../../../contexts/AuthContext";
import { workoutApi } from "../../../services/api";
import { useTheme } from "../../../styles/theme";

export default function CommunityDetail() {
  const theme = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { safeTop } = useAndroidInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const show = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardHeight(0)
    );
    return () => { show.remove(); hide.remove(); };
  }, []);
  // Tab bar is hidden on this screen so no extra offset needed
  const keyboardOffset = Platform.OS === "ios" ? 0 : 0;
  const {
    communities,
    userCommunities,
    messages,
    loadCommunityMessages,
    sendMessage,
    leaveCommunity,
    getCommunityMembers,
    updateCommunity,
  } = useCommunities();

  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Modais
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPais, setEditPais] = useState("");
  const [editPrivada, setEditPrivada] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showEditCountryPicker, setShowEditCountryPicker] = useState(false);
  const [editCountrySearch, setEditCountrySearch] = useState("");

  // Copiar treino de template partilhado
  const [copyingWorkout, setCopyingWorkout] = useState<string | null>(null);

  async function handleCopyWorkout(workoutShare: any) {
    const exerciseIds = (workoutShare.exercicios || []).map((ex: any) => ex.id).filter(Boolean);
    if (exerciseIds.length === 0) {
      Alert.alert("Sem exercícios", "Este template não tem exercícios com ID — foi partilhado antes da atualização. Pede ao autor para partilhar de novo.");
      return;
    }
    setCopyingWorkout(workoutShare.nome);
    try {
      await workoutApi.copyWorkout(user!.id, workoutShare.nome, exerciseIds);
      Alert.alert("Treino copiado! 💪", `"${workoutShare.nome}" foi adicionado aos teus treinos com todos os exercícios.`);
    } catch {
      Alert.alert("Erro", "Não foi possível copiar o treino.");
    } finally {
      setCopyingWorkout(null);
    }
  }

  const communityId = Number(id);
  const community = communities.find((c) => c.id === communityId) ||
    userCommunities.find((c) => c.id === communityId);
  const communityMessages = messages[communityId] || [];
  const isJoined = userCommunities.some((c) => c.id === communityId);
  const isOwner = community?.criador_id === user?.id;

  const EDIT_PAISES = [
    { flag: "🌍", name: "Internacional" }, { flag: "🇦🇴", name: "Angola" },
    { flag: "🇦🇷", name: "Argentina" }, { flag: "🇦🇺", name: "Austrália" },
    { flag: "🇦🇹", name: "Áustria" }, { flag: "🇧🇷", name: "Brasil" },
    { flag: "🇨🇦", name: "Canadá" }, { flag: "🇨🇱", name: "Chile" },
    { flag: "🇨🇳", name: "China" }, { flag: "🇨🇴", name: "Colômbia" },
    { flag: "🇩🇰", name: "Dinamarca" }, { flag: "🇪🇬", name: "Egito" },
    { flag: "🇪🇸", name: "Espanha" }, { flag: "🇺🇸", name: "Estados Unidos" },
    { flag: "🇫🇷", name: "França" }, { flag: "🇬🇷", name: "Grécia" },
    { flag: "🇮🇳", name: "India" }, { flag: "🇮🇪", name: "Irlanda" },
    { flag: "🇮🇹", name: "Itália" }, { flag: "🇯🇵", name: "Japão" },
    { flag: "🇲🇽", name: "México" }, { flag: "🇲🇿", name: "Moçambique" },
    { flag: "🇳🇱", name: "Países Baixos" }, { flag: "🇵🇪", name: "Peru" },
    { flag: "🇵🇱", name: "Polônia" }, { flag: "🇵🇹", name: "Portugal" },
    { flag: "🇬🇧", name: "Reino Unido" }, { flag: "🇷🇺", name: "Rússia" },
    { flag: "🇿🇦", name: "Sul-áfrica" }, { flag: "🇨🇭", name: "Suíça" },
    { flag: "🇹🇷", name: "Turquia" }, { flag: "🇺🇦", name: "Ucrânia" },
    { flag: "🇺🇾", name: "Uruguai" }, { flag: "🇻🇪", name: "Venezuela" },
  ].sort((a, b) => a.name.localeCompare(b.name));
  const filteredEditPaises = EDIT_PAISES.filter((p) =>
    p.name.toLowerCase().includes(editCountrySearch.toLowerCase())
  );
  const selectedEditCountry = EDIT_PAISES.find((p) => p.name === editPais);

  useEffect(() => {
    if (communityId) {
      loadInitialData();
    }
  }, [communityId]);

  // Redireciona automaticamente se a comunidade não existir após carregar
  useEffect(() => {
    if (!loading && !community) {
      Alert.alert(
        "Comunidade não encontrada",
        "Esta comunidade já não existe ou foi removida.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  }, [loading, community]);

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

  const handleOpenUserProfile = (userId: number, userName: string) => {
    router.push({ pathname: "/user/[id]", params: { id: userId, nome: userName } });
  };

  const handleOpenEdit = () => {
    if (!community) return;
    setEditName(community.nome);
    setEditDesc(community.descricao || "");
    setEditPais((community.pais as string) || "");
    setEditPrivada(!!community.privada);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Erro", "O nome não pode estar vazio");
      return;
    }
    try {
      setEditSaving(true);
      await updateCommunity(communityId, {
        nome: editName.trim(),
        descricao: editDesc.trim(),
        pais: editPais || undefined,
        privada: editPrivada,
      });
      setShowEditModal(false);
    } catch {
      Alert.alert("Erro", "Não foi possível guardar as alterações");
    } finally {
      setEditSaving(false);
    }
  };

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
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

  function parseWorkoutShare(mensagem: string) {
    const PREFIX = "🏋️__SHARE__";
    if (!mensagem.startsWith(PREFIX)) return null;
    try {
      return JSON.parse(mensagem.slice(PREFIX.length));
    } catch {
      return null;
    }
  }

  function formatDuration(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, paddingBottom: keyboardHeight }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: safeTop + 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 12 }}
            onPress={() => setShowCommunityModal(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>
                {community.nome}
              </Text>
              {!!community.verificada && (
                <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
              )}
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              👥 {members.length} membros · <Text style={{ color: theme.accent, fontSize: 13 }}>ver detalhes</Text>
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {isOwner && (
              <TouchableOpacity onPress={handleOpenEdit}>
                <Ionicons name="create-outline" size={24} color={theme.accent} />
              </TouchableOpacity>
            )}
            {isJoined && (
              <TouchableOpacity onPress={handleLeave}>
                <Ionicons name="exit-outline" size={24} color={theme.accent} />
              </TouchableOpacity>
            )}
          </View>
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
            const workoutShare = parseWorkoutShare(msg.mensagem);

            if (workoutShare) {
              // Render workout share card
              return (
                <View
                  key={msg.id || index}
                  style={{ marginBottom: 12, alignItems: isOwn ? "flex-end" : "flex-start" }}
                >
                  <View
                    style={{
                      backgroundColor: theme.backgroundSecondary,
                      borderRadius: 16,
                      padding: 14,
                      maxWidth: "88%",
                      borderWidth: 1,
                      borderColor: theme.accent,
                    }}
                  >
                    {/* Sender */}
                    {!isOwn && (
                      <TouchableOpacity onPress={() => handleOpenUserProfile(msg.user_id, msg.user_nome)}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 }}>
                          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "600" }}>
                            {msg.user_nome}
                          </Text>
                          {msg.user_id === community.criador_id && (
                            <Ionicons name="shield-checkmark" size={12} color="#f5a623" />
                          )}
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Header colorido com badge + nome + contagem */}
                    <View style={{ backgroundColor: theme.accent, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <View style={{ backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                            {workoutShare.tipo === "resultado" ? "🏅 RESULTADO" : "📋 TEMPLATE"}
                          </Text>
                        </View>
                        {workoutShare.tipo === "resultado" && workoutShare.duracao > 0 && (
                          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>⏱ {formatDuration(workoutShare.duracao)}</Text>
                        )}
                      </View>
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, lineHeight: 20 }}>{workoutShare.nome}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 }}>
                        {workoutShare.exercicios?.length || 0} exercício{(workoutShare.exercicios?.length || 0) !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    {/* Lista de exercícios */}
                    {workoutShare.exercicios?.map((ex: any, i: number) => (
                      <View key={i} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View style={{
                            width: 22, height: 22, borderRadius: 11,
                            backgroundColor: theme.backgroundTertiary,
                            justifyContent: "center", alignItems: "center",
                          }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700" }}>{i + 1}</Text>
                          </View>
                          <Text style={{ color: theme.text, fontWeight: "600", fontSize: 13, flex: 1 }}>{ex.nome}</Text>
                          {ex.grupo_tipo && (
                            <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "600" }}>{ex.grupo_tipo}</Text>
                            </View>
                          )}
                        </View>
                        {workoutShare.tipo === "resultado" && ex.series?.length > 0 && (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 5, marginLeft: 30 }}>
                            {ex.series.map((s: any, si: number) => (
                              <View key={si} style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                                  {s.reps} reps{s.peso > 0 ? ` × ${s.peso}kg` : ""}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}

                    {/* Botão copiar — apenas em templates de outros users */}
                    {workoutShare.tipo === "template" && !isOwn && (
                      <TouchableOpacity
                        onPress={() => handleCopyWorkout(workoutShare)}
                        disabled={copyingWorkout === workoutShare.nome}
                        style={{
                          flexDirection: "row", alignItems: "center", justifyContent: "center",
                          backgroundColor: theme.backgroundTertiary, borderRadius: 10, paddingVertical: 10,
                          marginTop: 4, gap: 6, borderWidth: 1, borderColor: theme.accent,
                          opacity: copyingWorkout === workoutShare.nome ? 0.6 : 1,
                        }}
                      >
                        {copyingWorkout === workoutShare.nome ? (
                          <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                          <>
                            <Ionicons name="copy-outline" size={15} color={theme.accent} />
                            <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 13 }}>Copiar treino</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Timestamp */}
                    <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 6 }}>
                      {new Date(msg.criada_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              );
            }

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
                    <TouchableOpacity onPress={() => handleOpenUserProfile(msg.user_id, msg.user_nome)}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "600" }}>
                          {msg.user_nome}
                        </Text>
                        {msg.user_id === community.criador_id && (
                          <Ionicons name="shield-checkmark" size={12} color="#f5a623" />
                        )}
                      </View>
                    </TouchableOpacity>
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

      {/* Modal: Detalhes da Comunidade */}
      <Modal visible={showCommunityModal} transparent animationType="slide" onRequestClose={() => setShowCommunityModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          activeOpacity={1}
          onPress={() => setShowCommunityModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
              {/* Handle */}
              <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />

              {/* Icon + nome */}
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: theme.backgroundTertiary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Ionicons name="people" size={40} color={theme.accent} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: theme.text, fontSize: 22, fontWeight: "bold" }}>{community.nome}</Text>
                  {!!community.verificada && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                </View>
                {!!community.verificada && (
                  <Text style={{ color: theme.accent, fontSize: 12, marginTop: 4 }}>Comunidade Verificada</Text>
                )}
              </View>

              {/* Descrição */}
              {!!community.descricao && (
                <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>{community.descricao}</Text>
                </View>
              )}

              {/* Stats */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 14, alignItems: "center" }}>
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>{members.length}</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>Membros</Text>
                </View>
                {!!community.pais && (
                  <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 12, padding: 14, alignItems: "center" }}>
                    <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold" }}>🏠</Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>{community.pais}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Editar Comunidade (apenas para o dono) */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => { setShowEditModal(false); setShowEditCountryPicker(false); }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" }}>
            <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "bold" }}>Editar Comunidade</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 13, marginTop: 2 }}>Altera os detalhes da comunidade</Text>
              </View>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setShowEditCountryPicker(false); }} style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 20, padding: 8 }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              {/* Nome */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Nome</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, marginBottom: 20 }}>
                <Ionicons name="people-outline" size={18} color={theme.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Nome da comunidade"
                  placeholderTextColor={theme.textTertiary}
                  value={editName}
                  onChangeText={setEditName}
                  style={{ flex: 1, color: theme.text, fontSize: 15, paddingVertical: 14 }}
                />
              </View>

              {/* Descrição */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Descrição</Text>
              <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, marginBottom: 20 }}>
                <TextInput
                  placeholder="Descrição da comunidade..."
                  placeholderTextColor={theme.textTertiary}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                  numberOfLines={3}
                  style={{ color: theme.text, fontSize: 15, lineHeight: 22, textAlignVertical: "top", minHeight: 72 }}
                />
              </View>

              {/* País */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>País</Text>
              <TouchableOpacity
                onPress={() => setShowEditCountryPicker(true)}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: showEditCountryPicker ? theme.accent : theme.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20 }}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>{selectedEditCountry ? selectedEditCountry.flag : "🌍"}</Text>
                <Text style={{ flex: 1, color: editPais ? theme.text : theme.textTertiary, fontSize: 15 }}>{editPais || "Selecionar país..."}</Text>
                <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
              </TouchableOpacity>

              {/* Privada */}
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 28 }}>
                <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 10, padding: 8, marginRight: 12 }}>
                  <Ionicons name={editPrivada ? "lock-closed" : "lock-open-outline"} size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>Comunidade Privada</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 1 }}>Apenas por convite</Text>
                </View>
                <Switch value={editPrivada} onValueChange={setEditPrivada} trackColor={{ false: theme.border, true: theme.accent }} thumbColor="white" />
              </View>

              {/* Guardar */}
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={editSaving}
                style={{ backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: editSaving ? 0.7 : 1 }}
              >
                {editSaving ? <ActivityIndicator color="white" /> : (
                  <>
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Guardar Alterações</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Country picker overlay */}
            {showEditCountryPicker && (
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
                <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14 }}>
                  <TouchableOpacity onPress={() => { setShowEditCountryPicker(false); setEditCountrySearch(""); }} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                    <Text style={{ color: theme.text, fontSize: 16 }}>Voltar</Text>
                  </TouchableOpacity>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>Selecionar País</Text>
                  <TouchableOpacity onPress={() => { setShowEditCountryPicker(false); setEditCountrySearch(""); }}>
                    <Ionicons name="close" size={22} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 12, marginHorizontal: 24, marginBottom: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border }}>
                  <Ionicons name="search" size={16} color={theme.textTertiary} style={{ marginRight: 8 }} />
                  <TextInput
                    autoFocus
                    placeholder="Pesquisar país..."
                    placeholderTextColor={theme.textTertiary}
                    value={editCountrySearch}
                    onChangeText={setEditCountrySearch}
                    style={{ flex: 1, color: theme.text, fontSize: 14, paddingVertical: 10 }}
                  />
                  {editCountrySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setEditCountrySearch("")}>
                      <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
                <FlatList
                  data={filteredEditPaises}
                  keyExtractor={(item) => item.name}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => { setEditPais(item.name); setShowEditCountryPicker(false); setEditCountrySearch(""); }}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2, backgroundColor: editPais === item.name ? theme.backgroundTertiary : "transparent" }}
                    >
                      <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                      <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>{item.name}</Text>
                      {editPais === item.name && <Ionicons name="checkmark-circle" size={18} color={theme.accent} />}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
