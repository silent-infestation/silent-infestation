'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function ArrowSeparator() {
  return (
    <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 transform items-center gap-2">
      <motion.div
        initial={{ x: 90 }}
        animate={{ x: -90 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
        className="text-3xl"
      >
        <ArrowLeft size={32} className="text-[#05829E]" />
      </motion.div>
      <motion.div
        initial={{ x: 90 }}
        animate={{ x: -90 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
        className="h-1 w-80 bg-[#05829E]"
      ></motion.div>
    </div>
  );
}
