'use client';

import { useAppStore } from '@/lib/store';
import { CheckCircle, Lock, Star, Play, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { generateMapChapters, Chapter } from '@/lib/aiEngine';

export default function SkillTree({ onChapterClick }: { onChapterClick?: (chapter: Chapter) => void }) {
  const { completedChapters } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const data = await generateMapChapters();
        setChapters(data);
      } catch (err) {
        console.error("Failed to load chapters:", err);
      } finally {
        setIsLoading(false);
        setMounted(true);
      }
    };
    loadChapters();
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-gray-400 animate-pulse">Generating your learning map...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12 w-full max-w-7xl mx-auto px-4">
      {chapters.map((chapter, index) => {
        const isCompleted = completedChapters.includes(chapter.id);
        const isUnlocked = index === 0 || completedChapters.includes(chapters[index - 1].id);
        const isCurrent = isUnlocked && !isCompleted;
        
        const CardContent = (
          <div className={`group relative h-full glass-card p-8 overflow-hidden transition-all duration-500 border-2 ${
            isCompleted 
              ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/50' 
              : isCurrent
                ? 'border-blue-500/50 bg-blue-500/10 hover:border-blue-500'
                : 'border-white/5 bg-white/5 opacity-40 grayscale cursor-not-allowed'
          }`}>
            {/* Background Accent */}
            <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150 ${
              isCompleted ? 'bg-green-500/10' : isCurrent ? 'bg-blue-500/20' : 'bg-white/5'
            }`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${
                  isCompleted ? 'border-green-500/30 text-green-400' : 
                  isCurrent ? 'border-blue-500/30 text-blue-400' : 
                  'border-white/10 text-gray-500'
                }`}>
                  Chapter {index + 1}
                </span>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : !isUnlocked ? (
                  <Lock className="h-5 w-5 text-gray-600" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                )}
              </div>

              <h3 className={`text-2xl font-black tracking-tight mb-3 leading-tight ${
                isCompleted ? 'text-green-400' : isUnlocked ? 'text-white' : 'text-gray-600'
              }`}>
                {chapter.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                {chapter.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/10' : 'bg-white/5'}`}>
                    <Star className={`h-4 w-4 ${isCompleted ? 'text-green-500 fill-green-500' : 'text-gray-500'}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-400">{chapter.xp} XP</span>
                </div>

                {isCurrent && (
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 group-hover:translate-x-1 transition-transform">
                    Start <Play className="h-3 w-3 fill-current" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

        return (
          <motion.div 
            key={chapter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={isUnlocked ? { y: -8, scale: 1.02 } : {}}
            className="h-full"
          >
            {onChapterClick ? (
              <button 
                onClick={() => isUnlocked && onChapterClick(chapter)}
                className="w-full h-full text-left"
              >
                {CardContent}
              </button>
            ) : (
              <Link 
                href={isUnlocked ? `/chapter/${chapter.id}` : '#'}
                className="w-full h-full"
              >
                {CardContent}
              </Link>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
