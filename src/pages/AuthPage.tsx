import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

// أيقونة جوجل
const GoogleIcon = () => (
    <svg className="ml-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.82 1.9-5.78 0-10.47-4.88-10.47-10.92S6.7 1.08 12.48 1.08c3.24 0 5.4 1.35 6.67 2.53l-2.52 2.34c-.82-.76-2.04-1.35-4.15-1.35-4.82 0-8.72 3.9-8.72 8.72s3.9 8.72 8.72 8.72c5.33 0 8.14-3.83 8.4-7.42h-8.4v-3.28z"/>
    </svg>
);

const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // ✨ الخطوة 1: إضافة useEffect لمراقبة حالة المصادقة وتوجيه المستخدمين الجدد
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const user = session.user;
                
                // التحقق مما إذا كان للمستخدم ملف شخصي مكتمل بالفعل
                // نفترض أن لديك جدول "profiles" وأن حقل "full_name" يدل على اكتمال الملف
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                // إذا لم يتم العثور على ملف شخصي (مستخدم جديد)
                if (error && error.code === 'PGRST116') {
                    toast({
                        title: 'أهلاً بك في Serve Me!',
                        description: 'خطوة أخيرة، يرجى إكمال بيانات ملفك الشخصي.',
                    });
                    navigate('/complete-profile'); // توجيه المستخدم لصفحة إكمال البيانات
                } else if (profile) {
                    // إذا كان المستخدم موجوداً بالفعل
                    toast({ title: 'أهلاً بعودتك!' });
                    navigate('/dashboard'); // توجيه المستخدم مباشرة إلى لوحة التحكم
                }
            }
        });

        // إلغاء الاشتراك عند إغلاق المكون
        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, toast]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // ✨ الخطوة 2: تحديد مسار العودة بعد تسجيل الدخول
                // سيتولى useEffect التعامل مع المنطق التالي
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) {
            toast({
                title: "خطأ في تسجيل الدخول عبر جوجل",
                description: error.message,
                variant: "destructive",
            });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background rtl">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Serve Me</CardTitle>
                    <CardDescription>
                        سجّل الدخول أو أنشئ حسابًا عبر جوجل للمتابعة
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                    {/* ✨ الخطوة 3: إزالة كل النماذج وترك زر جوجل فقط */}
                    <Button
                        variant="secondary"
                        className="w-full text-lg py-6"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? '...جاري التحميل' : 'المتابعة باستخدام جوجل'}
                        <GoogleIcon />
                    </Button>

                    <p className="px-8 text-center text-xs text-muted-foreground mt-2">
                        بالاستمرار، أنت توافق على
                        <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
                            {' '}شروط الخدمة{' '}
                        </Link>
                        الخاصة بنا.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthPage;
