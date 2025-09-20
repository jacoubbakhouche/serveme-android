import { AdMob, AdOptions, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Preferences } from '@capacitor/preferences';
import React, { useEffect } from 'react';
import LoadingSpinner from './ui/LoadingSpinner'; // تأكد من أن هذا المكون موجود لديك

// معرف الوحدة الإعلانية للاختبار من جوجل
const AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';

interface AdGateProps {
  onAdDismissed: () => void;
}

const AdGate: React.FC<AdGateProps> = ({ onAdDismissed }) => {
  useEffect(() => {
    const checkAndShowAd = async () => {
      const shouldShow = await shouldShowAd();
      if (shouldShow) {
        await prepareAndShowInterstitial();
      } else {
        onAdDismissed();
      }
    };

    const listeners = [
      AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => handleAdFinished()),
      AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => handleAdFinished()),
    ];

    checkAndShowAd();

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, []);

  const shouldShowAd = async (): Promise<boolean> => {
    const { value } = await Preferences.get({ key: 'lastAdShowTime' });
    if (!value) return true; // اعرض الإعلان إذا لم يظهر من قبل

    const lastAdTime = new Date(value).getTime();
    const currentTime = new Date().getTime();
    const hoursPassed = (currentTime - lastAdTime) / (1000 * 60 * 60);
    return hoursPassed >= 24; // التحقق مما إذا مرت 24 ساعة
  };

  const prepareAndShowInterstitial = async () => {
    try {
      const options: AdOptions = {
        adId: AD_UNIT_ID,
        isTesting: true, // !! مهم: اجعلها false عند إطلاق التطبيق !!
      };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('Error showing ad:', e);
      handleAdFinished();
    }
  };

  const handleAdFinished = async () => {
    await Preferences.set({ key: 'lastAdShowTime', value: new Date().toISOString() });
    onAdDismissed();
  };

  // عرض شاشة تحميل بسيطة أثناء التحقق من الإعلان
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <LoadingSpinner />
    </div>
  );
};

export default AdGate;
