'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Trophy, Star, Flame, BookOpen, Database, Code, Shield, Loader2 } from 'lucide-react';
import { generateMapChapters, Chapter } from '@/lib/aiEngine';
import { motion } from 'motion/react';

const BADGES_DATA = [
  { id: 'first_query', name: 'First Query', description: 'Ran your first SQL query.', icon: Code, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { id: 'first_join', name: 'First JOIN', description: 'Successfully executed a JOIN operation.', icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { id: 'completionist', name: 'Completionist', description: 'Completed all chapters.', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Logged in for 3 consecutive days.', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Logged in for 7 consecutive days.', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
];

export default function ProfilePage() {
  const { xp, level, streak, completedChapters, badges } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
    const loadChapters = async () => {
      try {
        const data = await generateMapChapters();
        setChapters(data);
      } catch (err) {
        console.error("Failed to load chapters:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadChapters();
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current || isLoading || chapters.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Stats data (0 to 100)
    const stats = [
      { label: 'Queries', value: Math.min(100, xp / 50) },
      { label: 'Joins', value: completedChapters.includes('ch4') ? 80 : 20 },
      { label: 'Aggregations', value: completedChapters.includes('ch3') ? 90 : 10 },
      { label: 'Consistency', value: Math.min(100, streak * 10) },
      { label: 'Completion', value: (completedChapters.length / (chapters.length || 1)) * 100 },
    ];

    const numPoints = stats.length;
    const angleStep = (Math.PI * 2) / numPoints;

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      for (let j = 0; j < numPoints; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();

      // Draw labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelX = centerX + Math.cos(angle) * (radius + 20);
      const labelY = centerY + Math.sin(angle) * (radius + 20);
      ctx.fillText(stats[i].label, labelX, labelY);
    }

    // Draw data polygon
    ctx.beginPath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue-500 with opacity
    ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
    ctx.lineWidth = 2;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = stats[i].value / 100;
      const x = centerX + Math.cos(angle) * (radius * value);
      const y = centerY + Math.sin(angle) * (radius * value);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#fff';
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = stats[i].value / 100;
      const x = centerX + Math.cos(angle) * (radius * value);
      const y = centerY + Math.sin(angle) * (radius * value);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [mounted, xp, streak, completedChapters, chapters.length, isLoading]);

  if (!mounted) return null;

  const xpProgress = (xp % 1000) / 10;
  const nextLevelXp = 1000 - (xp % 1000);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
        <p className="text-gray-400">Track your progress, stats, and achievements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Radar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Level Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            
            <div className="w-24 h-24 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border-4 border-blue-500/30">
              <span className="text-4xl font-black text-blue-400">{level}</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">Level {level} Data Wizard</h2>
            <p className="text-sm text-gray-400 mb-6">{xp} Total XP</p>
            
            <div className="w-full bg-white/5 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">{nextLevelXp} XP to Level {level + 1}</p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <Flame className="h-8 w-8 text-orange-500 mb-2" />
              <span className="text-2xl font-bold text-white">{streak}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Day Streak</span>
            </div>
            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <BookOpen className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-2xl font-bold text-white">{completedChapters.length}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Chapters</span>
            </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex flex-col items-center"
          >
            <h3 className="text-lg font-bold text-white mb-4 w-full text-left">Skill Radar</h3>
            <canvas 
              ref={canvasRef} 
              width={260} 
              height={260} 
              className="max-w-full"
            />
          </motion.div>
        </div>

        {/* Right Column: Badges & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Badges */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Badges
              </h3>
              <span className="text-sm text-gray-400">{badges.length} / {BADGES_DATA.length} Unlocked</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BADGES_DATA.map((badge) => {
                const isUnlocked = badges.includes(badge.id);
                const Icon = badge.icon;
                
                return (
                  <div 
                    key={badge.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      isUnlocked 
                        ? `${badge.bg} ${badge.border}` 
                        : 'bg-white/5 border-white/5 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`p-3 rounded-full ${isUnlocked ? badge.bg : 'bg-white/10'}`}>
                      <Icon className={`h-6 w-6 ${isUnlocked ? badge.color : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{badge.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Chapter Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Course Progress
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </h3>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading course structure...</p>
                </div>
              ) : (
                chapters.map((chapter, index) => {
                  const isCompleted = completedChapters.includes(chapter.id);
                  return (
                    <div key={chapter.id} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-400'}`}>{chapter.title}</span>
                          {isCompleted && <span className="text-xs text-green-400 font-bold">COMPLETED</span>}
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-transparent'}`} style={{ width: isCompleted ? '100%' : '0%' }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
