import { motion } from 'framer-motion';
import { Sparkles as LucideSparkles } from 'lucide-react';

export const Sparkles = ({ className, animate = true }: { className?: string; animate?: boolean }) => {
  return (
    <motion.div
      initial={animate ? { scale: 1 } : {}}
      animate={animate ? { 
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360]
      } : {}}
      transition={{ 
        duration: 2, 
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1
      }}
      className={className}
    >
      <LucideSparkles className="w-full h-full" />
    </motion.div>
  );
};
