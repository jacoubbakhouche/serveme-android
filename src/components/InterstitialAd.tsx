// src/components/InterstitialAd.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';

// ✨ تعريف نوع بيانات الإعلان
type Ad = Tables<'ads'>;

const fetchRandomActiveAd = async (): Promise<Ad | null> => {
  // جلب إعلان عشوائي نشط
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching ads:", error.message);
    return null;
  }
  return data?.[0] || null;
};

interface InterstitialAdProps {
  // دالة لتغيير حالة الإعلان (إظهاره/إخفاؤه)
  onClose: () => void;
}

const InterstitialAd: React.FC<InterstitialAdProps> = ({ onClose }) => {
  const [showCloseButton, setShowCloseButton] = useState(false);

  // ✨ جلب إعلان عشوائي عند تحميل المكون
  const { data: ad, isLoading, error } = useQuery({
    queryKey: ['random-ad'],
    queryFn: fetchRandomActiveAd,
    staleTime: Infinity, // لا يتم تحديثه تلقائياً
  });

  useEffect(() => {
    // إذا كان الإعلان موجودًا، قم ببدء المؤقت
    if (ad) {
      const timer = setTimeout(() => {
        setShowCloseButton(true);
      }, 5000); // 5000 مللي ثانية = 5 ثواني
      
      // دالة التنظيف
      return () => clearTimeout(timer);
    }
  }, [ad]);

  // حالة التحميل أو عدم وجود إعلان
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/90 z-[100] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  // إذا كان لا يوجد إعلان نشط
  if (error || !ad) {
    // يمكنك استدعاء onClose لإخفاء المكون فورًا إذا لم يتم العثور على إعلان
    return null;
  }

  return (
    // الخلفية التي تغطي كامل الشاشة
    <div className="fixed inset-0 bg-background/90 z-[100] flex justify-center items-center p-4">
      
      {/* ✨ زر الإغلاق الذي يظهر بعد 5 ثوانٍ */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 transition-opacity duration-300 ${
          showCloseButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <X className="w-6 h-6" />
      </button>

      {/* ✨ حاوية الإعلان */}
      <a href={ad.target_url || '#'} target="_blank" rel="noopener noreferrer" onClick={onClose} className="block max-w-lg w-full max-h-[90vh] overflow-hidden rounded-lg shadow-2xl">
        {ad.media_type === 'image' ? (
          <img src={ad.media_url || ''} alt={ad.title || 'Ad Image'} className="w-full h-auto object-contain" />
        ) : (
          <video src={ad.media_url || ''} className="w-full h-auto object-contain" controls muted autoPlay playsInline loop />
        )}
      </a>
    </div>
  );
};

export default InterstitialAd;
