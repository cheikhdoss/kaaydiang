import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardData {
  icon: LucideIcon;
  value: number | string;
  title: string;
  desc: string;
  cta: string;
  color: string;
  link: string;
  suffix?: string;
  prefix?: string;
  svgBackground?: ReactNode;
}

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter = ({ target, duration = 1.5, prefix = '', suffix = '' }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {prefix}{hasAnimated ? count.toLocaleString() : '0'}{suffix}
    </span>
  );
};

interface StatCardsProps {
  stats: StatCardData[];
}

export const StatCards = ({ stats }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`rounded-2xl overflow-hidden shadow-lg ${stat.color}`}
        >
          <div className="relative overflow-hidden flex flex-col">
            {/* SVG Background */}
            {stat.svgBackground}

            {/* Icon */}
            <div className="px-6 pt-6 mb-3 relative z-10">
              <stat.icon className="w-8 h-8 text-white/60" />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center items-start px-6 relative z-10">
              <div className="text-white text-4xl font-bold mb-4">
                {typeof stat.value === 'number' ? (
                  <AnimatedCounter
                    target={stat.value as number}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-white text-lg font-semibold mb-1">{stat.title}</div>
              <div className="text-white/80 text-sm">{stat.desc}</div>
            </div>

            {/* Bottom bar */}
            <Link
              to={stat.link}
              className="group/card w-full bg-black/90 px-6 py-4 flex items-center justify-between mt-4"
            >
              <span className="text-white text-sm font-medium">{stat.cta}</span>
              <ArrowRight className="group-hover/card:translate-x-1 transition-transform duration-300 w-5 h-5 text-white" />
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
