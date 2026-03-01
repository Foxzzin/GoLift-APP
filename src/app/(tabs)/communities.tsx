import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { useAuth } from "../../contexts/AuthContext";
import * as Haptics from "expo-haptics";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function communityInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function communityColor(name: string): string {
  const colors = ["#0A84FF", "#30D158", "#FF9F0A", "#FF375F", "#BF5AF2", "#FF6B35"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Communities() {
  const theme = useTheme();
  const { paddingTop: safeTop, paddingBottom: safeBottom } = useAndroidInsets();
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
  const [communityPrivada, setCommunityPrivada] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const PAISES = [
    { flag: "🌍", name: "Internacional" },
    { flag: "🇦🇫", name: "Afeganistão" },
    { flag: "🇦🇱", name: "Albânia" },
    { flag: "🇩🇿", name: "Argélia" },
    { flag: "🇦🇩", name: "Andorra" },
    { flag: "🇦🇴", name: "Angola" },
    { flag: "🇦🇷", name: "Argentina" },
    { flag: "🇦🇲", name: "Arménia" },
    { flag: "🇦🇺", name: "Austrália" },
    { flag: "🇦🇹", name: "Áustria" },
    { flag: "🇦🇿", name: "Azerbaijão" },
    { flag: "🇧🇸", name: "Bahamas" },
    { flag: "🇧🇭", name: "Barém" },
    { flag: "🇧🇩", name: "Bangladesh" },
    { flag: "🇧🇧", name: "Barbados" },
    { flag: "🇧🇾", name: "Bielorrússia" },
    { flag: "🇧🇪", name: "Bélgica" },
    { flag: "🇧🇿", name: "Belize" },
    { flag: "🇧🇯", name: "Benim" },
    { flag: "🇧🇹", name: "Butão" },
    { flag: "🇧🇴", name: "Bolívia" },
    { flag: "🇧🇦", name: "Bósnia e Herzegovina" },
    { flag: "🇧🇼", name: "Botsuana" },
    { flag: "🇧🇷", name: "Brasil" },
    { flag: "🇧🇳", name: "Brunei" },
    { flag: "🇧🇬", name: "Bulgária" },
    { flag: "🇧🇫", name: "Burquina Faso" },
    { flag: "🇧🇮", name: "Burúndi" },
    { flag: "🇨🇻", name: "Cabo Verde" },
    { flag: "🇰🇭", name: "Camboja" },
    { flag: "🇨🇲", name: "Camarões" },
    { flag: "🇨🇦", name: "Canadá" },
    { flag: "🇶🇦", name: "Catar" },
    { flag: "🇰🇿", name: "Cazaquistão" },
    { flag: "🇹🇩", name: "Chade" },
    { flag: "🇨🇱", name: "Chile" },
    { flag: "🇨🇳", name: "China" },
    { flag: "🇨🇾", name: "Chipre" },
    { flag: "🇨🇴", name: "Colômbia" },
    { flag: "🇰🇲", name: "Comores" },
    { flag: "🇨🇬", name: "Congo" },
    { flag: "🇨🇩", name: "Congo (RDC)" },
    { flag: "🇰🇵", name: "Coreia do Norte" },
    { flag: "🇰🇷", name: "Coreia do Sul" },
    { flag: "🇨🇷", name: "Costa Rica" },
    { flag: "🇨🇮", name: "Costa do Marfim" },
    { flag: "🇭🇷", name: "Croácia" },
    { flag: "🇨🇺", name: "Cuba" },
    { flag: "🇩🇰", name: "Dinamarca" },
    { flag: "🇩🇯", name: "Djibouti" },
    { flag: "🇩🇴", name: "República Dominicana" },
    { flag: "🇪🇨", name: "Equador" },
    { flag: "🇪🇬", name: "Egito" },
    { flag: "🇸🇻", name: "El Salvador" },
    { flag: "🇦🇪", name: "Emirados Árabes" },
    { flag: "🇪🇷", name: "Eritreia" },
    { flag: "🇸🇰", name: "Eslováquia" },
    { flag: "🇸🇮", name: "Eslovénia" },
    { flag: "🇪🇸", name: "Espanha" },
    { flag: "🇪🇹", name: "Etiópia" },
    { flag: "🇫🇯", name: "Fiji" },
    { flag: "🇵🇭", name: "Filipinas" },
    { flag: "🇫🇮", name: "Finlândia" },
    { flag: "🇫🇷", name: "França" },
    { flag: "🇬🇦", name: "Gabão" },
    { flag: "🇬🇲", name: "Gâmbia" },
    { flag: "🇬🇭", name: "Gana" },
    { flag: "🇬🇪", name: "Geórgia" },
    { flag: "🇬🇷", name: "Grécia" },
    { flag: "🇬🇹", name: "Guatemala" },
    { flag: "🇬🇳", name: "Guiné" },
    { flag: "🇬🇼", name: "Guiné-Bissau" },
    { flag: "🇬🇾", name: "Guiana" },
    { flag: "🇭🇹", name: "Haiti" },
    { flag: "🇭🇳", name: "Honduras" },
    { flag: "🇭🇺", name: "Hungria" },
    { flag: "🇾🇪", name: "Iémen" },
    { flag: "🇮🇳", name: "Índia" },
    { flag: "🇮🇩", name: "Indonésia" },
    { flag: "🇮🇷", name: "Irão" },
    { flag: "🇮🇶", name: "Iraque" },
    { flag: "🇮🇪", name: "Irlanda" },
    { flag: "🇮🇸", name: "Islândia" },
    { flag: "🇮🇱", name: "Israel" },
    { flag: "🇮🇹", name: "Itália" },
    { flag: "🇯🇲", name: "Jamaica" },
    { flag: "🇯🇵", name: "Japão" },
    { flag: "🇯🇴", name: "Jordânia" },
    { flag: "🇰🇪", name: "Quénia" },
    { flag: "🇰🇬", name: "Quirguistão" },
    { flag: "🇰🇼", name: "Kuwait" },
    { flag: "🇱🇦", name: "Laos" },
    { flag: "🇱🇸", name: "Lesoto" },
    { flag: "🇱🇻", name: "Letónia" },
    { flag: "🇱🇧", name: "Líbano" },
    { flag: "🇱🇷", name: "Libéria" },
    { flag: "🇱🇾", name: "Líbia" },
    { flag: "🇱🇮", name: "Liechtenstein" },
    { flag: "🇱🇹", name: "Lituânia" },
    { flag: "🇱🇺", name: "Luxemburgo" },
    { flag: "🇲🇬", name: "Madagáscar" },
    { flag: "🇲🇼", name: "Malawi" },
    { flag: "🇲🇾", name: "Malásia" },
    { flag: "🇲🇻", name: "Maldivas" },
    { flag: "🇲🇱", name: "Mali" },
    { flag: "🇲🇹", name: "Malta" },
    { flag: "🇲🇦", name: "Marrocos" },
    { flag: "🇲🇷", name: "Mauritânia" },
    { flag: "🇲🇽", name: "México" },
    { flag: "🇲🇿", name: "Moçambique" },
    { flag: "🇲🇩", name: "Moldávia" },
    { flag: "🇲🇨", name: "Mónaco" },
    { flag: "🇲🇳", name: "Mongólia" },
    { flag: "🇲🇪", name: "Montenegro" },
    { flag: "🇲🇲", name: "Myanmar" },
    { flag: "🇳🇦", name: "Namíbia" },
    { flag: "🇳🇵", name: "Nepal" },
    { flag: "🇳🇮", name: "Nicarágua" },
    { flag: "🇳🇪", name: "Níger" },
    { flag: "🇳🇬", name: "Nigéria" },
    { flag: "🇳🇴", name: "Noruega" },
    { flag: "🇳🇿", name: "Nova Zelândia" },
    { flag: "🇴🇲", name: "Omã" },
    { flag: "🇳🇱", name: "Países Baixos" },
    { flag: "🇵🇰", name: "Paquistão" },
    { flag: "🇵🇦", name: "Panamá" },
    { flag: "🇵🇬", name: "Papua Nova Guiné" },
    { flag: "🇵🇾", name: "Paraguai" },
    { flag: "🇵🇪", name: "Peru" },
    { flag: "🇵🇱", name: "Polónia" },
    { flag: "🇵🇹", name: "Portugal" },
    { flag: "🇷🇼", name: "Ruanda" },
    { flag: "🇷🇴", name: "Roménia" },
    { flag: "🇷🇺", name: "Rússia" },
    { flag: "🇸🇲", name: "São Marinho" },
    { flag: "🇸🇹", name: "São Tomé e Príncipe" },
    { flag: "🇸🇦", name: "Arábia Saudita" },
    { flag: "🇸🇳", name: "Senegal" },
    { flag: "🇷🇸", name: "Sérvia" },
    { flag: "🇸🇱", name: "Serra Leoa" },
    { flag: "🇸🇬", name: "Singapura" },
    { flag: "🇸🇾", name: "Síria" },
    { flag: "🇸🇴", name: "Somália" },
    { flag: "🇱🇰", name: "Sri Lanka" },
    { flag: "🇸🇿", name: "Suazilândia" },
    { flag: "🇸🇩", name: "Sudão" },
    { flag: "🇸🇸", name: "Sudão do Sul" },
    { flag: "🇸🇪", name: "Suécia" },
    { flag: "🇨🇭", name: "Suíça" },
    { flag: "🇸🇷", name: "Suriname" },
    { flag: "🇹🇯", name: "Tajiquistão" },
    { flag: "🇹🇭", name: "Tailândia" },
    { flag: "🇹🇿", name: "Tanzânia" },
    { flag: "🇹🇱", name: "Timor-Leste" },
    { flag: "🇹🇬", name: "Togo" },
    { flag: "🇹🇹", name: "Trinidad e Tobago" },
    { flag: "🇹🇳", name: "Tunísia" },
    { flag: "🇹🇲", name: "Turquemenistão" },
    { flag: "🇹🇷", name: "Turquia" },
    { flag: "🇺🇬", name: "Uganda" },
    { flag: "🇺🇦", name: "Ucrânia" },
    { flag: "🇺🇾", name: "Uruguai" },
    { flag: "🇺🇿", name: "Uzbequistão" },
    { flag: "🇻🇪", name: "Venezuela" },
    { flag: "🇻🇳", name: "Vietname" },
    { flag: "🇿🇲", name: "Zâmbia" },
    { flag: "🇿🇼", name: "Zimbábue" },
    { flag: "🇬🇧", name: "Reino Unido" },
    { flag: "🇺🇸", name: "Estados Unidos" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredPaises = PAISES.filter((p) =>
    p.name.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const selectedCountry = PAISES.find((p) => p.name === communityPais);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommunities();
    setRefreshing(false);
  };

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communityDesc.trim()) {
      Alert.alert("Aviso", "Por favor, preenche o nome e a descrição");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erro", "Utilizador não identificado");
      return;
    }

    try {
      setUploading(true);
      
      // Use the API from CommunitiesContext (which sends JSON, not FormData)
      await createCommunity(communityName, communityDesc, communityPais || undefined, communityPrivada);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset form
      setCommunityName("");
      setCommunityDesc("");
      setCommunityPais("");
      setCommunityPrivada(false);
      setShowModal(false);
      Alert.alert("Comunidade criada! ✓", "A tua comunidade já está visível para todos.");
    } catch (error) {
      console.error("Erro:", error);
      Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao criar comunidade");
    } finally {
      setUploading(false);
    }
  };

  const handleJoinCommunity = async (communityId: number) => {
    try {
      await joinCommunity(communityId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Entrou! ✓", "Já fazes parte desta comunidade.");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível entrar na comunidade");
    }
  };

  const JoinedTab = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {userCommunities.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center", marginTop: 80 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>👥</Text>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
            Sem comunidades ainda
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
            Explora comunidades existentes{"\n"}ou cria a tua própria.
          </Text>
          <Pressable
            onPress={() => setActiveTab("discover")}
            accessibilityLabel="Explorar comunidades"
            accessibilityRole="button"
            style={({ pressed }) => ({
              paddingHorizontal: 28,
              paddingVertical: 14,
              backgroundColor: theme.accent,
              borderRadius: 14,
              opacity: pressed ? 0.7 : 1,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            })}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
              Explorar Comunidades
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          {userCommunities.map((community) => (
            <Pressable
              key={community.id}
              onPress={() => router.push(`/(tabs)/community/${community.id}`)}
              accessibilityLabel={`Abrir comunidade ${community.nome}`}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                gap: 12,
                borderLeftWidth: 3,
                borderLeftColor: communityColor(community.nome),
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: communityColor(community.nome) + "22", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: communityColor(community.nome) }}>
                  {communityInitials(community.nome)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700" }}>
                    {community.nome}
                  </Text>
                  {!!community.verificada && (
                    <Text style={{ fontSize: 13, color: theme.accent }}>✓</Text>
                  )}
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 6 }} numberOfLines={1}>
                  {community.descricao}
                </Text>
                <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                  👥 {community.membros} membros
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ alignSelf: "center" }} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const DiscoverTab = () => (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {communities.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center", marginTop: 80 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🔍</Text>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
            Nenhuma comunidade disponível
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14, marginTop: 8 }}>
            Sê o primeiro a criar uma!
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
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: communityColor(community.nome),
                }}
              >
                <View style={{ flexDirection: "row", gap: 12, marginBottom: isJoined ? 0 : 12 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: communityColor(community.nome) + "22", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: communityColor(community.nome) }}>
                      {communityInitials(community.nome)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2, gap: 4 }}>
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: 15,
                          fontWeight: "bold",
                        }}
                      >
                        {community.nome}
                      </Text>
                      {!!community.verificada && (
                        <Text style={{ fontSize: 13, color: theme.accent }}>✓</Text>
                      )}
                    </View>
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
                  <Pressable
                    onPress={() => handleJoinCommunity(community.id)}
                    accessibilityLabel={`Entrar na comunidade ${community.nome}`}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      backgroundColor: theme.accent,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      marginHorizontal: 0,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                      Entrar
                    </Text>
                  </Pressable>
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
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 12, paddingBottom: 16 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>GoLift</Text>
        <Text
          style={{
            color: theme.text,
            fontSize: 32,
            fontWeight: "800",
            marginTop: 4,
            marginBottom: 20,
            letterSpacing: -0.5,
          }}
        >
          Comunidades
        </Text>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setActiveTab("joined")}
            accessibilityLabel="As minhas comunidades"
            accessibilityRole="tab"
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: activeTab === "joined" ? theme.accent : theme.backgroundSecondary,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: activeTab === "joined" ? "white" : theme.textSecondary, fontWeight: "700", textAlign: "center", fontSize: 13 }}>
              Minhas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("discover")}
            accessibilityLabel="Explorar comunidades"
            accessibilityRole="tab"
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: activeTab === "discover" ? theme.accent : theme.backgroundSecondary,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: activeTab === "discover" ? "white" : theme.textSecondary, fontWeight: "700", textAlign: "center", fontSize: 13 }}>
              Explorar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowModal(true)}
            accessibilityLabel="Criar nova comunidade"
            accessibilityRole="button"
            style={({ pressed }) => ({
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: theme.backgroundSecondary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 20, color: theme.accent }}>+</Text>
          </Pressable>
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
        onRequestClose={() => { setShowModal(false); setShowCountryPicker(false); }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%" }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
              <View>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "bold" }}>Nova Comunidade</Text>
                <Text style={{ color: theme.textTertiary, fontSize: 13, marginTop: 2 }}>Cria um espaço para a tua tribo</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setShowModal(false); setShowCountryPicker(false); }}
                style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 20, padding: 8 }}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}>

              {/* Nome */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Nome da Comunidade
              </Text>
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14, borderWidth: 1, borderColor: theme.border,
                paddingHorizontal: 14, marginBottom: 20,
              }}>
                <Ionicons name="people-outline" size={18} color={theme.textTertiary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="Ex: Athletes Portugal"
                  placeholderTextColor={theme.textTertiary}
                  value={communityName}
                  onChangeText={setCommunityName}
                  style={{ flex: 1, color: theme.text, fontSize: 15, paddingVertical: 14 }}
                />
              </View>

              {/* Descrição */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Descrição
              </Text>
              <View style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14, borderWidth: 1, borderColor: theme.border,
                paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
                marginBottom: 20,
              }}>
                <TextInput
                  placeholder="Descreve o tema e objetivos da comunidade..."
                  placeholderTextColor={theme.textTertiary}
                  value={communityDesc}
                  onChangeText={setCommunityDesc}
                  multiline={true}
                  numberOfLines={3}
                  style={{ color: theme.text, fontSize: 15, lineHeight: 22, textAlignVertical: "top", minHeight: 72 }}
                />
              </View>

              {/* País */}
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                País
              </Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(true)}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 14, borderWidth: 1, borderColor: showCountryPicker ? theme.accent : theme.border,
                  paddingHorizontal: 14, paddingVertical: 14,
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>
                  {selectedCountry ? selectedCountry.flag : "🌍"}
                </Text>
                <Text style={{ flex: 1, color: communityPais ? theme.text : theme.textTertiary, fontSize: 15 }}>
                  {communityPais || "Selecionar país..."}
                </Text>
                <Ionicons name="chevron-down" size={18} color={theme.textTertiary} />
              </TouchableOpacity>

              {/* Privada */}
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14, borderWidth: 1, borderColor: theme.border,
                paddingHorizontal: 14, paddingVertical: 14,
                marginBottom: 28,
              }}>
                <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 10, padding: 8, marginRight: 12 }}>
                  <Ionicons name={communityPrivada ? "lock-closed" : "lock-open-outline"} size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>Comunidade Privada</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12, marginTop: 1 }}>Apenas por convite</Text>
                </View>
                <Switch
                  value={communityPrivada}
                  onValueChange={setCommunityPrivada}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="white"
                />
              </View>

              {/* Botão Criar */}
              <TouchableOpacity
                onPress={handleCreateCommunity}
                disabled={uploading}
                style={{
                  backgroundColor: theme.accent,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="white" />
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Criar Comunidade</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={{ color: theme.textTertiary, fontSize: 12, textAlign: "center", marginTop: 12 }}>
                A comunidade ficará imediatamente visível para todos os utilizadores
              </Text>
            </ScrollView>

            {/* Country picker overlay — rendered INSIDE the modal sheet to avoid nested-Modal iOS bug */}
            {showCountryPicker && (
              <View style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: theme.background,
                borderTopLeftRadius: 28, borderTopRightRadius: 28,
              }}>
                <View style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 14 }}>
                  <TouchableOpacity
                    onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                    <Text style={{ color: theme.text, fontSize: 16 }}>Voltar</Text>
                  </TouchableOpacity>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "bold" }}>Selecionar País</Text>
                  <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }}>
                    <Ionicons name="close" size={22} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 12, marginHorizontal: 24, marginBottom: 8,
                  paddingHorizontal: 12, borderWidth: 1, borderColor: theme.border,
                }}>
                  <Ionicons name="search" size={16} color={theme.textTertiary} style={{ marginRight: 8 }} />
                  <TextInput
                    autoFocus
                    placeholder="Pesquisar país..."
                    placeholderTextColor={theme.textTertiary}
                    value={countrySearch}
                    onChangeText={setCountrySearch}
                    style={{ flex: 1, color: theme.text, fontSize: 14, paddingVertical: 10 }}
                  />
                  {countrySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCountrySearch("")}>
                      <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={filteredPaises}
                  keyExtractor={(item) => item.name}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setCommunityPais(item.name);
                        setShowCountryPicker(false);
                        setCountrySearch("");
                      }}
                      style={{
                        flexDirection: "row", alignItems: "center",
                        paddingVertical: 12, paddingHorizontal: 12,
                        borderRadius: 10, marginBottom: 2,
                        backgroundColor: communityPais === item.name ? theme.backgroundTertiary : "transparent",
                      }}
                    >
                      <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                      <Text style={{ color: theme.text, fontSize: 15, flex: 1 }}>{item.name}</Text>
                      {communityPais === item.name && (
                        <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                      )}
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
