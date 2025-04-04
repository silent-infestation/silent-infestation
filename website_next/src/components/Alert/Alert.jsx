"use client";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useEffect } from "react";

export default function Alert({ isShowingAlert, isAlertErrorMessage, alertTitle, onClose }) {
  useEffect(() => {
    if (isShowingAlert) {
      const timeout = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isShowingAlert, onClose]);

  return (
    <AnimatePresence>
      {isShowingAlert && (
        <motion.section
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={clsx(
            "fixed left-0 top-0 z-50 w-full p-2 text-center",
            isAlertErrorMessage ? "bg-red text-white" : "bg-green-500 text-black"
          )}
        >
          <span className="font-semibold">{alertTitle}</span>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
