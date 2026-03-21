import { SemanticNavigatorApi } from "./SemanticNavigatorApi";

export const navigatorApi = new SemanticNavigatorApi(import.meta.env.VITE_API_BASE_URL);
