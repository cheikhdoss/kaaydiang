import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  subtitle,
  children,
}: ScrollExpandMediaProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth spring animation for scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform values based on scroll progress
  const mediaScale = useTransform(smoothProgress, [0, 0.5], [0.3, 1]);
  const mediaOpacity = useTransform(smoothProgress, [0, 0.25], [0.4, 1]);
  const bgOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  const textOpacity = useTransform(smoothProgress, [0, 0.35], [1, 0]);
  const contentOpacity = useTransform(smoothProgress, [0.65, 0.9], [0, 1]);
  const textY = useTransform(smoothProgress, [0, 0.35], [0, -80]);

  // Media moves up slightly then content appears below
  const mediaY = useTransform(smoothProgress, [0.4, 0.9], [0, -60]);
  const contentY = useTransform(smoothProgress, [0.65, 0.9], [40, 0]);

  const words = title.split(' ');
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ');

  const textSplitX = useTransform(smoothProgress, [0, 0.5], [0, -120]);
  const textSplitXReverse = useTransform(smoothProgress, [0, 0.5], [0, 120]);
  const darkOverlayOpacity = useTransform(smoothProgress, [0, 0.6], [0.7, 0]);
  const subtitleOpacity = useTransform(smoothProgress, [0, 0.3], [0.8, 0]);
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: '300vh' }}>
      {/* Sticky container */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* Background Image */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ opacity: bgOpacity }}
        >
          <img
            src={bgImageSrc}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        {/* Dark overlay that fades as we scroll */}
        <motion.div
          className="absolute inset-0 z-0 bg-black"
          style={{ opacity: darkOverlayOpacity }}
        />

        {/* Center Media */}
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ y: mediaY }}
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            style={{
              scale: mediaScale,
              opacity: mediaOpacity,
              width: 'min(85vw, 1200px)',
              height: 'min(60vh, 700px)',
            }}
          >
            {mediaType === 'video' ? (
              <video
                src={mediaSrc}
                poster={posterSrc}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={mediaSrc}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Dark gradient overlay on media */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </motion.div>
        </motion.div>

        {/* Title Text - splits and moves apart */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: textOpacity, y: textY }}
        >
          <div className="flex items-center justify-center gap-4 flex-wrap px-4">
            <motion.h2
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white/90 tracking-tight"
              style={{ x: textSplitX }}
            >
              {firstWord}
            </motion.h2>
            <motion.h2
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white/90 tracking-tight"
              style={{ x: textSplitXReverse }}
            >
              {restOfTitle}
            </motion.h2>
          </div>
          {subtitle && (
            <motion.p
              className="mt-4 text-lg text-white/60 max-w-xl text-center px-4"
              style={{ opacity: subtitleOpacity }}
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <span className="text-xs text-white/40 uppercase tracking-widest">
            Scroll pour explorer
          </span>
          <motion.div
            className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Content that appears after expansion - compact glass card */}
        <motion.div
          className="absolute inset-0 z-20 flex items-end justify-center pb-8 px-4 md:px-8"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          <div className="max-w-lg w-full">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScrollExpandMedia;
