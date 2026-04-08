import { motion } from 'framer-motion';
import { GraduationCap as LucideGraduationCap } from 'lucide-react';

export const GraduationCap = ({ className, animate = false }: { className?: string; animate?: boolean }) => {
  return (
    <motion.div
      initial={animate ? { rotate: 0 } : {}}
      animate={animate ? { rotate: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      <LucideGraduationCap className="w-full h-full" />
    </motion.div>
  );
};
