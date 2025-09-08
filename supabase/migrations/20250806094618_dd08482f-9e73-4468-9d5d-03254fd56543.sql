-- إنشاء سياسة جديدة للمشرفين لإدارة ملفات المستخدمين
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (is_admin()) 
WITH CHECK (is_admin());