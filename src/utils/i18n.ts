import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, defaultNS, fallbackLng } from '@/locales';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    defaultNS,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Enable debugging in development
    debug: import.meta.env.DEV,

    // Namespace separator
    nsSeparator: '.',

    // Key separator for nested translations
    keySeparator: '.',

    // Return key if translation is missing
    returnEmptyString: false,

    // Load translations synchronously
    initImmediate: false,
  });

export default i18n;