import { useTranslation } from 'react-i18next'

export default function TextForm({ text, placeholder, onChange }) {
    const { t } = useTranslation()

    return (
        <div>
            {/* ── Text to synthesize ── */}
            <label htmlFor="cloneText">
                {t('forms.text.label')}
            </label>
            <input
                id="cloneText"
                type="text"
                value={text}
                placeholder={placeholder}
                onChange={(e) => onChange({ text: e.target.value })}
            />
        </div>
    )
}