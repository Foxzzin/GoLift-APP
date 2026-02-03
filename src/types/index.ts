// Tipos de dados do GoLift

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo?: number;
  idade?: number;
  peso?: number;
  altura?: number;
  isAdmin?: boolean;
}

export interface Exercise {
  id: number;
  nome: string;
  grupo_tipo?: string;
  video_url?: string;
}

export interface Serie {
  numero_serie: number;
  repeticoes: number;
  peso: number;
  concluida: boolean;
}

export interface Workout {
  id_treino: number;
  nome: string;
  exercicios: any[];
}

export interface Record {
  exercicio: string;
  weight: number;
  data?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  idade?: number;
  peso?: number;
  altura?: number;
}
