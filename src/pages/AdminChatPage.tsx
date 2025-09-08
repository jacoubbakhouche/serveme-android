// src/pages/AdminChatPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
// ✨ CORRECTION: Remove the direct import of Layout
// import Layout from '@/components/Layout'; 
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MessageCircle, BadgeCheck, Calendar as CalendarIcon, Crown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

interface CustomerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_provider: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  user: { email: string | undefined } | null;
  unread_count?: number;
}

const statusColors: Record<SubscriptionStatus, string> = {
  active: "bg-green-500 hover:bg-green-600",
  expired: "bg-red-500 hover:bg-red-600", 
  pending_payment: "bg-yellow-500 hover:bg-yellow-600",
  cancelled: "bg-gray-500 hover:bg-gray-600",
  free: "bg-blue-500 hover:bg-blue-600",
};

const statusTranslations: Record<SubscriptionStatus, string> = {
  active: "نشط",
  expired: "منتهي الصلاحية",
  pending_payment: "بانتظار الدفع", 
  cancelled: "ملغي",
  free: "مجاني",
};

const AdminChatPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [subscriptionDate, setSubscriptionDate] = useState<Date | undefined>(undefined);
  const [subscriptionDuration, setSubscriptionDuration] = useState<string>('30');

  // Query customers with conversations
  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          is_verified,
          is_provider,
          subscription_status,
          subscription_expires_at
        `)
        .order('full_name');

      if (searchQuery.trim()) {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(p => ({
        ...p, 
        user: { email: 'لا يوجد بريد إلكتروني' }
      })) as CustomerProfile[];
    },
    enabled: isAdmin,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: {
        is_verified?: boolean;
        is_provider?: boolean;
        subscription_status?: SubscriptionStatus;
        subscription_expires_at?: string | null;
      }
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      toast({
        title: "نجاح",
        description: "تم تحديث بيانات العميل بنجاح.",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuickAction = (customer: CustomerProfile, action: string) => {
    const updates: any = {};
    
    switch (action) {
      case 'verify':
        updates.is_verified = true;
        break;
      case 'activate_provider':
        updates.is_provider = true;
        updates.subscription_status = 'active';
        updates.subscription_expires_at = addDays(new Date(), 30).toISOString();
        break;
      case 'activate_30':
        updates.subscription_status = 'active';
        updates.subscription_expires_at = addDays(new Date(), 30).toISOString();
        break;
      case 'activate_90':
        updates.subscription_status = 'active';
        updates.subscription_expires_at = addDays(new Date(), 90).toISOString();
        break;
    }

    updateProfileMutation.mutate({ id: customer.id, updates });
  };

  const handleCustomSubscription = () => {
    if (!selectedCustomer || !subscriptionDate) return;

    const updates = {
      subscription_status: 'active' as SubscriptionStatus,
      subscription_expires_at: subscriptionDate.toISOString(),
    };

    updateProfileMutation.mutate({ id: selectedCustomer.id, updates });
    setSelectedCustomer(null);
    setSubscriptionDate(undefined);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">وصول مرفوض</h1>
        <p className="text-muted-foreground mb-6">ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة.</p>
        <Button asChild>
          <Link to="/">العودة للصفحة الرئيسية</Link>
        </Button>
      </div>
    );
  }
  // ✨ التعديل: إزالة <Layout> وترك المحتوى مباشرة
  return (
    <>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">الدردشة مع العملاء</h1>
        </div>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        {/* Customers List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-4">
            {customers?.map((customer) => (
              <Card key={customer.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={customer.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                          {customer.full_name?.charAt(0) || 'ع'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{customer.full_name || 'بلا اسم'}</h3>
                          {customer.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          )}
                          {customer.is_provider && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {customer.user?.email || 'لا يوجد بريد إلكتروني'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-white text-xs", statusColors[customer.subscription_status])}>
                            {statusTranslations[customer.subscription_status]}
                          </Badge>
                          {customer.subscription_expires_at && (
                            <span className="text-xs text-muted-foreground">
                              ينتهي: {format(new Date(customer.subscription_expires_at), 'yyyy-MM-dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick Actions */}
                       <Button 
                         size="sm" 
                         variant={customer.is_verified ? "default" : "outline"}
                         onClick={() => handleQuickAction(customer, 'verify')}
                         disabled={updateProfileMutation.isPending}
                       >
                         <BadgeCheck className="w-3 h-3 ml-1" />
                         {customer.is_verified ? 'موثق' : 'توثيق'}
                       </Button>

                       <Button asChild size="sm" className="btn-gradient">
                         <Link to={`/chat/${customer.id}`}>
                           <MessageCircle className="w-3 h-3 ml-1" />
                           دردشة
                         </Link>
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminChatPage;
