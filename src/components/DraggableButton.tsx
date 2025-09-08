import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DraggableButton = () => {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // State لتتبع حالة السحب ونقطة البداية
  const dragInfo = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    // لتفريق السحب عن النقر
    hasDragged: false, 
  });

  // --- دوال التعامل مع الفأرة (للكمبيوتر) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    dragInfo.current.isDragging = true;
    dragInfo.current.hasDragged = false; // إعادة تعيين حالة السحب
    if (buttonRef.current) {
      dragInfo.current.offsetX = e.clientX - buttonRef.current.getBoundingClientRect().left;
      dragInfo.current.offsetY = e.clientY - buttonRef.current.getBoundingClientRect().top;
    }
  };

  // --- دوال التعامل مع اللمس (للهاتف) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    dragInfo.current.isDragging = true;
    dragInfo.current.hasDragged = false;
    if (buttonRef.current) {
      const touch = e.touches[0];
      dragInfo.current.offsetX = touch.clientX - buttonRef.current.getBoundingClientRect().left;
      dragInfo.current.offsetY = touch.clientY - buttonRef.current.getBoundingClientRect().top;
    }
  };

  // --- دالة موحدة لتحريك الزر (تعمل مع الفأرة واللمس) ---
  const handleMove = (clientX: number, clientY: number) => {
    if (!dragInfo.current.isDragging || !buttonRef.current) return;
    
    dragInfo.current.hasDragged = true; // تم اعتبارها عملية سحب

    const newX = clientX - dragInfo.current.offsetX;
    const newY = clientY - dragInfo.current.offsetY;

    // منع الزر من الخروج عن الشاشة
    const maxX = window.innerWidth - buttonRef.current.offsetWidth;
    const maxY = window.innerHeight - buttonRef.current.offsetHeight;

    buttonRef.current.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
    buttonRef.current.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
  };
  
  // --- ربط الدالة الموحدة بأحداث الفأرة واللمس ---
  const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  
  // --- دالة إيقاف السحب (تعمل مع الفأرة واللمس) ---
  const stopDragging = () => {
    dragInfo.current.isDragging = false;
  };

  // --- ربط وفصل الأحداث العامة ---
  useEffect(() => {
    // أحداث الفأرة
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    // أحداث اللمس
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stopDragging);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDragging);
    };
  }, []);

  // --- دالة النقر ---
  const handleClick = () => {
    // لا تنفذ النقر إذا كان المستخدم يقوم بالسحب
    if (dragInfo.current.hasDragged) {
      return;
    }
    navigate('/add-service'); // <-- تأكد من صحة هذا الرابط
  };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-50 cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }} // لمنع تمرير الصفحة أثناء السحب
    >
      <Plus size={28} />
    </button>
  );
};

export default DraggableButton;
