import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Calendar as CalendarIcon, Search, Users, CheckCircle, UserCheck, Settings, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { MessageCircle } from 'lucide-react';

type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

type ProviderProfile = {
  id: string;
  full_name: string | null;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  user: { email: string | undefined } | null;
};

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

interface CustomerProfile extends ProviderProfile {
  is_provider: boolean;
  user: { email: string | undefined } | null;
}

const AdminPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'providers' | 'customers'>('providers');

  // Query for premium mode setting
  const { data: premiumMode } = useQuery({
    queryKey: ['app-settings', 'premium_mode_enabled'],
    queryFn: async () => {
      // Handle expired subscriptions first
      await supabase.rpc('handle_expired_subscriptions');
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'premium_mode_enabled')
        .single();
      
      if (error) return { setting_value: false };
      return data;
    },
    enabled: isAdmin,
  });

  const isPremiumModeEnabled = premiumMode?.setting_value === true;

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['providers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          is_verified,
          subscription_status,
          subscription_expires_at,
          is_provider
        `)
        .order('full_name');

      if (searchQuery.trim()) {
        query = query.ilike('full_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      
      return data.map(p => ({
        ...p,
        user: { email: 'لا يوجد بريد إلكتروني' }
      })) as ProviderProfile[];
    },
    enabled: isAdmin,
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
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
      if (error) throw new Error(error.message);
      
      return data.map(p => ({
        ...p,
        user: { email: 'لا يوجد بريد إلكتروني' }
      })) as CustomerProfile[];
    },
    enabled: isAdmin,
  });

  const verificationMutation = useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "نجاح",
        description: "تم تحديث حالة التوثيق بنجاح.",
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

  const subscriptionMutation = useMutation({
    mutationFn: async ({ id, status, expiresAt }: { id: string; status: SubscriptionStatus; expiresAt: Date | undefined }) => {
      const updates: any = { 
        subscription_status: status, 
        subscription_expires_at: expiresAt ? expiresAt.toISOString() : null 
      };
      
      // If activating subscription, also make sure user is a provider
      if (status === 'active') {
        updates.is_provider = true;
      } else if (status === 'expired') {
        updates.is_provider = false;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({
        title: "نجاح",
        description: "تم تحديث حالة الاشتراك بنجاح.",
      });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const premiumModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      // Update app settings
      const { error: settingsError } = await supabase
        .from('app_settings')
        .update({ setting_value: enabled })
        .eq('setting_key', 'premium_mode_enabled');
      
      if (settingsError) throw new Error(settingsError.message);

      if (enabled) {
        // If enabling premium mode, deactivate all non-active providers
        await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'expired',
            is_provider: false 
          })
          .eq('is_provider', true)
          .neq('subscription_status', 'active');
      } else {
        // If disabling premium mode, reactivate all providers who were deactivated
        await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'free',
            is_provider: true 
          })
          .eq('subscription_status', 'expired')
          .eq('is_provider', false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "نجاح",
        description: "تم تحديث وضع الدفع بنجاح.",
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

  // Verification toggle mutation
  const verifyToggleMutation = useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "نجاح",
        description: "تم تحديث حالة التوثيق بنجاح.",
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

  // Provider activation mutation
  const providerActivationMutation = useMutation({
    mutationFn: async ({ id, activate, expiresAt }: { id: string; activate: boolean; expiresAt?: Date }) => {
      const updates: any = {
        is_provider: activate,
        subscription_status: activate ? 'active' : 'free',
        subscription_expires_at: activate && expiresAt ? expiresAt.toISOString() : null
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "نجاح",
        description: "تم تحديث حالة مزود الخدمات بنجاح.",
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

  const handleManageClick = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
    setNewExpiryDate(provider.subscription_expires_at ? new Date(provider.subscription_expires_at) : undefined);
    setIsModalOpen(true);
  };

  const handleActivateSubscription = () => {
    if (selectedProvider && newExpiryDate) {
      subscriptionMutation.mutate({
        id: selectedProvider.id,
        status: 'active',
        expiresAt: newExpiryDate,
      });
    }
  };

  const handleDeactivateSubscription = () => {
    if (selectedProvider) {
      subscriptionMutation.mutate({
        id: selectedProvider.id,
        status: 'expired',
        expiresAt: undefined,
      });
    }
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

  return (
    // ==================== بداية التعديل ====================
    // أضفنا هذا القوس في الأعلى
    <>
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">لوحة تحكم المشرف</h1>
          </div>
          <Button asChild className="btn-gradient">
            <Link to="/admin/chat">
              <MessageCircle className="ml-2 h-4 w-4" />
              الدردشة مع العملاء
            </Link>
          </Button>
        </div>

        {/* Premium Mode Settings */}
        <div className="dark-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">إعدادات التطبيق</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">وضع الدفع (Premium Mode)</h3>
              <p className="text-sm text-muted-foreground">
                عند التفعيل، سيتم إخفاء ملفات مزودي الخدمات غير المدفوعة
              </p>
            </div>
            <Switch
              checked={isPremiumModeEnabled}
              onCheckedChange={(checked) => {
                premiumModeMutation.mutate(checked);
              }}
              disabled={premiumModeMutation.isPending}
            />
          </div>
        </div>

        {/* Search and Tab Controls */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <Button 
              variant={activeTab === 'providers' ? 'default' : 'outline'}
              onClick={() => setActiveTab('providers')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              مزودو الخدمات
            </Button>
            <Button 
              variant={activeTab === 'customers' ? 'default' : 'outline'}
              onClick={() => setActiveTab('customers')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              جميع العملاء
            </Button>
          </div>
          
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
        
        <h2 className="text-xl font-semibold mb-4">
          {activeTab === 'providers' ? 'إدارة مزودي الخدمات' : 'إدارة جميع العملاء'}
        </h2>
        
        {(activeTab === 'providers' ? providersLoading : customersLoading) ? (
          <LoadingSpinner />
        ) : (
          <div className="dark-card overflow-hidden">
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead className="text-center">التوثيق</TableHead>
                    <TableHead className="text-center">مزود خدمات</TableHead>
                    <TableHead className="text-center">حالة الاشتراك</TableHead>
                    <TableHead className="text-center">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-center">إجراءات سريعة</TableHead>
                    <TableHead className="text-center">دردشة</TableHead>
                  </TableRow>
              </TableHeader>
                <TableBody>
                  {(activeTab === 'providers' ? providers : customers)?.map((person: any) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.full_name || 'لا يوجد اسم'}</TableCell>
                      <TableCell>{person.user?.email || 'لا يوجد بريد إلكتروني'}</TableCell>
                      
                      {/* Verification Toggle */}
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={person.is_verified ? "default" : "outline"}
                          onClick={() => {
                            verificationMutation.mutate({ id: person.id, is_verified: !person.is_verified });
                          }}
                          disabled={verificationMutation.isPending}
                          className={person.is_verified ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <UserCheck className="w-3 h-3 ml-1" />
                          {person.is_verified ? 'موثق' : 'توثيق'}
                        </Button>
                      </TableCell>
                      
                      {/* Provider Status Toggle */}
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={person.is_provider ? "default" : "outline"}
                          onClick={() => {
                            const oneYearFromNow = new Date();
                            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                            providerActivationMutation.mutate({ 
                              id: person.id, 
                              activate: !person.is_provider,
                              expiresAt: !person.is_provider ? oneYearFromNow : undefined
                            });
                          }}
                          disabled={providerActivationMutation.isPending}
                          className={person.is_provider ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          <CheckCircle className="w-3 h-3 ml-1" />
                          {person.is_provider ? 'مزود نشط' : 'تفعيل'}
                        </Button>
                      </TableCell>

                      {/* Subscription Status */}
                      <TableCell className="text-center">
                        <Badge className={cn("text-white", statusColors[person.subscription_status])}>
                          {statusTranslations[person.subscription_status]}
                        </Badge>
                      </TableCell>

                      {/* Expiry Date */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {person.subscription_expires_at ? (
                            <>
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(person.subscription_expires_at), 'yyyy-MM-dd')}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">---</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Quick Actions */}
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleManageClick(person)}
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <Settings className="w-3 h-3 ml-1" />
                          إعدادات متقدمة
                        </Button>
                      </TableCell>
                      
                      {/* Chat */}
                      <TableCell className="text-center">
                        <Button asChild size="sm" className="btn-gradient">
                          <Link to={`/chat/${person.id}`}>
                            <MessageCircle className="w-3 h-3 ml-1" />
                            دردشة
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إدارة الاشتراك - {selectedProvider?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="expiry-date" className="text-right">تاريخ الانتهاء</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !newExpiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {newExpiryDate ? format(newExpiryDate, 'PPP', { locale: ar }) : <span>اختر تاريخًا</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newExpiryDate}
                    onSelect={setNewExpiryDate}
                    initialFocus
                    dir="rtl" 
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={() => setIsModalOpen(false)} variant="ghost">إلغاء</Button>
            <Button 
              onClick={handleDeactivateSubscription} 
              disabled={subscriptionMutation.isPending}
              variant="destructive"
            >
              إيقاف التنشيط
            </Button>
            <Button 
              onClick={handleActivateSubscription} 
              disabled={subscriptionMutation.isPending || !newExpiryDate}
              className="btn-gradient"
            >
              {subscriptionMutation.isPending ? <LoadingSpinner size="sm" /> : 'تنشيط الاشتراك'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    {/* أضفنا هذا القوس في الأسفل */}
    </>
    // ===================== نهاية التعديل =====================
  );
};

export default AdminPage;
