import { useTranslation } from 'react-i18next'

export default function LanguageForm({ language, dialect, onChange }) {
    const { t } = useTranslation()

    const DIALECTS = {
        None: [],
        zh: ["", "Cantonese", "Shanghainese", "Sichuanese", "Dongbei", "Tianjin", "Shandong", "Minnan"],
        fr: [], 
        en: [], 
        es: [], 
        de: [],   
        it: [],   
        ja: [],   
        ko: [],   
        ru: [],   
    }

    const LANGUAGES = [
        { value: "None",  labelKey: "forms.language.same_as_reference" },
        { value: "fr",    labelKey: "forms.language.french" },
        { value: "en",    labelKey: "forms.language.english" },
        { value: "zh",    labelKey: "forms.language.chinese" },
        { value: "es",    labelKey: "forms.language.spanish" },
        { value: "de",    labelKey: "forms.language.german" },
        { value: "it",    labelKey: "forms.language.italian" },
        { value: "ko",    labelKey: "forms.language.korean" },
        { value: "ru",    labelKey: "forms.language.russian" },
    ]
  
    const dialects = DIALECTS[language] || []
    const hasDialects = dialects.length > 1  

    const handleLanguageChange = (newLang) => {
        // Reset dialect when language changes
        onChange({ language: newLang, dialect: "" })
    }
 
    return (
        <div>
            {/* Language  */}
            <label htmlFor="language">{t('forms.language.label')}</label>
            <p>
                {t('forms.language.warning')}
            </p>
            <select
                id="language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
            >
                {LANGUAGES.map(({ value, labelKey }) => (
                    <option key={value} value={value}>{t(labelKey)}</option>
                ))}
            </select>
 
            {/* Dialect */}
            {hasDialects && (
                <>
                    <label htmlFor="dialect">{t('forms.language.dialect_label')}</label>
                    <select
                        id="dialect"
                        value={dialect}
                        onChange={(e) => onChange({ language, dialect: e.target.value })}
                    >
                        {dialects.map((d) => (
                            <option key={d} value={d}>{d || t('forms.language.standard')}</option>
                        ))}
                    </select>
                </>
            )}
        </div>
    )
}