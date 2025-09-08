import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

const AdminLink = () => {
  const { isAdmin, loading } = useAuth();

  // لو لسه جاري التحميل، نرجّع null أو Spinner بسيط
  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        جاري التحقق من صلاحياتك...
      </div>
    );
  }

  // لو مش أدمين، ما نظهر الرابط
  if (!isAdmin) {
    return null;
  }

  // لو أدمين، نظهر الرابط
  return (
    <div className="p-4">
      <Button asChild variant="outline" className="w-full justify-start">
        <Link to="/admin">
          <ShieldCheck className="me-2 h-4 w-4" />
          لوحة تحكم المشرف
        </Link>
      </Button>
    </div>
  );
};

export default AdminLink;


