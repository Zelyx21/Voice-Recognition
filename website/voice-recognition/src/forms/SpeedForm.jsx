import { useTranslation } from 'react-i18next'

export default function SpeedForm({ speed, onChange }) {
    const { t } = useTranslation()

    return (
        <div>
            <label htmlFor="speed">
                {t('forms.speed.label', { speed: speed.toFixed(2) })}
            </label>
            <p>
                {t('forms.speed.recommendation')}
            </p>
            <input
                id="speed"
                type="range"
                min="0.5" max="2.0" step="0.05"
                value={speed}
                onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
            />
        </div>
    )
}