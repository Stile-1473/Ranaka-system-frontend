import { motion } from "framer-motion";

function LoadingScreen({ message = "Preparing your workspace..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel flex w-full max-w-md flex-col items-center gap-5 px-10 py-12 text-center">
        <motion.div
          className="h-14 w-14 rounded-full border-4 border-brand-100 border-t-brand-600"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <div>
          <p className="text-lg font-semibold text-slate-900">{message}</p>
          <p className="mt-2 text-sm text-slate-500">
            If the server was resting, this can take a short moment.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
