// Barrel � re-exporta todos os m�dulos de API.
// Os imports existentes (ex: import { authApi } from "../services/api") continuam a funcionar sem altera��es.

export { authApi } from "./api/auth";
export { userApi } from "./api/user";
export { exerciseApi } from "./api/exercises";
export { workoutApi } from "./api/workouts";
export { metricsApi } from "./api/metrics";
export { communitiesApi } from "./api/communities";
export { adminApi } from "./api/admin";
export { planoApi } from "./api/plano";

import { authApi } from "./api/auth";
import { userApi } from "./api/user";
import { exerciseApi } from "./api/exercises";
import { workoutApi } from "./api/workouts";
import { metricsApi } from "./api/metrics";
import { communitiesApi } from "./api/communities";
import { adminApi } from "./api/admin";
import { planoApi } from "./api/plano";

export default {
  auth: authApi,
  user: userApi,
  exercise: exerciseApi,
  workout: workoutApi,
  metrics: metricsApi,
  communities: communitiesApi,
  admin: adminApi,
  plano: planoApi,
};
