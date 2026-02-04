import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { useTheme } from "../../styles/theme";
import { useAuth } from "../../contexts/AuthContext";

export default function Communities() {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    communities,
    userCommunities,
    isLoading,
    loadCommunities,
    createCommunity,
    joinCommunity,
  } = useCommunities();

  const [activeTab, setActiveTab] = useState("joined");
  const [showModal, setShowModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityDesc, setCommunityDesc] = useState("");
  const [communityPais, setCommunityPais] = useState("");
  const [communityLinguas, setCommunityLinguas] = useState("");
  const [communityPrivada, setCommunityPrivada] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const PAISES = ["Portugal", "Brasil", "Angola", "Moçambique", "Cabo Verde", "Timor-Leste", "Outros"];
  const LINGUAS = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    setRefreshing(false);
  };

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communityDesc.trim()) {
      alert("Por favor, preencha nome e descrição");
      return;
    }

    if (!user?.id) {
      alert("Erro: Utilizador não identificado");
      return;
    }

    try {
      setUploading(true);
      
      // Use the API from CommunitiesContext (which sends JSON, not FormData)
      await createCommunity(communityName, communityDesc);
      
      // Reset form
      setCommunityName("");
      setCommunityDesc("");
      setCommunityPais("");
      setCommunityLinguas("");
      setCommunityPrivada(false);
      setShowModal(false);
      alert("Comunidade criada! Aguarde aprovação do admin.");
    } catch (error) {
      console.error("Erro:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar comunidade");
    } finally {
      setUploading(false);
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    try {
      await joinCommunity(communityId);
      alert("Entrou na comunidade com sucesso!");
    } catch (error) {
      alert("Erro ao entrar na comunidade");
    }
  };

  const JoinedTab = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      style={{ flex: 1 }}
    >
      {userCommunities.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center", marginTop: 60 }}>
          <Ionicons name="people-outline" size={56} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
            Sem comunidades ainda
          </Text>
          <Text style={{ color: theme.textTertiary, marginTop: 8, textAlign: "center", fontSize: 13 }}>
            Explore comunidades ou crie uma nova
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab("discover")}
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: theme.accent,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Explorar Comunidades
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {userCommunities.map((community) => (
            <TouchableOpacity
              key={community.id}
              onPress={() => router.push(`/(tabs)/community/${community.id}`)}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                gap: 12,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 10,
                  backgroundColor: theme.backgroundTertiary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="people" size={32} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {community.nome}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                  numberOfLines={1}
                >
                  {community.descricao}
                </Text>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                  👥 {community.membros} membros
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const DiscoverTab = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      style={{ flex: 1 }}
    >
      {communities.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center", marginTop: 60 }}>
          <Ionicons name="search-outline" size={56} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16, fontWeight: "600" }}>
            Nenhuma comunidade disponível
          </Text>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {communities.map((community) => {
            const isJoined = userCommunities.some((c) => c.id === community.id);

            return (
              <View
                key={community.id}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 10,
                      backgroundColor: theme.backgroundTertiary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="people" size={40} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 15,
                        fontWeight: "bold",
                        marginBottom: 2,
                      }}
                    >
                      {community.nome}
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                      numberOfLines={2}
                    >
                      {community.descricao}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                        👥 {community.membros}
                      </Text>
                      {community.pais && (
                        <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                          📍 {community.pais}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {!isJoined && (
                  <TouchableOpacity
                    onPress={() => handleJoinCommunity(community.id)}
                    style={{
                      backgroundColor: theme.accent,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                      Entrar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>GoLift</Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 32,
            fontWeight: "bold",
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Comunidades
        </Text>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("joined")}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor:
                activeTab === "joined" ? theme.accent : theme.backgroundSecondary,
            }}
          >
            <Text
              style={{
                color: activeTab === "joined" ? "white" : theme.text,
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              Minhas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("discover")}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor:
                activeTab === "discover" ? theme.accent : theme.backgroundSecondary,
            }}
          >
            <Text
              style={{
                color: activeTab === "discover" ? "white" : theme.text,
                fontWeight: "bold",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              Explorar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: theme.backgroundSecondary,
              borderWidth: 1,
              borderColor: theme.accent,
            }}
          >
            <Ionicons name="add" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : activeTab === "joined" ? (
        <JoinedTab />
      ) : (
        <DiscoverTab />
      )}

      {/* Modal de criar comunidade */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90%",
            }}
          >
            {/* Header do Modal */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                Criar Comunidade
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={false}
            >

            {/* Nome */}
            <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 6, fontSize: 13 }}>
              Nome
            </Text>
            <TextInput
              placeholder="Nome da comunidade"
              placeholderTextColor={theme.textTertiary}
              value={communityName}
              onChangeText={setCommunityName}
              style={{
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderRadius: 8,
                padding: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: theme.border,
                fontSize: 13,
              }}
            />

            {/* Descrição */}
            <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 6, fontSize: 13 }}>
              Descrição
            </Text>
            <TextInput
              placeholder="Descrição breve..."
              placeholderTextColor={theme.textTertiary}
              value={communityDesc}
              onChangeText={setCommunityDesc}
              multiline={true}
              numberOfLines={3}
              style={{
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderRadius: 8,
                padding: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: theme.border,
                textAlignVertical: "top",
                fontSize: 13,
              }}
            />

            {/* País */}
            <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 6, fontSize: 13 }}>
              País
            </Text>
            <View
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 14,
              }}
            >
              <Picker
                selectedValue={communityPais}
                onValueChange={(itemValue: string) => setCommunityPais(itemValue)}
                style={{ color: theme.text }}
              >
                <Picker.Item label="Selecionar país..." value="" />
                {PAISES.map((pais) => (
                  <Picker.Item key={pais} label={pais} value={pais} />
                ))}
              </Picker>
            </View>

            {/* Privada */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "600", fontSize: 13 }}>
                Privada
              </Text>
              <Switch
                value={communityPrivada}
                onValueChange={setCommunityPrivada}
                trackColor={{ false: theme.border, true: theme.accent }}
              />
            </View>

            {/* Botão Criar */}
            <TouchableOpacity
              onPress={handleCreateCommunity}
              disabled={uploading}
              style={{
                backgroundColor: theme.accent,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 8,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                  Criar Comunidade
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
