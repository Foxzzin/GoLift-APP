import * as Network from 'expo-network';

// IP do servidor local (pode ser alterado dinamicamente via setServerIP)
let SERVER_IP = "localhost";
let SERVER_PORT = "5000";

// Flag para indicar se o IP foi sobrescrito manualmente nesta sessão
let IS_SERVER_CONFIGURED = false;

// Descobre sempre o servidor automaticamente (sem cache)
export async function loadSavedServerIP(): Promise<string | null> {
  try {
    console.log("A descobrir servidor na rede...");
    const discoveredIP = await discoverServerAutomatically();
    if (discoveredIP) {
      SERVER_IP = discoveredIP;
      IS_SERVER_CONFIGURED = true;
      console.log(`✓ Servidor descoberto: ${discoveredIP}`);
      return discoveredIP;
    }

    // Fallback para localhost se nada funcionar
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

// Função para sobrescrever o IP do servidor manualmente nesta sessão
export function setServerIP(ip: string): void {
  SERVER_IP = ip;
  IS_SERVER_CONFIGURED = true;
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
