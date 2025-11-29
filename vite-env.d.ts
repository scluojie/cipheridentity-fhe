/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // 仅供参考：如果您的应用使用其他自定义环境变量，也应在此声明，例如：
  // readonly VITE_CUSTOM_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
