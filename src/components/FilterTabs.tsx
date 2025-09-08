// src/components/FilterTabs.tsx

import React, { useRef, useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface FilterTabsProps {
  items: string[];
  selectedItem: string;
  onItemSelect: (item: string) => void;
  title: string;
}

const FilterTabs = ({ items, selectedItem, onItemSelect, title }: FilterTabsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowScrollButtons(scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 150;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      if (direction === 'left') {
        scrollContainerRef.current.scrollTo({ left: currentScroll - scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollTo({ left: currentScroll + scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground mr-2">{title}</h3>
      <div className="relative flex items-center">
        {showScrollButtons && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full p-1 shadow-lg hidden md:flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
        )}

   
        
        
        
        
        
        
        
        <div ref={scrollContainerRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1">
          {items.map((item) => (
            <button

              

              
              key={item}
              onClick={() => onItemSelect(item)} // 👈 يرسل النص كامل مع الإيموجي
              className={`whitespace-nowrap flex-shrink-0 px-7 py-3 text-base rounded-full transition-colors font-medium ${
                selectedItem === item
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-input text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {item} {/* 👈 العرض كما هو مع الإيموجي */}
            </button>





      
          ))}
        </div>

        {showScrollButtons && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full p-1 shadow-lg hidden md:flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterTabs;
