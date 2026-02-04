import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Community, CommunityMessage, CommunityMember } from "../types";
import storage from "../services/storage";
import { communitiesApi } from "../services/api";
import { useAuth } from "./AuthContext";

interface CommunitiesContextData {
  communities: Community[];
  userCommunities: Community[];
  messages: { [communityId: number]: CommunityMessage[] };
  isLoading: boolean;
  createCommunity: (nome: string, descricao: string) => Promise<void>;
  joinCommunity: (comunidadeId: number) => Promise<void>;
  leaveCommunity: (comunidadeId: number) => Promise<void>;
  sendMessage: (comunidadeId: number, mensagem: string) => Promise<void>;
  loadCommunities: () => Promise<void>;
  loadCommunityMessages: (comunidadeId: number) => Promise<void>;
  getCommunityMembers: (comunidadeId: number) => Promise<CommunityMember[]>;
}

const CommunitiesContext = createContext<CommunitiesContextData>({} as CommunitiesContextData);

export function CommunitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<{ [communityId: number]: CommunityMessage[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCommunities();
    }
  }, [user]);

  async function loadCommunities() {
    try {
      setIsLoading(true);
      const data = await communitiesApi.getCommunities();
      setCommunities(data);

      const userComm = await communitiesApi.getUserCommunities(user?.id || 0);
      setUserCommunities(userComm);
    } catch (error) {
      console.error("Erro ao carregar comunidades:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createCommunity(nome: string, descricao: string) {
    try {
      const newCommunity = await communitiesApi.createCommunity({
        nome,
        descricao,
        criador_id: user?.id || 0,
      });
      setCommunities([...communities, newCommunity]);
      setUserCommunities([...userCommunities, newCommunity]);
    } catch (error) {
      console.error("Erro ao criar comunidade:", error);
      throw error;
    }
  }

  async function joinCommunity(comunidadeId: number) {
    try {
      await communitiesApi.joinCommunity(comunidadeId, user?.id || 0);
      const community = communities.find((c) => c.id === comunidadeId);
      if (community) {
        setUserCommunities([...userCommunities, community]);
      }
    } catch (error) {
      console.error("Erro ao entrar na comunidade:", error);
      throw error;
    }
  }

  async function leaveCommunity(comunidadeId: number) {
    try {
      await communitiesApi.leaveCommunity(comunidadeId, user?.id || 0);
      setUserCommunities(userCommunities.filter((c) => c.id !== comunidadeId));
    } catch (error) {
      console.error("Erro ao sair da comunidade:", error);
      throw error;
    }
  }

  async function sendMessage(comunidadeId: number, mensagem: string) {
    try {
      const newMessage = await communitiesApi.sendMessage(comunidadeId, user?.id || 0, mensagem);
      setMessages({
        ...messages,
        [comunidadeId]: [...(messages[comunidadeId] || []), newMessage],
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      throw error;
    }
  }

  async function loadCommunityMessages(comunidadeId: number) {
    try {
      const data = await communitiesApi.getCommunityMessages(comunidadeId);
      setMessages({
        ...messages,
        [comunidadeId]: data,
      });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }

  async function getCommunityMembers(comunidadeId: number) {
    try {
      return await communitiesApi.getCommunityMembers(comunidadeId);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
      return [];
    }
  }

  return (
    <CommunitiesContext.Provider
      value={{
        communities,
        userCommunities,
        messages,
        isLoading,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        sendMessage,
        loadCommunities,
        loadCommunityMessages,
        getCommunityMembers,
      }}
    >
      {children}
    </CommunitiesContext.Provider>
  );
}

export function useCommunities() {
  const context = useContext(CommunitiesContext);
  if (!context) {
    throw new Error("useCommunities deve ser usado dentro de CommunitiesProvider");
  }
  return context;
}
