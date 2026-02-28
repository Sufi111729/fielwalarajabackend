import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function rewritePrettyAdmin() {
  return {
    name: "rewrite-pretty-admin-route",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }
        if (req.url === "/admin") req.url = "/admin-login.html";
        if (req.url === "/users") req.url = "/users.html";
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }
        if (req.url === "/admin") req.url = "/admin-login.html";
        if (req.url === "/users") req.url = "/users.html";
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), rewritePrettyAdmin()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        convert: resolve(__dirname, "convert.html"),
        auth: resolve(__dirname, "auth.html"),
        adminLogin: resolve(__dirname, "admin-login.html"),
        users: resolve(__dirname, "users.html"),
        panEditor: resolve(__dirname, "pan-editor.html"),
        kbEditor: resolve(__dirname, "kb-editor.html"),
        documentValidator: resolve(__dirname, "document-validator.html")
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tensorflow") || id.includes("body-pix")) return "tf-bodypix";
          if (id.includes("jspdf")) return "vendor-jspdf";
          if (id.includes("html2canvas")) return "vendor-html2canvas";
          if (id.includes("react-easy-crop")) return "vendor-cropper";
          if (id.includes("axios")) return "vendor-axios";
          return "vendor-core";
        }
      }
    }
  }
});
