 
 /**
 * Props:
 *   language  {string}    Current language code (e.g. "en")
 *   dialect   {string}    Current dialect (e.g. "British" or "")
 *   onChange  {function}  Called with { language, dialect } on change
 */

 
export default function LanguageForm({ language, dialect, onChange }) {
 const DIALECTS = {
  en:  ["", "American", "British", "Australian"],
  zh:  ["", "Cantonese", "Sichuanese", "Shanghainese", "Hokkien"],
  ja:  [],   
  ko:  [],   
  yue: [],   
}

 const LANGUAGES = [
  { value: "en",  label: "English" },
  { value: "zh",  label: "Chinese (Mandarin)" },
  { value: "ja",  label: "Japanese" },
  { value: "ko",  label: "Korean" },
  { value: "yue", label: "Cantonese" },
]
  
  const dialects = DIALECTS[language] || []
  const hasDialects = dialects.length > 1  // more than just the empty default


  const handleLanguageChange = (newLang) => {
    // Reset dialect when language changes — previous dialect may not apply
    onChange({ language: newLang, dialect: "" })
  }
 
  return (
    <div>
 
      {/* ── Target language ── */}
      <label htmlFor="language">Target language</label>
      <p>
        The language the cloned voice will speak in.
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
 
      {/* ── Dialect (conditional) ── */}
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