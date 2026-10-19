import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { APP_VERSION } from '../../version';

// Reusing editor design tokens for consistency
const T = {
    bg: '#000000',
    card: 'rgba(255,255,255,0.03)',
    glass: 'rgba(255,255,255,0.05)',
    glassMd: 'rgba(255,255,255,0.08)',
    glassHover: 'rgba(255,255,255,0.12)',
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.2)',
    text: '#FFFFFF',
    textSub: 'rgba(255,255,255,0.6)',
    textDim: 'rgba(255,255,255,0.4)',
    textFaint: 'rgba(255,255,255,0.2)',
    accent: '#00E5C3',
    accentHover: '#00F2CE',
    accentGlow: 'rgba(0, 229, 195, 0.4)',
};

export const LoginPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    toast.error('As senhas não coincidem!');
                    setLoading(false);
                    return;
                }
                // Mesma regra configurada no Supabase Auth (8+ caracteres, letras e números)
                if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
                    toast.error('A senha deve ter pelo menos 8 caracteres, com letras e números.');
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nickname: nickname || email.split('@')[0],
                        },
                    },
                });
                if (error) {
                    // Mensagens mais claras
                    if (error.message.includes('already registered')) {
                        throw new Error('Este email já está cadastrado. Tente fazer login.');
                    }
                    throw error;
                }
                // Se email confirmation está OFF, data.user já vem com sessão
                if (data.user && data.session) {
                    toast.success('Conta criada! Entrando...');
                    onLogin(data.user);
                } else {
                    toast.success('Conta criada! Verifique seu email e depois faça login.');
                    setIsSignUp(false);
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error('Email ou senha incorretos.');
                    }
                    throw error;
                }
                toast.success('Bem-vindo de volta!');
                onLogin(data.user);
            }
        } catch (error: any) {
            toast.error(error.message || 'Erro ao autenticar');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}`,
                    queryParams: provider === 'google' ? {
                        access_type: 'offline',
                        prompt: 'consent',
                    } : undefined,
                    skipBrowserRedirect: false,
                }
            });
            if (error) throw error;
            // OAuth opens a popup or redirects — if redirected, the page reloads
            // and supabase.auth.getSession() picks up the tokens from the URL hash
        } catch (error: any) {
            console.error(`[OAuth ${provider}] Error:`, error);
            toast.error(error.message || `Erro ao conectar com ${provider}`);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center font-inter antialiased overflow-hidden" style={{ background: T.bg }}>

            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00E5C3]/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#0070F3]/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Content Wrapper */}
            <div className="relative w-full max-w-[420px] px-6 py-12 flex flex-col items-center">

                {/* Brand */}
                <div className="flex flex-col items-center mb-10 select-none">
                    <h1 className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                        Carrossel<span style={{ color: T.accent }}>.Pro</span>
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] mt-2 opacity-60">
                        by Kaique.Editor
                    </p>
                </div>

                {/* Login Card */}
                <div
                    className="w-full rounded-3xl backdrop-blur-3xl shadow-2xl overflow-hidden p-[2px]"
                    style={{
                        background: `linear-gradient(180deg, ${T.borderLight} 0%, transparent 100%)`,
                    }}
                >
                    <div
                        className="w-full h-full rounded-[23px] p-8 flex flex-col gap-6"
                        style={{ background: 'rgba(10,10,10,0.85)' }}
                    >
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {isSignUp ? 'Criar sua conta' : 'Acesse seus projetos'}
                            </h2>
                            <p className="text-sm mt-2" style={{ color: T.textSub }}>
                                {isSignUp
                                    ? 'Junte-se à revolução dos carrosséis'
                                    : 'Entre para continuar criando conteúdos incríveis'}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="flex flex-col gap-4 mt-2">
                            {isSignUp && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wide px-1">
                                        Nickname
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Seu nome de criador"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00E5C3]/50 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wide px-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00E5C3]/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wide px-1">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00E5C3]/50 focus:bg-white/10 transition-all"
                                />
                            </div>

                            {isSignUp && (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold text-white/70 uppercase tracking-wide px-1">
                                            Confirmação de senha
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00E5C3]/50 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <label className="flex items-start gap-3 mt-1 cursor-pointer">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input type="checkbox" className="peer w-4 h-4 appearance-none border border-white/20 rounded-sm bg-black/50 checked:bg-[#00E5C3] checked:border-[#00E5C3] transition-colors cursor-pointer" />
                                            <svg className="absolute w-2.5 h-2.5 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-[13px] text-white/70 leading-snug select-none">
                                            Quero receber novidades do Carrossel.Pro por email
                                        </span>
                                    </label>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group mt-4 py-3.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                style={{
                                    background: isSignUp ? T.glassHover : T.accent,
                                    border: isSignUp ? `1px solid ${T.borderLight}` : 'none',
                                    color: isSignUp ? T.text : T.bg,
                                    boxShadow: isSignUp ? 'none' : `0 8px 30px -10px ${T.accent}`,
                                }}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    isSignUp ? 'Efetuar cadastro' : 'Entrar na Plataforma'
                                )}
                            </button>
                        </form>

                        {/* OAuth habilitado */}
                        <div className="flex items-center w-full my-1">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="px-3 text-[10px] uppercase font-bold text-white/30 tracking-widest">
                                ou entre com
                            </span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('google')}
                                className="w-full relative group py-3 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/10 active:scale-95 border border-white/10"
                                style={{ background: T.glass }}
                            >
                                {/* @ts-ignore */}
                                <FaGoogle size={14} className="text-white group-hover:text-red-400 transition-colors" />
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin('github')}
                                className="w-full relative group py-3 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/10 active:scale-95 border border-white/10"
                                style={{ background: T.glass }}
                            >
                                {/* @ts-ignore */}
                                <FaGithub size={15} className="text-white group-hover:text-gray-400 transition-colors" />
                                GitHub
                            </button>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-[12px] font-semibold text-white/50 hover:text-white transition-colors"
                            >
                                {isSignUp
                                    ? 'Já tem uma conta? Fazer login'
                                    : 'Ainda não tem acesso? Criar conta'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-white/30 text-[10px] font-medium tracking-wider uppercase">
                    <Sparkles size={12} /> Desbloqueie o poder infinito
                </div>
                <span className="mt-2 text-[9px] font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    v{APP_VERSION}
                </span>
            </div>
        </div>
    );
};
