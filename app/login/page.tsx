'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect based on role
      if (data.user.role === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/learning-hub');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,transparent_100%)] opacity-50" />
      
      <Card className="w-full max-w-md glass-card relative z-10 border-white/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <GraduationCap className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-2">
              <button 
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/seed', { method: 'POST' });
                    if (res.ok) alert('Database seeded successfully!');
                  } catch (err) {
                    console.error('Seed error:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-blue-400 transition-colors"
              >
                Seed Database (Dev Only)
              </button>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
