import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  return {
    t,
    i18n,
    // Helper functions
    changeLanguage: (lng: string) => i18n.changeLanguage(lng),
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized,
  };
}

export default useTranslation;