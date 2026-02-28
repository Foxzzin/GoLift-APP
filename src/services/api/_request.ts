
import axios from "axios";
import { SERVER_CONFIG } from "../server-config";
import storage from "../storage";
import { router } from "expo-router";

const getAPI_URL = () => SERVER_CONFIG.getFullURL();

export async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${getAPI_URL()}${endpoint}`;
  const method = (options?.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  // Adicionar token JWT se existir
  const token = await storage.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const data = options?.body ? JSON.parse(options.body as string) : undefined;

  try {
    const response = await axios({ method, url, headers, data, timeout: 30000 });
    return response.data as T;
  } catch (error: any) {
    // Tratamento global de 401: logout automático
    if (error.response && error.response.status === 401) {
      await storage.clear();
      router.replace("/login");
      throw new Error("Sessão expirada. Faz login novamente.");
    }
    console.error(`Erro ao conectar a ${url}:`, error.message);
    if (error.response) {
      const msg = error.response.data?.erro || error.response.data?.message || "Erro na requisição";
      throw new Error(msg);
    }
    const enriched = new Error(`[${error.name}] ${error.message} → ${url}`);
    enriched.name = error.name || "NetworkError";
    throw enriched;
  }
}
