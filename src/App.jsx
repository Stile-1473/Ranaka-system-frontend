import { useEffect } from "react";
import { Toaster } from "sonner";
import AppRouter from "./routes/AppRouter";
import { useAuthQueryStore } from "./stores/query/authQueryStore";
import { useNotificationsSocket } from "./hooks/useNotificationsSocket";

function App() {
  const bootstrapSession = useAuthQueryStore((state) => state.bootstrapSession);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  useNotificationsSocket();

  return (
    <>
      <AppRouter />
      <Toaster
        richColors
        closeButton
        position="top-center"
        offset={24}
        visibleToasts={3}
        toastOptions={{
          className:
            "min-h-[60px] rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-slate-900 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.35)] backdrop-blur-md",
          descriptionClassName: "text-sm text-slate-500",
        }}
      />
    </>
  );
}

export default App;
