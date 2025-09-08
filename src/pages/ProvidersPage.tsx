// src/pages/ProvidersPage.tsx

import React, { useState, useMemo, useEffect } from 'react';
// ✨ تمت إضافة أدوات التنقل هنا
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft } from 'lucide-react'; // ✨ تمت إضافة أيقونة
import LoadingSpinner from '@/components/LoadingSpinner';
import ProviderCard from '@/components/ProviderCard';
import FilterTabs from '@/components/FilterTabs';
import { serviceCategories } from '@/constants/service-categories';
import { algerianStates } from '@/constants/algerian-states';
import { Tables } from '@/integrations/supabase/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface GroupedProviders {
  [category: string]: Tables<'profiles'>[];
}

const fetchProviders = async (): Promise<Tables<'profiles'>[]> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('is_provider', true);
  if (error) {
    console.error("Error fetching providers:", error);
    throw new Error(error.message);
  }
  return data || [];
};

const ProvidersPage = () => {
  // ✨ تمت إضافة أدوات التنقل ومتغير الحالة
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const isViewAllMode = !!categoryFromUrl;

  const [searchTerm, setSearchTerm] = useState('');
  // ✨ الحالة الآن تقرأ من الرابط أولاً
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'الكل');
  const [selectedState, setSelectedState] = useState('كل الولايات');

  const { data: providers, isLoading, error } = useQuery<Tables<'profiles'>[]>({
    queryKey: ['providers'],
    queryFn: fetchProviders,
  });

  // ✨ هذا التأثير يجعل الفلتر يستجيب دائمًا للرابط
  useEffect(() => {
    setSelectedCategory(categoryFromUrl || 'الكل');
  }, [categoryFromUrl]);

  const categories = ['الكل', ...serviceCategories];
  const states = ['كل الولايات', ...algerianStates];

  const groupedProviders = useMemo<GroupedProviders>(() => {
    if (!providers) return {};
    const filteredProviders = providers.filter(provider => {
      const matchesState = selectedState === 'كل الولايات' || provider.location === selectedState;
      const matchesSearch = provider.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesState && matchesSearch;
    });
    return filteredProviders.reduce((acc, provider) => {
      const category = provider.provider_category || 'غير محدد';
      if (!acc[category]) acc[category] = [];
      acc[category].push(provider);
      return acc;
    }, {} as GroupedProviders);
  }, [providers, searchTerm, selectedState]);

  const hasResults = useMemo(() => {
    if (selectedCategory === 'الكل') return Object.keys(groupedProviders).length > 0;
    return groupedProviders[selectedCategory]?.length > 0;
  }, [groupedProviders, selectedCategory]);
  
  // ✨ دوال جديدة للتحكم في التنقل
  const handleCategoryClick = (categoryName: string) => {
    navigate(`/providers?category=${encodeURIComponent(categoryName)}`);
  };

  const handleResetCategory = () => {
    navigate('/providers');
  };

  if (error) {
    return <div className="text-center py-12 text-destructive">حدث خطأ: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="البحث عن مزود خدمة بالاسم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10 bg-input border-border rounded-full shadow-lg"
        />
      </div>

      {!isViewAllMode && (
        <FilterTabs items={categories} selectedItem={selectedCategory} onItemSelect={setSelectedCategory} title="التخصص" />
      )}
      <FilterTabs items={states} selectedItem={selectedState} onItemSelect={setSelectedState} title="الولاية" />

      {isLoading && <div className="flex justify-center pt-12"><LoadingSpinner /></div>}

      <div className="space-y-12">
        {!isLoading && Object.entries(groupedProviders).map(([category, providersInGroup]) => {
          if (selectedCategory !== 'الكل' && category !== selectedCategory) {
            return null;
          }
          const totalProviders = providersInGroup.length;

          if (isViewAllMode) {
            // ===============================================================
            //   الحالة 1: صفحة "عرض الكل" (عرض كشبكة Grid بدون كاروسيل)
            // ===============================================================
            return (
              <div key={category} className="mb-8">
                <h2 
                  onClick={handleResetCategory}
                  className="text-2xl font-semibold mb-4 cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>{category} ({totalProviders} نتيجة)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {providersInGroup.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              </div>
            );

          } else {
            // ===============================================================
            //   الحالة 2: الصفحة الرئيسية (عرض كـ Carousel)
            // ===============================================================
            return (
              <div key={category} className="mb-8">
                {totalProviders > 0 ? (
                  <h2 
                    onClick={() => handleCategoryClick(category)}
                    className="text-2xl font-semibold mb-4 cursor-pointer hover:text-primary transition-colors flex justify-between items-center"
                  >
                    <span>{category}</span>
                    <span className="text-sm font-normal text-primary hover:underline">
                      (عرض الكل {totalProviders})
                    </span>
                  </h2>
                ) : (
                  <h2 className="text-2xl font-semibold mb-4">{category}</h2>
                )}
                
                <Carousel opts={{ align: 'start', direction: 'rtl' }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {providersInGroup.map((provider) => (
                      <CarouselItem key={provider.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3">
                        <ProviderCard provider={provider} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />
                  <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />
                </Carousel>
              </div>
            );
          }
        })}
      </div>

      {!isLoading && !hasResults && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤷‍♂️</div>
          <p className="text-muted-foreground text-lg font-medium">لا يوجد مزودو خدمات يطابقون بحثك</p>
        </div>
      )}
    </div>
  );
};

export default ProvidersPage;
