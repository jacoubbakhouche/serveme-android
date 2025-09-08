import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

// أيقونة جوجل
const GoogleIcon = () => (
    <svg className="ml-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.82 1.9-5.78 0-10.47-4.88-10.47-10.92S6.7 1.08 12.48 1.08c3.24 0 5.4 1.35 6.67 2.53l-2.52 2.34c-.82-.76-2.04-1.35-4.15-1.35-4.82 0-8.72 3.9-8.72 8.72s3.9 8.72 8.72 8.72c5.33 0 8.14-3.83 8.4-7.42h-8.4v-3.28z"/>
    </svg>
);

const validatePassword = (password: string) => {
    const errors: string[] = [];
    if (password.length < 6) {
        errors.push("6 أحرف على الأقل.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("حرف إنجليزي صغير (a-z) على الأقل.");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("حرف إنجليزي كبير (A-Z) على الأقل.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("رقم (0-9) على الأقل.");
    }
    return errors;
};

const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [resetEmail, setResetEmail] = useState('');
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    
    // --- بداية التعديل 1: إضافة حالة جديدة لتتبع أخطاء كلمة المرور في الوقت الفعلي ---
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        // التحقق من كلمة المرور وعرض الإرشادات فقط إذا كان الحقل غير فارغ
        if (newPassword.length > 0) {
            setPasswordErrors(validatePassword(newPassword));
        } else {
            // إخفاء الإرشادات إذا قام المستخدم بمسح الحقل
            setPasswordErrors([]);
        }
    };
    // --- نهاية التعديل 1 ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast({ title: 'خطأ في تسجيل الدخول', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'تم تسجيل الدخول بنجاح', description: 'أهلاً بك مجدداً!' });
            navigate('/');
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            toast({
                title: 'مطلوب الموافقة على الشروط',
                description: 'يجب عليك الموافقة على الشروط والأحكام أولاً.',
                variant: 'destructive',
            });
            return;
        }

        // التحقق النهائي عند الإرسال لا يزال مهماً
        const finalPasswordErrors = validatePassword(password);
        if (finalPasswordErrors.length > 0) {
            toast({
                title: 'كلمة المرور لا تفي بالشروط',
                description: "يرجى التأكد من أن كلمة المرور تستوفي جميع الشروط الموضحة.",
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (error) {
            toast({ title: 'خطأ في التسجيل', description: error.message, variant: 'destructive' });
        } else if (data.user) {
            toast({ title: 'تم إنشاء الحساب بنجاح', description: 'أهلاً بك في Serve Me!' });
            navigate('/');
        }
        setLoading(false);
    };
    
    // ... (بقية الدوال تبقى كما هي)
    const handlePasswordReset = async () => {
        if (!resetEmail) {
            toast({ title: 'خطأ', description: 'يرجى إدخال البريد الإلكتروني.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        setLoading(false);
        setIsResetDialogOpen(false);

        if (error) {
            toast({ title: 'حدث خطأ', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'تم إرسال الرابط', description: 'إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.' });
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
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
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">Serve Me</CardTitle>
                    <CardDescription>
                        سجل الدخول أو أنشئ حسابًا جديدًا للوصول إلى الخدمات
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                            <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                        </TabsList>
                        <TabsContent value="login">
                           {/* ... نموذج تسجيل الدخول يبقى كما هو ... */}
                           <form onSubmit={handleLogin} className="space-y-4 pt-4">
                               <div className="space-y-2">
                                   <Label htmlFor="login-email">البريد الإلكتروني</Label>
                                   <Input id="login-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="login-password">كلمة المرور</Label>
                                   <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                               </div>
                               <div className="text-right">
                                   <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                       <DialogTrigger asChild>
                                           <Button variant="link" type="button" className="p-0 h-auto text-xs">نسيت كلمة المرور؟</Button>
                                       </DialogTrigger>
                                       <DialogContent className="sm:max-w-[425px]">
                                           <DialogHeader>
                                               <DialogTitle>استعادة كلمة المرور</DialogTitle>
                                               <DialogDescription>
                                                   أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة مرورك.
                                               </DialogDescription>
                                           </DialogHeader>
                                           <div className="grid gap-4 py-4">
                                               <div className="space-y-2">
                                                   <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                                                   <Input
                                                       id="reset-email"
                                                       type="email"
                                                       value={resetEmail}
                                                       onChange={(e) => setResetEmail(e.target.value)}
                                                       placeholder="email@example.com"
                                                   />
                                               </div>
                                           </div>
                                           <DialogFooter>
                                               <Button variant="ghost" onClick={() => setIsResetDialogOpen(false)}>إلغاء</Button>
                                               <Button onClick={handlePasswordReset} disabled={loading}>
                                                   {loading ? '...جاري الإرسال' : 'إرسال رابط الاستعادة'}
                                               </Button>
                                           </DialogFooter>
                                       </DialogContent>
                                   </Dialog>
                               </div>
                               <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                                   {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                               </Button>
                           </form>
                        </TabsContent>
                        <TabsContent value="signup">
                            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-name">الاسم الكامل</Label>
                                    <Input id="signup-name" type="text" placeholder="محمد أحمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                                    <Input id="signup-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">كلمة المرور</Label>
                                    {/* --- بداية التعديل 2: ربط دالة التحقق بحقل الإدخال --- */}
                                    <Input 
                                        id="signup-password" 
                                        type="password" 
                                        value={password} 
                                        onChange={handlePasswordChange} 
                                        required 
                                    />
                                    {/* --- نهاية التعديل 2 --- */}
                                    
                                    {/* --- بداية التعديل 3: إضافة عرض الإرشادات تحت الحقل مباشرة --- */}
                                    {password.length > 0 && passwordErrors.length > 0 && (
                                        <div className="p-2 text-xs text-muted-foreground bg-secondary/30 rounded-md">
                                            <ul className="space-y-1">
                                                {passwordErrors.map((error, index) => (
                                                    <li key={index}>- {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* --- نهاية التعديل 3 --- */}
                                </div>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <Checkbox
                                        id="terms"
                                        checked={agreedToTerms}
                                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                                    />
                                    <Label htmlFor="terms" className="text-sm font-medium leading-none">
                                        أوافق على <Link to="/terms" className="underline text-primary hover:text-primary/80">الشروط والأحكام</Link>
                                    </Label>
                                </div>
                                <Button type="submit" className="w-full btn-gradient" disabled={loading || !agreedToTerms}>
                                    {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                   
                   {/* ... بقية الواجهة الرسومية تبقى كما هي ... */}
                   <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">أو أكمل باستخدام</span>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        التسجيل عبر جوجل
                        <GoogleIcon />
                    </Button>

                    <p className="px-8 text-center text-xs text-muted-foreground mt-4">
                        بالاستمرار، أنت توافق على
                        <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
                            شروط الخدمة
                        </Link>
                         الخاصة بنا.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuthPage;
