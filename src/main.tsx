import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Garante que o utilizador vê sempre a última versão publicada:
// assim que existir uma nova build, o service worker é substituído e a página recarrega.
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

createRoot(document.getElementById("root")!).render(<App />);
