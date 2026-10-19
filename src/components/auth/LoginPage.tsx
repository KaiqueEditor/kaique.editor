import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { APP_VERSION } from '../../version';
import { Button, Field, Input } from '../../ui';

/** Três slides em leque, só tipografia: a vitrine da tela de login. */
function SlideFan() {
    const slides = [
        { text: 'A dona do ChatGPT cortou o preço em 80%', rot: -8, x: -105, y: 22, z: 1 },
        { text: 'O Instagram mudou o algoritmo de novo', rot: 0, x: 0, y: 0, z: 3 },
        { text: '84% do mundo nunca usou IA', rot: 8, x: 105, y: 22, z: 2 },
    ];
    return (
        <div className="relative w-[300px] h-[400px]" aria-hidden="true">
            {slides.map((s, i) => (
                <div key={i}
                    className="absolute inset-0 rounded-[6px] bg-[#111] overflow-hidden flex flex-col justify-end p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
                    style={{ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg) scale(${s.z === 3 ? 1 : 0.92})`, zIndex: s.z }}>
                    <div className="absolute inset-x-0 top-0 h-[55%]"
                        style={{ background: i === 1 ? 'var(--story-gradient)' : 'linear-gradient(160deg,#2a2a2a,#555 50%,#8a8a8a)', opacity: i === 1 ? 0.9 : 0.6 }} />
                    <div className="absolute inset-x-0 top-[40%] h-[20%] bg-gradient-to-b from-transparent to-[#111]" />
                    <p className="relative text-white text-center uppercase leading-[1.02] text-[26px]" style={{ fontFamily: "'Anton', sans-serif" }}>{s.text}</p>
                    <p className="relative mt-3 text-center text-[8px] tracking-[0.3em] text-white/50 font-semibold">ARRASTA PRO LADO ›››</p>
                </div>
            ))}
        </div>
    );
}

export const LoginPage = ({ onLogin, initialSignUp = false, onBack }: { onLogin: (user: any) => void; initialSignUp?: boolean; onBack?: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(initialSignUp);

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
            const { error } = await supabase.auth.signInWithOAuth({
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
        <div className="fixed inset-0 bg-bg text-fg font-sans flex overflow-y-auto">
            <main className="flex-1 flex flex-col px-6 sm:px-12 lg:px-20 py-8 min-h-full">
                <div className="flex items-center justify-between gap-4">
                    <div className="text-subhead font-semibold tracking-tight">Carrossel<span className="text-brand">.</span>Pro</div>
                    {onBack && (
                        <button type="button" onClick={onBack} className="text-footnote text-muted hover:text-fg underline-offset-4 hover:underline">
                            Conhecer a plataforma
                        </button>
                    )}
                </div>

                <div className="my-auto w-full max-w-[400px] py-10 flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <h1 className="font-display font-light text-title2 xl:text-title1 leading-[1.2]">
                            {isSignUp ? 'Crie sua conta.' : 'Seus carrosséis, prontos para o feed.'}
                        </h1>
                        <p className="text-subhead text-muted">
                            {isSignUp ? 'Leva menos de um minuto.' : 'Entre para continuar de onde parou.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                        {isSignUp && (
                            <Field label="Nome">
                                {id => <Input id={id} type="text" autoComplete="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Seu nome de criador" />}
                            </Field>
                        )}
                        <Field label="E-mail">
                            {id => <Input id={id} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" className="h-control-lg" />}
                        </Field>
                        <Field label="Senha" hint={isSignUp ? 'Mínimo de 8 caracteres, com letras e números.' : undefined}>
                            {id => <Input id={id} type="password" required minLength={6} autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="h-control-lg" />}
                        </Field>
                        {isSignUp && (
                            <Field label="Confirme a senha">
                                {id => <Input id={id} type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-control-lg" />}
                            </Field>
                        )}
                        <Button type="submit" variant="primary" size="lg" loading={loading} block className="mt-2">
                            {isSignUp ? 'Criar conta' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3 text-caption text-faint">
                        <span className="flex-1 h-px bg-fg/10" />ou<span className="flex-1 h-px bg-fg/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <Button size="lg" icon={<FaGoogle size={15} />} onClick={() => handleOAuthLogin('google')}>Google</Button>
                        <Button size="lg" icon={<FaGithub size={16} />} onClick={() => handleOAuthLogin('github')}>GitHub</Button>
                    </div>

                    <p className="text-subhead text-muted">
                        {isSignUp ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
                        <button type="button" onClick={() => setIsSignUp(v => !v)} className="text-fg font-medium underline underline-offset-4 hover:no-underline">
                            {isSignUp ? 'Entrar' : 'Criar conta'}
                        </button>
                    </p>
                </div>

                <p className="text-caption text-faint tabular-nums">v{APP_VERSION}</p>
            </main>

            <aside className="hidden lg:flex w-[46%] max-w-[720px] bg-[#0A0A0A] items-center justify-center relative overflow-hidden" aria-hidden="true">
                <SlideFan />
                <p className="absolute bottom-8 inset-x-0 text-center text-footnote text-white/50">Cole o roteiro. Ajuste. Poste.</p>
            </aside>
        </div>
    );
};
