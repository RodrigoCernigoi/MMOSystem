import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export const SplashScreen = () => (
  <motion.main
    className="splash-screen"
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
    transition={{ duration: 0.55, ease: "easeOut" }}
  >
    <motion.div
      className="splash-core"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <motion.div
        className="splash-sigil"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, ease: "linear" }}
      >
        <Sparkles size={32} />
      </motion.div>
      <div>
        <p className="eyebrow">System initializing</p>
        <h1>MMO System</h1>
      </div>
      <div className="splash-loader" aria-label="Carregando sistema">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.65, ease: "easeInOut" }}
        />
      </div>
      <motion.span
        className="splash-status"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.72, 1] }}
        transition={{ duration: 1.4, repeat: 1, ease: "easeInOut" }}
      >
        calibrando missoes, atributos e progresso
      </motion.span>
    </motion.div>
  </motion.main>
);
