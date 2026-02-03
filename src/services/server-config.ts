import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP do servidor local (pode ser alterado dinamicamente)
let SERVER_IP = "192.168.56.1"; // IP correcto do servidor
let SERVER_PORT = "5000";

// Flag para indicar se o servidor foi configurado
let IS_SERVER_CONFIGURED = false;

// Função para carregar o IP guardado do AsyncStorage
export async function loadSavedServerIP(): Promise<string | null> {
  try {
    const savedIP = await AsyncStorage.getItem("@server_ip");
    if (savedIP) {
      // Sanitizar o IP - remover vírgulas e espaços
      const cleanedIP = savedIP.replace(/,/g, ".").trim();
      SERVER_IP = cleanedIP;
      IS_SERVER_CONFIGURED = true;
      console.log("IP do servidor carregado do storage:", cleanedIP);
      console.log(`✓ Conectando a: http://${cleanedIP}:${SERVER_PORT}`);
      return cleanedIP;
    }
    return null;
  } catch (error) {
    console.error("Erro ao carregar IP do storage:", error);
    return null;
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

// Função para testar conexão com servidor
async function testServerConnection(ip: string, port: string = "5000"): Promise<boolean> {
  try {
    const url = `http://${ip}:${port}/api/health`;
    const response = await fetch(url, {
      method: "GET",
    });
    console.log(`Teste de conexão com ${ip}:${port} - Status: ${response.status}`);
    return response.ok;
  } catch (error: any) {
    console.log(`Erro ao testar conexão com ${ip}:${port}:`, error);
    return false;
  }
}

// Função para descobrir o servidor automaticamente
export async function discoverServerAutomatically(): Promise<string | null> {
  try {
    console.log("Iniciando descoberta automática do servidor...");
    const deviceIP = await getDeviceIP();
    
    if (deviceIP === "Desconhecido") {
      console.log("Não foi possível obter IP do dispositivo");
      return null;
    }

    // Extrai a subnet (ex: 192.168.1. de 192.168.1.100)
    const subnet = deviceIP.substring(0, deviceIP.lastIndexOf(".") + 1);
    console.log(`Subnet detectada: ${subnet}`);

    // Testa IPs de 1 a 254 na mesma subnet
    // Começa do 1 até 254 para encontrar o servidor
    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const testIP = `${subnet}${i}`;
      // Ignora o próprio dispositivo
      if (testIP !== deviceIP) {
        promises.push(
          testServerConnection(testIP, SERVER_PORT).then(success => ({
            ip: testIP,
            success,
          }))
        );
      }
    }

    // Aguarda até 3 segundos por resposta (não espera por todas)
    const racePromises = promises.map(
      p => Promise.race([p, new Promise((resolve: any) => setTimeout(() => resolve({ ip: null, success: false }), 3000))])
    );

    const results = await Promise.all(racePromises);
    
    // Encontra o primeiro servidor disponível
    const foundServer = results.find((r: any) => r.success && r.ip) as any;
    if (foundServer && foundServer.ip) {
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

// Função para atualizar o IP do servidor (útil para testar em vários dispositivos)
export function setServerIP(ip: string): void {
  SERVER_IP = ip;
  IS_SERVER_CONFIGURED = true;
  // Guarda no AsyncStorage
  AsyncStorage.setItem("@server_ip", ip).catch((err: any) => console.error("Erro ao guardar IP:", err));
  console.log("IP do servidor atualizado para:", ip);
}

// Função para atualizar a porta
export function setServerPort(port: string): void {
  SERVER_PORT = port;
  console.log("Porta do servidor atualizada para:", port);
}

// Informações de debug
export const DEBUG_INFO = {
  getInfo: async () => ({
    deviceIP: await getDeviceIP(),
    apiURL: getAPIUrl(),
  }),
};

export const SERVER_CONFIG = {
  getIP: () => SERVER_IP,
  getPort: () => SERVER_PORT,
  getFullURL: () => getAPIUrl(),
  setIP: setServerIP,
  setPort: setServerPort,
  isConfigured: () => IS_SERVER_CONFIGURED,
};
