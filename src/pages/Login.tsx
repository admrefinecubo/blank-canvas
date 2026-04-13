import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowRight, Users, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: Users, label: "Gestão de Clientes" },
  { icon: TrendingUp, label: "Pipeline de Vendas" },
  { icon: FileText, label: "Orçamentos Rápidos" },
  { icon: BarChart3, label: "Relatórios Completos" },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'LojaADS CRM';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error, redirectTo } = await signIn(email, password);
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message);
    } else {
      navigate(redirectTo || '/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left Panel — LojaADS style dark gradient */}
      <div
        className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden"
        style={{
          background: `linear-gradient(160deg, hsl(215 45% 12%), hsl(215 45% 8%), hsl(220 50% 5%))`,
        }}
      >
        {/* Decorative glow orbs */}
        <div className="absolute top-[10%] right-[20%] h-[400px] w-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(195 100% 50% / 0.3), transparent 70%)' }} />
        <div className="absolute bottom-[15%] left-[10%] h-[300px] w-[300px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(195 100% 50% / 0.2), transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(hsl(195 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(195 100% 50%) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Center message */}
          <div className="flex flex-1 flex-col justify-center max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary w-fit mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              CRM PARA LOJAS DE MÓVEIS
            </div>
            <h2 className="text-4xl xl:text-5xl text-foreground leading-[1.15] tracking-tight font-display font-bold">
              Controle total das suas{' '}
              <span className="text-primary">vendas</span>
              <br />em um só lugar
            </h2>
            <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-md">
              Gerencie clientes, orçamentos, pipeline de vendas e <strong className="text-foreground">acompanhe resultados</strong> da sua loja de colchões e móveis.
            </p>

            {/* Feature chips */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile-only brand */}
          <div className="flex flex-col items-center gap-4 lg:hidden">
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary"
            )}>
              <img src="/logo-lojaads.png" alt="LojaADS" className="h-10 w-10 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight font-display">LojaADS</h1>
              <p className="text-sm text-muted-foreground">CRM</p>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-display">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Entre com suas credenciais para acessar o painel.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={cn(
                  "h-12 rounded-xl border-border/50 bg-muted/30 px-4 text-sm transition-all duration-200 focus-visible:ring-primary/30",
                  focused === 'email' && "border-primary/40 shadow-sm shadow-primary/10"
                )}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={cn(
                    "h-12 rounded-xl border-border/50 bg-muted/30 px-4 pr-12 text-sm transition-all duration-200 focus-visible:ring-primary/30",
                    focused === 'password' && "border-primary/40 shadow-sm shadow-primary/10"
                  )}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl gap-2 text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Entrando...
                </span>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40">loja ads crm</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-muted-foreground/30 lg:hidden">
            CRM para Colchões e Móveis
          </p>
        </div>
      </div>
    </div>
  );
}
