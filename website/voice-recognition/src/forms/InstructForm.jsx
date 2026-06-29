import { useTranslation } from 'react-i18next'

export default function InstructForm({ instruction, onChange }) {
    const { t } = useTranslation()

    return (
        <div>
            <label htmlFor="instruction">
                {t('forms.instruction.label')}
            </label>

            <p>
                {t('forms.instruction.description')}
            </p>

            <textarea
                id="instruction"
                value={instruction}
                rows={3}
                placeholder={t('forms.instruction.placeholder')}
                onChange={(e) => onChange(e.target.value)}
            />

            {instruction && (
                <button type="button" onClick={() => onChange("")}>
                    {t('forms.instruction.clear_button')}
                </button>
            )}
        </div>
    )
}