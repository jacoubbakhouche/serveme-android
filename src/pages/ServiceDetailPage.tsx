import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Phone, MapPin, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

const fetchService = async (serviceId: string) => {
const { data, error } = await supabase
.from('services')
.select('*')
.eq('id', serviceId)
.single();

if (error) throw new Error(error.message);
return data;
};

const fetchProvider = async (providerId: string) => {
const { data, error } = await supabase
.from('profiles')
.select('*')
.eq('id', providerId)
.maybeSingle();

if (error) throw new Error(error.message);
return data;
};

const ServiceDetailPage = () => {
const { id: serviceId } = useParams<{ id: string }>();
const navigate = useNavigate();
const { user } = useAuth();
const [lightboxOpen, setLightboxOpen] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);

const { data: service, isLoading: isLoadingService, error: errorService } = useQuery<Tables<'services'>>({
queryKey: ['service', serviceId],
queryFn: () => fetchService(serviceId!),
enabled: !!serviceId,
});

const { data: provider, isLoading: isLoadingProvider, error: errorProvider } = useQuery<Tables<'profiles'>>({
queryKey: ['provider', service?.user_id],
queryFn: () => fetchProvider(service!.user_id),
enabled: !!service?.user_id,
});

const isLoading = isLoadingService || isLoadingProvider;
const error = errorService || errorProvider;

if (isLoading) {
return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
}

if (error) {
return (
<div className="flex flex-col justify-center items-center h-screen text-center rtl">
<p className="text-destructive mb-4">{(error as Error).message}</p>
<Button onClick={() => navigate(-1)}>العودة</Button>
</div>
);
}
if (!service || !provider) {
return (
<div className="flex flex-col justify-center items-center h-screen text-center rtl">
<p className="text-muted-foreground mb-4">لم يتم العثور على الخدمة المطلوبة.</p>
<Button onClick={() => navigate('/')}>العودة إلى الصفحة الرئيسية</Button>
</div>
);
}

const isOwner = user?.id === service.user_id;

const openLightbox = (index: number) => {
setCurrentImageIndex(index);
setLightboxOpen(true);
};

const nextImage = () => {
if (service?.image_urls) {
setCurrentImageIndex((prev) => (prev + 1) % service.image_urls.length);
}
};

const prevImage = () => {
if (service?.image_urls) {
setCurrentImageIndex((prev) => (prev - 1 + service.image_urls.length) % service.image_urls.length);
}
};

return (
<div className="bg-background min-h-screen rtl">
<header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-between p-4 border-b">
<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
<ArrowRight className="h-5 w-5" />
</Button>
<h1 className="text-lg font-semibold">تفاصيل الخدمة</h1>
<div className="w-10"></div> {/* Spacer */}
</header>

<main className="pb-24">
{service.image_urls && service.image_urls.length > 0 ? (
<div className="space-y-4 pt-4">
{/* ## الخطوة 1: عارض الصور الرئيسي الجديد ## */}
{/* يعرض هذا القسم الصورة الكبيرة بناءً على `currentImageIndex` */}
<div className="relative cursor-pointer group px-4" onClick={() => openLightbox(currentImageIndex)}>
<img
src={service.image_urls[currentImageIndex]}
alt={`${service.title} - image ${currentImageIndex + 1}`}
className="w-full h-64 object-cover rounded-lg transition-transform group-hover:scale-105"
loading="lazy"
/>
<div className="absolute inset-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
<div className="text-white text-sm bg-black/60 px-3 py-1 rounded-full">
اضغط للتكبير
</div>
</div>
</div>
{/* ## الخطوة 2: تحديث منطق الصور المصغرة ## */}
{service.image_urls.length > 1 && (
<div className="grid grid-cols-4 gap-2 px-4">
{service.image_urls.map((url, index) => (
<div
key={index}
// عند النقر، نقوم بتحديث `currentImageIndex` فقط
onClick={() => setCurrentImageIndex(index)}
className="relative cursor-pointer group"
>
<img
src={url}
alt={`${service.title} - thumbnail ${index + 1}`}
// يتم تغيير لون الإطار بناءً على الصورة النشطة
className={`w-full h-16 object-cover rounded-lg border-2 transition-colors ${
currentImageIndex === index ? 'border-primary' : 'border-transparent'
}`}
loading="lazy"
/>
</div>
))}
</div>
)}
</div>
) : (
<div className="w-full h-64 bg-muted flex items-center justify-center rounded-lg">
<p className="text-muted-foreground">لا توجد صور</p>
</div>
)}

<div className="p-6 space-y-6">
<div>
<div className="flex justify-between items-center">
<Badge variant="secondary">{service.category}</Badge>
{service.is_urgent && <Badge variant="destructive">عاجل</Badge>}
</div>
<h2 className="text-2xl font-bold mt-2">{service.title}</h2>
</div>
<div className="flex items-center text-muted-foreground">
<MapPin className="w-4 h-4 ml-2" />
<span>{service.location}</span>
</div>

<div>
<h3 className="text-lg font-semibold mb-2">الوصف</h3>
<p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
</div>

<div className="border-t pt-6">
<h3 className="text-lg font-semibold mb-4">مقدم الخدمة</h3>
<a
href={service.contact_number ? `tel:${service.contact_number}` : '#'}
className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
>
<div className="flex items-center gap-4">
<Avatar>
<AvatarImage src={provider.avatar_url || undefined} alt={provider.full_name || 'Provider'} />
<AvatarFallback>{provider.full_name?.charAt(0)}</AvatarFallback>
</Avatar>
<div>
<p className="font-semibold">{provider.full_name}</p>
{service.contact_number && (
<div className="flex items-center text-sm text-muted-foreground mt-1">
<Phone className="w-3 h-3 ml-2" />
<span>{service.contact_number}</span>
</div>
)}
</div>
</div>
<Phone className="w-5 h-5 text-muted-foreground" />
</a>
</div>
</div>
</main>

<footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
<div className="max-w-4xl mx-auto">
{!isOwner && (
<Button asChild className="w-full" size="lg">
<Link to={`/chat/${provider.id}`}>
<MessageSquare className="w-5 h-5 ml-2" />
مراسلة مقدم الخدمة
</Link>
</Button>
)}
</div>
</footer>

{/* Lightbox Modal (لا تغييرات هنا) */}
<Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
<DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95 border-none">
<div className="relative w-full h-full flex items-center justify-center">
<Button
variant="ghost"
size="icon"
className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
onClick={() => setLightboxOpen(false)}
>
<X className="h-6 w-6" />
</Button>

{service?.image_urls && service.image_urls.length > 1 && (
<>
<Button
variant="ghost"
size="icon"
className="absolute left-4 z-50 text-white hover:bg-white/20"
onClick={prevImage}
>
<ChevronLeft className="h-8 w-8" />
</Button>
<Button
variant="ghost"
size="icon"
className="absolute right-4 z-50 text-white hover:bg-white/20"
onClick={nextImage}
>
<ChevronRightIcon className="h-8 w-8" />
</Button>
</>
)}

{service?.image_urls && (
<img
src={service.image_urls[currentImageIndex]}
alt={`${service.title} - image ${currentImageIndex + 1}`}
className="max-w-full max-h-full object-contain"
/>
)}

{service?.image_urls && service.image_urls.length > 1 && (
<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
{currentImageIndex + 1} / {service.image_urls.length}
</div>
)}
</div>
</DialogContent>
</Dialog>
</div>
);
};

export default ServiceDetailPage;


