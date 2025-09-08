
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]} mb-3`}></div>
      <p className="text-muted-foreground text-sm">جاري التحقق من الحساب...</p>
    </div>
  );
};

export default LoadingSpinner;
