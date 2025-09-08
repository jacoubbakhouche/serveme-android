import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import LoadingSpinner from './LoadingSpinner';
import { GalleryHorizontal } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerDescription
} from "@/components/ui/drawer";
import { Button } from './ui/button';

interface ProviderPortfolioGridProps {
    portfolioItems: Tables<'services'>[];   // ✅ نقرأ من جدول services
    isLoading: boolean;
}

const ProviderPortfolioGrid = ({ portfolioItems, isLoading }: ProviderPortfolioGridProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GalleryHorizontal className="w-5 h-5" />
                    معرض الأعمال
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center"><LoadingSpinner /></div> : (
                    portfolioItems && portfolioItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {portfolioItems.map(item => (
                                item.image_urls?.map((url, index) => (   // ✅ نعرض كل الصور من array
                                    <Drawer key={`${item.id}-${index}`}>
                                        <DrawerTrigger asChild>
                                            <div className="relative group aspect-square cursor-pointer overflow-hidden rounded-lg">
                                                <img 
                                                    src={url} 
                                                    alt={item.description || 'Portfolio item'} 
                                                    className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-white text-center text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <p>عرض الصورة</p>
                                                </div>
                                            </div>
                                        </DrawerTrigger>
                                        <DrawerContent>
                                            <div className="mx-auto w-full max-w-2xl p-4">
                                                <img 
                                                    src={url} 
                                                    alt={item.description || 'Portfolio item'} 
                                                    className="w-full h-auto object-contain rounded-lg max-h-[70vh] mb-4"
                                                />
                                                {item.description && (
                                                    <DrawerDescription className="text-center text-lg">
                                                        {item.description}
                                                    </DrawerDescription>
                                                )}
                                                <DrawerClose asChild>
                                                    <Button variant="outline" className="w-full mt-4">إغلاق</Button>
                                                </DrawerClose>
                                            </div>
                                        </DrawerContent>
                                    </Drawer>
                                ))
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">لا توجد أعمال في المعرض حالياً.</p>
                    )
                )}
            </CardContent>
        </Card>
    );
};

export default ProviderPortfolioGrid;
