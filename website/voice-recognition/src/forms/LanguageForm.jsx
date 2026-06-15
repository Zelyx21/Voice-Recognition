 


 
export default function LanguageForm({ language, dialect, onChange }) {
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
    { value: "None",  label: "Same language as reference" },
    { value: "fr",  label: "French" },
    { value: "en",  label: "English" },
    { value: "zh",  label: "Chinese (Mandarin)" },
    { value: "es",  label: "Spanish" },
    { value: "de",  label: "German" },
    { value: "it",  label: "Italian" },
    { value: "ko",  label: "Korean" },
    { value: "ru",  label: "Russian" },
    //{ value: "ja",  label: "Japanese" }, //NOTE for Japanese usage, you must translate it to katakana. 
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
      <label htmlFor="language">Target language</label>
      <p>
        WARNING: If you modify it, the cloning will be less accurate !
      </p>
      <select
        id="language"
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {LANGUAGES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
 
      {/* Dialect */}
      {hasDialects && (
        <>
          <label htmlFor="dialect">Dialect / Accent</label>
          <select
            id="dialect"
            value={dialect}
            onChange={(e) => onChange({ language, dialect: e.target.value })}
          >
            {dialects.map((d) => (
              <option key={d} value={d}>{d || "Standard"}</option>
            ))}
          </select>
        </>
      )}
 
    </div>
  )
}