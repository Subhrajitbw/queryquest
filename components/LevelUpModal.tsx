'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LevelUpModal() {
  const { showLevelUpModal, level, closeLevelUpModal } = useAppStore();

  useEffect(() => {
    if (showLevelUpModal) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showLevelUpModal]);

  return (
    <AnimatePresence>
      {showLevelUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeLevelUpModal}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="relative bg-gradient-to-b from-blue-900 to-[#070b14] border border-blue-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(37,99,235,0.5)]"
          >
            <button 
              onClick={closeLevelUpModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <Trophy className="h-12 w-12 text-yellow-400" />
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-2">Level Up!</h2>
            <p className="text-gray-300 mb-6">
              You&apos;ve reached <span className="text-blue-400 font-bold">Level {level}</span>. Keep up the great work!
            </p>

            <div className="flex justify-center gap-2 mb-8">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-500 fill-current animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>

            <button
              onClick={closeLevelUpModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              Continue Journey
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
