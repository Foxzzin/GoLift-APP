import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_IP_KEY = "@golift:server_ip";

// Domínio do servidor de produção AWS EC2
const PRODUCTION_IP = process.env.EXPO_PUBLIC_API_IP ?? "goliftapp.me";
const PRODUCTION_PORT = "80";
const IS_PRODUCTION = process.env.EXPO_PUBLIC_IS_PRODUCTION === "true";
const DEV_PORT = "3000";

let SERVER_IP = IS_PRODUCTION ? PRODUCTION_IP : "localhost";
let SERVER_PORT = IS_PRODUCTION ? PRODUCTION_PORT : DEV_PORT;

let IS_SERVER_CONFIGURED = IS_PRODUCTION; // Em produção já está configurado de imediato

// ─── PRODUÇÃO: retorna imediatamente sem qualquer I/O ───────────────────────
export async function loadSavedServerIP(): Promise<string | null> {
  if (IS_PRODUCTION) {
    SERVER_IP = PRODUCTION_IP;
    IS_SERVER_CONFIGURED = true;
    return PRODUCTION_IP;
  }
  // Apenas em desenvolvimento: tenta cache → scan → localhost
  return loadSavedServerIPDev();
}

// ─── APENAS DESENVOLVIMENTO ─────────────────────────────────────────────────
async function testServerConnection(ip: string, port: string = DEV_PORT, timeoutMs = 3000): Promise<boolean> {
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

async function getDeviceIP(): Promise<string> {
  try {
    // Importação dinâmica para que em produção o módulo nem carregue
    const Network = await import('expo-network');
    return await Network.getIpAddressAsync();
  } catch {
    return "Desconhecido";
  }
}

export async function discoverServerAutomatically(): Promise<string | null> {
  if (IS_PRODUCTION) return null; // Nunca executar em produção
  try {
    const deviceIP = await getDeviceIP();
    if (deviceIP === "Desconhecido") return null;
    const subnet = deviceIP.substring(0, deviceIP.lastIndexOf(".") + 1);
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
    const found = results.find((r: any) => r.success) as any;
    return found?.ip ?? null;
  } catch {
    return null;
  }
}

async function loadSavedServerIPDev(): Promise<string | null> {
  try {
    const cachedIP = await AsyncStorage.getItem(CACHED_IP_KEY);
    if (cachedIP) {
      const isAlive = await testServerConnection(cachedIP, SERVER_PORT, 2000);
      if (isAlive) {
        SERVER_IP = cachedIP;
        IS_SERVER_CONFIGURED = true;
        return cachedIP;
      }
    }
    const discoveredIP = await discoverServerAutomatically();
    if (discoveredIP) {
      SERVER_IP = discoveredIP;
      IS_SERVER_CONFIGURED = true;
      await AsyncStorage.setItem(CACHED_IP_KEY, discoveredIP);
      return discoveredIP;
    }
    SERVER_IP = "localhost";
    return "localhost";
  } catch {
    SERVER_IP = "localhost";
    return "localhost";
  }
}

// Função para obter a URL da API
export function getAPIUrl(): string {
  // Porta 80 não precisa ser especificada no URL
  if (SERVER_PORT === "80") return `http://${SERVER_IP}`;
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
    deviceIP: IS_PRODUCTION ? "N/A (produção)" : await getDeviceIP(),
    apiURL: getAPIUrl(),
    cachedIP: IS_PRODUCTION ? null : await AsyncStorage.getItem(CACHED_IP_KEY),
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

