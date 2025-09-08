// src/components/IntroVideo.tsx

import React, { useEffect, useState } from 'react';

// تحديد نوع الخصائص (props) التي سيستقبلها المكوّن
interface IntroVideoProps {
  onVideoEnd: () => void; // دالة تُشغّل بعد انتهاء الفيديو
}

const IntroVideo: React.FC<IntroVideoProps> = ({ onVideoEnd }) => {
  // حالة (state) لتتبّع ما إذا كان الفيديو يُعرض أم لا
  const [showVideo, setShowVideo] = useState(true);

  // استخدام useEffect لتشغيل عدّاد زمني (timer)
  useEffect(() => {
    // تشغيل العداد ليخفي الفيديو بعد 8000 مللي ثانية (8 ثواني)
    const timer = setTimeout(() => {
      setShowVideo(false);
      onVideoEnd(); // تشغيل الدالة التي تُخفي الفيديو من الصفحة الرئيسية
    }, 8000);

    // دالة تنظيف (cleanup) لتجنب حدوث أخطاء إذا تم حذف المكوّن قبل انتهاء العداد
    return () => clearTimeout(timer);
  }, [onVideoEnd]); // يتم تشغيل useEffect مرة واحدة عند تحميل المكوّن

  // إذا كانت showVideo غير صحيحة (false)، لا تُعرض شيئاً
  if (!showVideo) {
    return null;
  }

  return (
    // هنا نُنشئ عنصر الفيديو
    <div className="video-container">
      <video
        autoPlay // لتشغيل الفيديو تلقائياً
        muted // لتشغيل الفيديو بدون صوت (عادةً ما تتطلبه المتصفحات لتشغيل الفيديو تلقائياً)
        className="intro-video" // فئة (class) للتنسيق
      >
        {/*
          قم بتغيير المسار التالي إلى مسار الفيديو الخاص بك
          يجب أن يكون الفيديو موجوداً في مجلد 'public'
        */}
        <source src="/your-video-name.mp4" type="video/mp4" />
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
    </div>
  );
};

export default IntroVideo;
