// src/components/ServiceCard.tsx
import React from "react";

type Service = {
  id: string;
  title: string;
  description?: string;
  image_urls?: string[]; // مصفوفة روابط الصور
};

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="border rounded-xl shadow-md p-4 bg-white">
      {/* عرض الصور */}
      {service.image_urls && service.image_urls.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {service.image_urls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`صورة ${idx + 1} من ${service.title}`}
              className="h-40 w-40 object-cover rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="h-40 w-full flex items-center justify-center text-gray-400">
          لا توجد صور
        </div>
      )}

      {/* معلومات الخدمة */}
      <h3 className="mt-3 text-lg font-semibold">{service.title}</h3>
      {service.description && (
        <p className="text-sm text-gray-600">{service.description}</p>
      )}
    </div>
  );
};

export default ServiceCard;

