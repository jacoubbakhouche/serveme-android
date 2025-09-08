// src/components/ContactSupportButton.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// أيقونة واتساب بسيطة بصيغة SVG
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="ml-2 h-5 w-5"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-1.011z" />
  </svg>
);

const ContactSupportButton = () => {
  // ✅ التعديل الأول: جلب 'profile' بالإضافة إلى 'user'
  const { user, profile } = useAuth();

  // 🛑 هام: استبدل هذا الرقم برقم الدعم الخاص بك
  const supportPhoneNumber = '213562408507'; 
  
  // ✅ التعديل الثاني: استخدام اسم المستخدم في الرسالة
  // أضفنا البريد الإلكتروني كخيار احتياطي في حال لم يكن الاسم موجودًا
  const userName = profile?.full_name || user?.email || 'زائر';
  const defaultMessage = `مرحبا، فريق دعم Serve Me. أحتاج مساعدة.\n(اسم المستخدم: ${userName})`;
  
  // نقوم بترميز الرسالة لتكون صالحة في الرابط
  const encodedMessage = encodeURIComponent(defaultMessage);

  const whatsappUrl = `https://wa.me/${supportPhoneNumber}?text=${encodedMessage}`;

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold">
        تواصل مع الدعم عبر واتساب
        <WhatsAppIcon />
      </Button>
    </a>
  );
};

export default ContactSupportButton;
