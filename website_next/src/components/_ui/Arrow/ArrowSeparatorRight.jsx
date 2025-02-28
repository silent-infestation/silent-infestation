'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function ArrowSeparator() {
  return (
    <div className="flex items-center justify-center gap-2 bg-[#DCF0FF]">
      <motion.div
        initial={{ x: -90 }}
        animate={{ x: 90 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
        className="h-1 w-80 bg-[#05829E]"
      ></motion.div>
      <motion.div
        initial={{ x: -90 }}
        animate={{ x: 90 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
        className="text-3xl"
      >
        <ArrowRight size={42} className="text-[#05829E]" />
      </motion.div>
    </div>
  );
}
