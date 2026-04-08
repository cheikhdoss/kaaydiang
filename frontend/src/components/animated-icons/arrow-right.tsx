import { motion } from 'framer-motion';
import { ArrowRight as LucideArrowRight } from 'lucide-react';

export const ArrowRight = ({ className, animate = false }: { className?: string; animate?: boolean }) => {
  return (
    <motion.div
      initial={animate ? { x: 0 } : {}}
      animate={animate ? { x: [0, 5, 0] } : {}}
      transition={{ 
        duration: 0.6, 
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.5
      }}
      className={className}
    >
      <LucideArrowRight className="w-full h-full" />
    </motion.div>
  );
};
