// src/pages/HomePage.tsx



import React, { useState, useMemo, useEffect } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { Input } from '@/components/ui/input';

import OptimizedServiceCard from '@/components/OptimizedServiceCard';

import FilterTabs from '@/components/FilterTabs';

import LoadingSpinner from '@/components/LoadingSpinner';

import { Search, ChevronLeft } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { formatDistanceToNow } from 'date-fns';

import { ar } from 'date-fns/locale';

import { Tables } from '@/integrations/supabase/types';

import { algerianStates } from '@/constants/algerian-states';

import { serviceCategories } from '@/constants/service-categories';

import {

  Carousel,

  CarouselContent,

  CarouselItem,

  CarouselNext,

  CarouselPrevious,

} from '@/components/ui/carousel';

// ✨ تم استيراد المكون الجديد هنا

import InterstitialAd from '@/components/InterstitialAd';



type Ad = Tables<'ads'>;



type ServiceWithProfile = Tables<'services'> & {

  profiles: { is_verified: boolean } | null;

};



const fetchServices = async (): Promise<ServiceWithProfile[]> => {

  const isFirstVisit = !sessionStorage.getItem('hasVisited');

  let processedServices: Tables<'services'>[] = [];



  const { data: services, error } = await supabase.from('services').select('*');

  if (error) throw new Error(error.message);

  if (!services) return [];



  if (isFirstVisit) {

    sessionStorage.setItem('hasVisited', 'true');

    processedServices = services.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  } else {

    processedServices = services.sort(() => Math.random() - 0.5);

  }



  const userIds = [...new Set(processedServices.map(service => service.user_id))];

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, is_verified').in('id', userIds);

  if (profilesError) console.error("Error fetching profiles:", profilesError);



  return processedServices.map(service => ({

    ...service,

    profiles: profiles?.find(profile => profile.id === service.user_id) || null

  }));

};



const fetchAds = async (): Promise<Ad[]> => {

  const { data, error } = await supabase

    .from('ads')

    .select('*')

    .eq('is_active', true)

    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data || [];

};



interface GroupedServices {

  [category: string]: ServiceWithProfile[];

}



const HomePage = () => {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get('category');

  const isViewAllMode = !!categoryFromUrl;



  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'الكل');

  const [selectedState, setSelectedState] = useState('كل الولايات');



  // ✨ إضافة حالة جديدة للتحكم في ظهور الإعلان

  const [showInterstitialAd, setShowInterstitialAd] = useState(false);

  

  // حالة لتتبع الفئات المتوسعة (عرض الكل)

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());





  const { data: services, isLoading, error } = useQuery<ServiceWithProfile[]>({

    queryKey: ['services'],

    queryFn: fetchServices,

    staleTime: 60000,

  });



  const { data: ads, isLoading: adsLoading, error: adsError } = useQuery<Ad[]>({

    queryKey: ['ads'],

    queryFn: fetchAds,

    staleTime: 60000,

  });



  useEffect(() => {

    setSelectedCategory(categoryFromUrl || 'الكل');

    

    // ✨ منطق عرض الإعلان عند الزيارة الأولى

    const hasSeenAd = sessionStorage.getItem('hasSeenInterstitialAd');

    if (!hasSeenAd && !isLoading && !adsLoading) {

      setShowInterstitialAd(true);

      sessionStorage.setItem('hasSeenInterstitialAd', 'true');

    }

  }, [categoryFromUrl, isLoading, adsLoading]);

  

  // ✨ دالة لإخفاء الإعلان

  const handleCloseInterstitialAd = () => {

    setShowInterstitialAd(false);

  };



  const categories = ['الكل', ...serviceCategories];

  const states = ['كل الولايات', ...algerianStates];



  const groupedServices = useMemo<GroupedServices>(() => {

    if (!services) return {};

    const filteredServices = services.filter(service => {

      const searchLower = searchTerm.toLowerCase();

      const titleLower = service.title?.toLowerCase() || '';

      const descLower = service.description?.toLowerCase() || '';

      const matchesSearch = titleLower.includes(searchLower) || descLower.includes(searchLower);

      const matchesCategory = selectedCategory === 'الكل' || service.category === selectedCategory;

      const matchesState = selectedState === 'كل الولايات' || service.location?.includes(selectedState);

      return matchesSearch && matchesCategory && matchesState;

    });

    return filteredServices.reduce((acc, service) => {

      const category = service.category || 'غير محدد';

      if (!acc[category]) acc[category] = [];

      acc[category].push(service);

      return acc;

    }, {} as GroupedServices);

  }, [services, searchTerm, selectedCategory, selectedState]);



  const hasResults = useMemo(() => {

    if (selectedCategory === 'الكل') return Object.keys(groupedServices).length > 0;

    return groupedServices[selectedCategory]?.length > 0;

  }, [groupedServices, selectedCategory]);







    

    



 

const handleCategoryClick = (categoryName: string) => {

  navigate(`/?category=${encodeURIComponent(categoryName)}`);

};



const handleViewAllClick = (categoryName: string) => {

  setExpandedCategories(prev => {

    const newSet = new Set(prev);

    if (newSet.has(categoryName)) {

      newSet.delete(categoryName);

    } else {

      newSet.add(categoryName);

    }

    return newSet;

  });

};



const handleResetCategory = () => {

  setSelectedCategory('الكل');

  navigate('/');

};

  

  if (error) return <div className="text-center py-12 text-destructive">حدث خطأ: {error.message}</div>;



  return (

    <div className="space-y-6 pt-4">

      {/* ✨ عرض الإعلان البيني هنا */}

      {showInterstitialAd && ads && ads.length > 0 && <InterstitialAd onClose={handleCloseInterstitialAd} />}

      

      <div className="relative max-w-4xl mx-auto px-4">

        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />

        <Input placeholder="البحث عن الخدمات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground rounded-full shadow-lg" />

      </div>



      {!isViewAllMode && (

        <FilterTabs items={categories} selectedItem={selectedCategory} onItemSelect={setSelectedCategory} title="نوع الخدمة" />

      )}

      <FilterTabs items={states} selectedItem={selectedState} onItemSelect={setSelectedState} title="الولاية" />









      







      {isLoading || adsLoading ? (

        <div className="flex flex-col justify-center items-center pt-12"><LoadingSpinner /><p className="mt-4 text-muted-foreground text-sm">جاري تحميل آخر الخدمات...</p></div>

      ) : (

        <div className="space-y-12 px-4">

          {ads && ads.length > 0 && (

            <div className="bg-card dark:bg-card-dark rounded-lg p-4 shadow-lg overflow-hidden">




              
             
<Carousel opts={{ align: 'start', direction: 'rtl', loop: true, speed: 30 }} className="w-full">





  

                <CarouselContent className="-ml-4">



         

               {ads.map((ad) => (

  ad.media_url && (

    <CarouselItem key={ad.id} className="pl-4 basis-full md:basis-1/2">

      <div className="block relative h-48 rounded-md overflow-hidden">

        {ad.media_type === 'image' ? (

          <img src={ad.media_url} alt={ad.title || ''} className="w-full h-full object-cover" />

        ) : (

          <video src={ad.media_url} className="w-full h-full object-cover" controls muted autoPlay playsInline loop />

        )}

        {ad.target_url && (



        <a 

  href={ad.target_url} 

  target="_blank" 

  rel="noopener noreferrer" 

  className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"

>









                

            تفاصيل الإعلان

          </a>

        )}

      </div>

    </CarouselItem>

  )

))}



                            

                  

                </CarouselContent>

                <CarouselPrevious />

                <CarouselNext />

              </Carousel>

            </div>

          )}





















          





          



          {!isLoading && Object.entries(groupedServices).map(([category, servicesInGroup]) => {

            if (selectedCategory !== 'الكل' && category !== selectedCategory) return null;

            

            const totalServices = servicesInGroup.length;



            if (isViewAllMode) {

              return (

                <div key={category} className="mb-8">

                  <h2 onClick={handleResetCategory} className="text-2xl font-semibold mb-4 cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-2">

                    <ChevronLeft className="w-5 h-5" />

                    <span>{category} ({totalServices} خدمة)</span>

                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                    {servicesInGroup.map(service => (

                      <OptimizedServiceCard key={service.id} {...service} contactNumber={service.contact_number || undefined} timeAgo={formatDistanceToNow(new Date(service.created_at), { addSuffix: true, locale: ar })} is_verified={service.profiles?.is_verified ?? false} />

                    ))}

                  </div>

                </div>

              );

            } else {

              const isExpanded = expandedCategories.has(category);

              

              return (

                <div key={category} className="mb-8">

                  <div className="flex justify-between items-center mb-4">

                    <h2 className="text-2xl font-semibold">{category}</h2>

                    <button 

                      onClick={() => handleViewAllClick(category)}

                      className="text-sm font-normal text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 transition-all"

                    >

                      {isExpanded ? `(إخفاء ${totalServices})` : `(عرض الكل ${totalServices})`}

                    </button>

                  </div>

                  

                  {isExpanded ? (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                      {servicesInGroup.map(service => (

                        <OptimizedServiceCard key={service.id} {...service} contactNumber={service.contact_number || undefined} timeAgo={formatDistanceToNow(new Date(service.created_at), { addSuffix: true, locale: ar })} is_verified={service.profiles?.is_verified ?? false} />

                      ))}

                    </div>

                  ) : (

                    <Carousel opts={{ align: 'start', direction: 'rtl' }} className="w-full">

                      <CarouselContent className="-ml-4">

                        {servicesInGroup.map(service => (

                          <CarouselItem key={service.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">

                            <OptimizedServiceCard {...service} contactNumber={service.contact_number || undefined} timeAgo={formatDistanceToNow(new Date(service.created_at), { addSuffix: true, locale: ar })} is_verified={service.profiles?.is_verified ?? false} />

                          </CarouselItem>

                        ))}

                      </CarouselContent>

                      <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />

                      <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />

                    </Carousel>

                  )}

                </div>

              );

            }

          })}

        </div>

      )}



      {!isLoading && !hasResults && (

        <div className="text-center py-12">

            <div className="text-6xl mb-4">📋🕸️</div>

            <p className="text-muted-foreground text-lg font-medium mb-2">لا توجد خدمات تطابق بحثك</p>

            <p className="text-muted-foreground text-sm mb-6">حاول تغيير كلمات البحث أو الفلاتر</p>

            <button onClick={() => navigate('/add-service')} className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200">

              أضف خدمة جديدة

            </button>

        </div>

      )}

    </div>

  );

};



export default HomePage;
