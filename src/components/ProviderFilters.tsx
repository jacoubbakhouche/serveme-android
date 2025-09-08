
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, MapPin } from 'lucide-react';

interface ProviderFiltersProps {
  categories: string[];
  locations: string[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
}

const ProviderFilters = ({
  categories,
  locations,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
}: ProviderFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full md:w-48">
          <Filter className="w-4 h-4 ml-2" />
          <SelectValue placeholder="نوع الخدمة" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category === 'الكل' ? 'all' : category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="w-full md:w-48">
          <MapPin className="w-4 h-4 ml-2" />
          <SelectValue placeholder="الولاية" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location} value={location === 'الكل' ? 'all' : location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProviderFilters;
