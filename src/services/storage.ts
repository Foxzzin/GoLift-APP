import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@golift:user",
  TOKEN: "@golift:token",
};

export const storage = {
  // Guardar utilizador
  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  // Obter utilizador
  async getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  // Remover utilizador (logout)
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Guardar token
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },

  // Obter token
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  // Remover token
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  // Limpar tudo (logout completo)
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
  },
};

export default storage;
