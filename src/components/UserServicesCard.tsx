
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const UserServicesCard = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: userServices, isLoading } = useQuery({
        queryKey: ['user-services', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw new Error(error.message);
            return data || [];
        },
        enabled: !!user,
    });

    const deleteServiceMutation = useMutation({
        mutationFn: async (serviceId: string) => {
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-services'] });
            queryClient.invalidateQueries({ queryKey: ['services'] });
            toast({
                title: "تم الحذف",
                description: "تم حذف الطلب بنجاح",
            });
        },
        onError: (error) => {
            toast({
                title: "خطأ",
                description: `فشل في حذف الطلب: ${error.message}`,
                variant: "destructive",
            });
        },
    });
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    طلباتي ({userServices?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p className="text-muted-foreground text-center py-4">جاري التحميل...</p>
                ) : userServices && userServices.length > 0 ? (
                    <div className="space-y-3">
                        {userServices.map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium">{service.title}</h4>
                                    <p className="text-sm text-muted-foreground">{service.category}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(service.created_at), { addSuffix: true, locale: ar })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {service.is_urgent && (
                                        <Badge variant="destructive" className="text-xs">عاجل</Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteServiceMutation.mutate(service.id)}
                                        disabled={deleteServiceMutation.isPending}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">لم تقم بنشر أي طلبات حتى الآن</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserServicesCard;
