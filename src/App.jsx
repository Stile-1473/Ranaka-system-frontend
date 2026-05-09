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
            "min-h-[60px] rounded-[1.2rem] border border-white/10 bg-slate-950/88 px-4 py-3 text-slate-50 shadow-[0_18px_45px_-22px_rgba(2,6,23,0.92)] backdrop-blur-xl",
          descriptionClassName: "text-sm text-slate-400",
        }}
      />
    </>
  );
}

export default App;
