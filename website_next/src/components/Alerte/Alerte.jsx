  "use client";

  import { motion, AnimatePresence } from "framer-motion";
  import clsx from "clsx";

  export default function Alert({
    isShowingAlert,
    isAlertErrorMessage,
    alertTitle,
  }) {
    return (
      <AnimatePresence>
        {isShowingAlert && (
          <motion.section
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={clsx(
              "fixed top-0 left-0 w-full text-center p-2 z-50",
              isAlertErrorMessage
                ? "bg-black text-white"
                : "bg-green-500 text-black"
            )}
          >
            <span className="font-semibold">{alertTitle}</span>
          </motion.section> 
        )}
      </AnimatePresence>
    );
  }
