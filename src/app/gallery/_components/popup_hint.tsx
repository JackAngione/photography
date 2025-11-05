"use client";
import { motion } from "motion/react";
export default function PopupHint() {
  return (
    <div className=" self-center text-white text-[3.5rem]">
      <motion.div
        className="text-sm"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
        }}
        transition={{
          opacity: { delay: 1, duration: 1 },
        }}
      >
        view by category
      </motion.div>
    </div>
  );
}
