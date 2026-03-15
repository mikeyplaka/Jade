import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Lock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      // Redirect handled by AuthContext or state change
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    } else {
      setError(result.error || 'Check your credentials and try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md border-white/5 bg-slate-950/40 backdrop-blur-2xl shadow-2xl relative z-10 rounded-2xl">
        <CardHeader className="space-y-3 text-center pb-8 pt-10">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground/30 flex items-center justify-center mb-2 shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="text-slate-400 font-medium">
            Enter your credentials to access your Jade account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</Label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12 bg-white/5 border-white/5 focus:bg-white/10 transition-all focus:ring-primary/20 rounded-xl text-white placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-white/5 border-white/5 focus:bg-white/10 transition-all focus:ring-primary/20 rounded-xl text-white placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98] group"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <Lock className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-10">
          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-slate-500 font-bold tracking-widest">Internal Access Only</span>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 px-8 leading-relaxed font-medium">
            Authorized personnel only. Use of this system is monitored and recorded.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
