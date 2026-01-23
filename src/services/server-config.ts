import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP do servidor local (pode ser alterado dinamicamente)
let SERVER_IP = "10.0.2.2"; // Padrão para emulador Android
let SERVER_PORT = "5000";

// Flag para indicar se o servidor foi configurado
let IS_SERVER_CONFIGURED = false;

// Função para carregar o IP guardado do AsyncStorage
export async function loadSavedServerIP(): Promise<string | null> {
  try {
    const savedIP = await AsyncStorage.getItem("@server_ip");
    if (savedIP) {
      SERVER_IP = savedIP;
      IS_SERVER_CONFIGURED = true;
      console.log("IP do servidor carregado do storage:", savedIP);
      return savedIP;
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

// Função para obter a URL da API
export function getAPIUrl(): string {
  return `http://${SERVER_IP}:${SERVER_PORT}`;
}

// Função para atualizar o IP do servidor (útil para testar em vários dispositivos)
export function setServerIP(ip: string): void {
  SERVER_IP = ip;
  IS_SERVER_CONFIGURED = true;
  // Guarda no AsyncStorage
  AsyncStorage.setItem("@server_ip", ip).catch(err => console.error("Erro ao guardar IP:", err));
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
