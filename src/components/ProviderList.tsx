
import React from 'react';
import ProviderCard from './ProviderCard';
import { Tables } from '@/integrations/supabase/types';

interface ProviderListProps {
  providers: Tables<'profiles'>[];
}

const ProviderList = ({ providers }: ProviderListProps) => {
  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">لا يوجد مزودو خدمات تطابق البحث</p>
      </div>
    );
  }

  return (
    //   الذي قمت بي تعديله  من قيبل يعقوب بخوش الكود الجديد والمُعدَّل
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
};

export default ProviderList;
