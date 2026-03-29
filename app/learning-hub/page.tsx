'use client';

import { useState } from 'react';
import { generateLearningPath, LearningPath, Chapter } from '@/lib/aiEngine';
import { useAppStore } from '@/lib/store';
import { Sparkles, ArrowLeft, Loader2, BrainCircuit, Map as MapIcon, BookOpen } from 'lucide-react';
import AiLessonView from '@/components/AiLessonView';
import SkillTree from '@/components/SkillTree';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LearningHubPage() {
  const [view, setView] = useState<'map' | 'lesson'>('map');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { addXP, addBadge, completeChapter, completedChapters } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChapterClick = async (chapter: Chapter) => {
    setIsLoading(true);
    setError(null);
    setSelectedChapter(chapter);
    try {
      const path = await generateLearningPath(chapter.title);
      if (path) {
        setLearningPath(path);
        setCurrentLessonIndex(0);
        setCompletedLessons([]);
        setView('lesson');
      } else {
        setError("We couldn't generate a learning path for this chapter right now. Please try again.");
        setSelectedChapter(null);
      }
    } catch (err) {
      console.error("Failed to generate learning path:", err);
      setError("An unexpected error occurred. Please try again.");
      setSelectedChapter(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = () => {
    if (!completedLessons.includes(currentLessonIndex)) {
      setCompletedLessons(prev => [...prev, currentLessonIndex]);
      addXP(50);
    }
  };

  const handleNext = () => {
    if (learningPath && currentLessonIndex < learningPath.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    } else {
      // Path completed
      if (selectedChapter) {
        completeChapter(selectedChapter.id);
        addXP(selectedChapter.xp);
      }
      addBadge('ai_scholar');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      setView('map');
      setLearningPath(null);
      setSelectedChapter(null);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Logout
          </button>
        </div>
        <AnimatePresence mode="wait">
          {view === 'map' && !isLoading ? (
            <motion.div 
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-16"
            >
              {/* Hero Section */}
              <div className="relative py-20 px-8 rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20 border border-white/10">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/database/1920/1080')] opacity-5 mix-blend-overlay grayscale" />
                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20"
                  >
                    <BrainCircuit className="h-16 w-16 text-blue-500" />
                  </motion.div>
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
                    MASTER THE <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">DATABASE</span>
                  </h1>
                  <p className="text-gray-400 text-xl md:text-2xl max-w-2xl leading-relaxed mb-10">
                    Your personal AI-powered journey from SQL basics to advanced DBMS architecture. 
                    Pick a chapter below to start your interactive lesson.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                      <MapIcon className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-black uppercase tracking-widest text-gray-300">
                        {completedChapters.length} / 25 Chapters
                      </span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-black uppercase tracking-widest text-gray-300">
                        AI-Powered Path
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Tree Section */}
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Your Learning Path</h2>
                  <div className="h-px flex-1 mx-8 bg-white/10" />
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scroll to explore</div>
                </div>
                
                {error && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-center text-sm font-bold animate-pulse">
                    {error}
                  </div>
                )}

                <SkillTree onChapterClick={handleChapterClick} />
              </div>

              {/* Schema Preview Section */}
              <div className="mt-16 p-12 rounded-[3rem] bg-white/5 border border-white/10">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="max-w-xs">
                    <h3 className="text-3xl font-black tracking-tight mb-4 uppercase">The Sandbox Database</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      All lessons and challenges run against this real-world schema. 
                      Familiarize yourself with the tables to write better queries.
                    </p>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {['Users', 'Products', 'Orders', 'Order_Items', 'Categories'].map((table) => (
                      <div key={table} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors group">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-bold text-gray-300 group-hover:text-blue-400 transition-colors">{table}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {table === 'Users' ? 'id, name, email, created_at' :
                           table === 'Products' ? 'id, name, price, category_id' :
                           table === 'Orders' ? 'id, user_id, total, status' :
                           table === 'Order_Items' ? 'id, order_id, product_id, qty' :
                           'id, name, description'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-6"
            >
              <div className="relative">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Generating interactive lessons...</h2>
                <p className="text-gray-500">AI is crafting a personalized path for &quot;{selectedChapter?.title}&quot;</p>
              </div>
            </motion.div>
          ) : view === 'lesson' && learningPath ? (
            <motion.div 
              key="lesson-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
            >
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => {
                    setView('map');
                    setLearningPath(null);
                    setSelectedChapter(null);
                  }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Map
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {learningPath.lessons.map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                          i === currentLessonIndex ? 'bg-blue-500 w-12' : 
                          completedLessons.includes(i) ? 'bg-green-500' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Lesson {currentLessonIndex + 1} of {learningPath.lessons.length}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-sm font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">
                  Chapter: {selectedChapter?.title}
                </h2>
                <p className="text-gray-500 text-xs">{selectedChapter?.description}</p>
              </div>

              <AiLessonView 
                lesson={learningPath.lessons[currentLessonIndex]}
                onComplete={handleLessonComplete}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirst={currentLessonIndex === 0}
                isLast={currentLessonIndex === learningPath.lessons.length - 1}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
