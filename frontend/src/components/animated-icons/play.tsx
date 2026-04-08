import { motion } from 'framer-motion';
import { Play as LucidePlay } from 'lucide-react';

export const Play = ({ className, animate = true }: { className?: string; animate?: boolean }) => {
  return (
    <motion.div
      initial={animate ? { scale: 1 } : {}}
      animate={animate ? { 
        scale: [1, 1.1, 1],
      } : {}}
      transition={{ 
        duration: 1.5, 
        ease: "easeInOut",
        repeat: Infinity
      }}
      className={className}
    >
      <LucidePlay className="w-full h-full" />
    </motion.div>
  );
};
