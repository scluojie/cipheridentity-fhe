import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // 当请求路径以 '/relayer-api' 开头时，例如：/relayer-api/v1/user-decrypt
        "/relayer-api": {
          // 目标是 Zama 中继器
          target: "https://relayer.testnet.zama.org",
          // 重写路径，移除 /relayer-api，使其变为 /v1/user-decrypt
          rewrite: (path) => path.replace(/^\/relayer-api/, ""),
          secure: true, // 目标是 HTTPS
          changeOrigin: true, // 必须设置
        },
      },
    },
    plugins: [react(), wasm(), topLevelAwait(), nodePolyfills()],
    build: {
      target: "esnext",
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.API_KEY),
    },
    optimizeDeps: {
      include: ["@zama-fhe/relayer-sdk/web"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
