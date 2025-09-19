import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

// أيقونات جوجل وفيسبوك (تبقى كما هي)
const GoogleIcon = () => ( <svg className="ml-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.82 1.9-5.78 0-10.47-4.88-10.47-10.92S6.7 1.08 12.48 1.08c3.24 0 5.4 1.35 6.67 2.53l-2.52 2.34c-.82-.76-2.04-1.35-4.15-1.35-4.82 0-8.72 3.9-8.72 8.72s3.9 8.72 8.72 8.72c5.33 0 8.14-3.83 8.4-7.42h-8.4v-3.28z"/></svg> );
const FacebookIcon = () => ( <svg className="ml-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path fill="currentColor" d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.732 0 1.325-.593 1.325-1.325V1.325C24 .593 23.407 0 22.675 0z"/></svg> );

const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const user = session.user;
                const { data: profile, error } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
                if (error && error.code === 'PGRST116') {
                    toast({ title: 'أهلاً بك في Serve Me!', description: 'خطوة أخيرة، يرجى إكمال بيانات ملفك الشخصي.' });
                    navigate('/complete-profile');
                } else if (profile) {
                    toast({ title: 'أهلاً بعودتك!' });
                    navigate('/dashboard');
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate, toast]);
    
    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isSignUp) {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                toast({ title: "خطأ في إنشاء الحساب", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "تم إنشاء الحساب بنجاح", description: "يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب." });
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => { setLoading(true); const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } }); if (error) { toast({ title: "خطأ في تسجيل الدخول عبر جوجل", description: error.message, variant: "destructive" }); setLoading(false); } };
    const handleFacebookLogin = async () => { setLoading(true); const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: `${window.location.origin}/dashboard` } }); if (error) { toast({ title: "خطأ في تسجيل الدخول عبر فيسبوك", description: error.message, variant: "destructive" }); setLoading(false); } };

    return (
        // ✨ 1. الحاوية الرئيسية للتصميم المتجاوب ✨
        <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-background rtl p-4">
            
            {/* ✨ 2. قسم الصورة الكبيرة ✨ */}
            <div className="w-full md:w-1/2 flex justify-center items-center p-8">
                <img
                    src="/auth-logo2.png" // تأكد من أن اسم الصورة صحيح وموجود في مجلد public
                    alt="Serve Me Hero"
                    className="w-56 md:w-80 animate-float"
                />
            </div>

            {/* ✨ 3. قسم بطاقة تسجيل الدخول ✨ */}
            <div className="w-full md:w-1/2 flex justify-center items-center">
                <Card className="w-full max-w-sm mx-4">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-primary">
                            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                        </CardTitle>
                        <CardDescription>
                            {isSignUp ? 'أدخل بياناتك للانضمام إلينا.' : 'مرحباً بعودتك!'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 pt-4">
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? '...جاري التحميل' : (isSignUp ? 'إنشاء حساب' : 'دخول')}
                            </Button>
                        </form>

                        <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
                            {isSignUp ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'ليس لديك حساب؟ إنشاء حساب جديد'}
                        </Button>
                        
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">أو</span></div>
                        </div>

                        <div className="space-y-3">
                            <Button variant="secondary" className="w-full text-lg py-6" onClick={handleGoogleLogin} disabled={loading}>{loading ? '...جاري التحميل' : 'المتابعة باستخدام جوجل'} <GoogleIcon /></Button>
                            <Button variant="default" className="w-full text-lg py-6 bg-[#1877F2] hover:bg-[#166fe5] text-white" onClick={handleFacebookLogin} disabled={loading}>{loading ? '...جاري التحميل' : 'المتابعة باستخدام فيسبوك'} <FacebookIcon /></Button>
                        </div>

                        <p className="px-8 text-center text-xs text-muted-foreground mt-2">
                            بالاستمرار، أنت توافق على <Link to="/terms" className="underline underline-offset-4 hover:text-primary"> شروط الخدمة </Link> الخاصة بنا.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AuthPage;
