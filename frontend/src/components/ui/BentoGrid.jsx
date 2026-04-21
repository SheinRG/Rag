import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}) => {
  return (
    <div
      className={`mx-auto grid max-w-[1200px] grid-cols-1 gap-6 md:auto-rows-[20rem] md:grid-cols-3 ${className || ""}`}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-3xl border border-white/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl transition duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] ${className || "bg-white/40 hover:bg-white/60"}`}
    >
      {/* Background soft glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/20 opacity-0 group-hover/bento:opacity-100 transition duration-500 rounded-3xl pointer-events-none" />
      
      {header}
      
      <div className="transition duration-300 group-hover/bento:translate-x-2 z-10 relative pt-2">
        <div className="mb-2 font-sans font-bold text-lg text-neutral-800">
          {title}
        </div>
        <div className="font-sans text-[0.95rem] leading-relaxed font-medium text-gray-500">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
