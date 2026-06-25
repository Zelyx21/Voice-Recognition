import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './langues/en/en.json'
import frTranslations from './langues/fr/fr.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    fr: { translation: frTranslations }
  },
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
})

export default i18n