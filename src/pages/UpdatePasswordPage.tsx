import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UpdatePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // التحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
            toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين.', variant: 'destructive' });
            return;
        }
        // التحقق من طول كلمة المرور
        if (password.length < 6) {
            toast({ title: 'خطأ', description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        // تحديث كلمة المرور للمستخدم في Supabase
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            toast({ title: 'حدث خطأ', description: 'انتهت صلاحية الرابط أو أنه غير صالح. يرجى طلب رابط جديد.', variant: 'destructive' });
        } else {
            toast({ title: 'تم النجاح', description: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' });
            navigate('/auth'); // توجيه المستخدم لصفحة تسجيل الدخول
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background rtl">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">تعيين كلمة مرور جديدة</CardTitle>
                    <CardDescription>أدخل كلمة المرور الجديدة الخاصة بك.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">كلمة المرور الجديدة</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full btn-gradient" disabled={loading}>
                            {loading ? '...جاري التحديث' : 'تحديث كلمة المرور'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdatePasswordPage;
