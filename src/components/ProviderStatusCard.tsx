
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Star } from 'lucide-react';

interface ProviderStatusCardProps {
  isProvider: boolean;
  providerCategory: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  isUpdating: boolean;
  onToggleProviderStatus: (checked: boolean) => void;
}

const ProviderStatusCard = ({
  isProvider,
  providerCategory,
  specialties,
  rating,
  reviewCount,
  isUpdating,
  onToggleProviderStatus
}: ProviderStatusCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          حساب مزود الخدمة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="provider-switch" className="font-medium">
              تفعيل حساب مزود الخدمة
            </Label>
            <p className="text-sm text-muted-foreground">
              {isProvider ? 'أنت مزود خدمة نشط' : 'فعل حسابك لتقديم الخدمات'}
            </p>
          </div>
          <Switch
            id="provider-switch"
            checked={isProvider}
            onCheckedChange={onToggleProviderStatus}
            disabled={isUpdating}
          />
        </div>

        {isProvider && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-semibold">معلومات مزود الخدمة</h4>
            <div className="space-y-2">
              <Label>نوع الخدمة المقدمة</Label>
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-emerald-100">
                {providerCategory}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm">{Number(rating).toFixed(1)} ({reviewCount} تقييم)</span>
            </div>
            {specialties && specialties.length > 0 && (
              <div className="space-y-2">
                <Label>التخصصات</Label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderStatusCard;
