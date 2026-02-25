import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_IP_KEY = "@golift:server_ip";

// IP do servidor local (pode ser alterado dinamicamente via setServerIP)
let SERVER_IP = "localhost";
let SERVER_PORT = "5000";

// Flag para indicar se o IP foi sobrescrito manualmente nesta sessão
let IS_SERVER_CONFIGURED = false;

// Função para testar conexão com servidor (timeout configurável)
async function testServerConnection(ip: string, port: string = "5000", timeoutMs = 3000): Promise<boolean> {
  try {
    const url = `http://${ip}:${port}/api/health`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// Carrega o IP com cache: tenta o IP guardado primeiro, faz scan só se necessário
export async function loadSavedServerIP(): Promise<string | null> {
  try {
    // 1. Verificar se há IP em cache
    const cachedIP = await AsyncStorage.getItem(CACHED_IP_KEY);

    if (cachedIP) {
      console.log(`✓ IP em cache encontrado: ${cachedIP}. A verificar...`);
      const isAlive = await testServerConnection(cachedIP, SERVER_PORT, 2000);
      if (isAlive) {
        SERVER_IP = cachedIP;
        IS_SERVER_CONFIGURED = true;
        console.log(`✓ Servidor em cache está ativo: ${cachedIP}`);
        return cachedIP;
      }
      console.log("IP em cache não responde. A fazer scan completo...");
    }

    // 2. Scan completo na subnet
    const discoveredIP = await discoverServerAutomatically();
    if (discoveredIP) {
      SERVER_IP = discoveredIP;
      IS_SERVER_CONFIGURED = true;
      await AsyncStorage.setItem(CACHED_IP_KEY, discoveredIP);
      console.log(`✓ Servidor descoberto e guardado em cache: ${discoveredIP}`);
      return discoveredIP;
    }

    // 3. Fallback localhost
    console.log("Nenhum servidor encontrado, usando fallback: localhost");
    SERVER_IP = "localhost";
    return "localhost";
  } catch (error) {
    console.error("Erro ao descobrir servidor:", error);
    SERVER_IP = "localhost";
    return "localhost";
  }
}

// Função para obter o IP do dispositivo
export async function getDeviceIP(): Promise<string> {
  try {
    const ipAddress = await Network.getIpAddressAsync();
    console.log("IP do Dispositivo:", ipAddress);
    return ipAddress;
  } catch (error) {
    console.error("Erro ao obter IP do dispositivo:", error);
    return "Desconhecido";
  }
}

// Função para descobrir o servidor automaticamente (scan completo)
export async function discoverServerAutomatically(): Promise<string | null> {
  try {
    console.log("Iniciando descoberta automática do servidor...");
    const deviceIP = await getDeviceIP();

    if (deviceIP === "Desconhecido") {
      console.log("Não foi possível obter IP do dispositivo");
      return null;
    }

    const subnet = deviceIP.substring(0, deviceIP.lastIndexOf(".") + 1);
    console.log(`Subnet detectada: ${subnet}`);

    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const testIP = `${subnet}${i}`;
      if (testIP !== deviceIP) {
        promises.push(
          testServerConnection(testIP, SERVER_PORT, 2000).then(success => ({ ip: testIP, success }))
        );
      }
    }

    const results = await Promise.all(promises);
    const foundServer = results.find((r: any) => r.success && r.ip) as any;
    if (foundServer?.ip) {
      console.log(`Servidor encontrado: ${foundServer.ip}`);
      return foundServer.ip;
    }

    console.log("Nenhum servidor encontrado na rede");
    return null;
  } catch (error) {
    console.error("Erro ao descobrir servidor:", error);
    return null;
  }
}

// Função para obter a URL da API
export function getAPIUrl(): string {
  return `http://${SERVER_IP}:${SERVER_PORT}`;
}

// Função para sobrescrever o IP do servidor manualmente nesta sessão
export function setServerIP(ip: string): void {
  SERVER_IP = ip;
  IS_SERVER_CONFIGURED = true;
  AsyncStorage.setItem(CACHED_IP_KEY, ip);
  console.log("IP do servidor atualizado para:", ip);
}

// Função para atualizar a porta
export function setServerPort(port: string): void {
  SERVER_PORT = port;
  console.log("Porta do servidor atualizada para:", port);
}

// Limpar cache (forçar redescoberta no próximo arranque)
export async function clearServerIPCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHED_IP_KEY);
  console.log("Cache do IP do servidor limpo.");
}

// Informações de debug
export const DEBUG_INFO = {
  getInfo: async () => ({
    deviceIP: await getDeviceIP(),
    apiURL: getAPIUrl(),
    cachedIP: await AsyncStorage.getItem(CACHED_IP_KEY),
  }),
};

export const SERVER_CONFIG = {
  getIP: () => SERVER_IP,
  getPort: () => SERVER_PORT,
  getFullURL: () => getAPIUrl(),
  setIP: setServerIP,
  setPort: setServerPort,
  isConfigured: () => IS_SERVER_CONFIGURED,
  clearCache: clearServerIPCache,
};

