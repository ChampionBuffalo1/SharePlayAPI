declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      LISTEN_IP?: string;
      ANNOUNCED_IP?: string;
      NODE_ENV: 'production' | 'development';
    }
  }
}

export {};
