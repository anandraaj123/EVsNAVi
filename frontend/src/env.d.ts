declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_OCM_API_KEY: string;
      EXPO_PUBLIC_ORS_API_KEY: string;
    }
  }
}
export {};
