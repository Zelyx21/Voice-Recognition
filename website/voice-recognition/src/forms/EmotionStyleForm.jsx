import { useTranslation } from 'react-i18next'

export default function EmotionStyleForm({ emotion, speakingStyle, showStyle = true, onChange }) {
    const { t } = useTranslation()

    const EMOTIONS = [
        { value: "NEUTRAL",    labelKey: "forms.emotions.neutral"},
        { value: "HAPPY",      labelKey: "forms.emotions.happy"},
        { value: "SAD",        labelKey: "forms.emotions.sad"},
        { value: "ANGRY",      labelKey: "forms.emotions.angry"},
        { value: "EXCITED",    labelKey: "forms.emotions.excited"},
        { value: "FEARFUL",    labelKey: "forms.emotions.fearful"},
        { value: "SURPRISED",  labelKey: "forms.emotions.surprised"},
        { value: "DISGUSTED",  labelKey: "forms.emotions.disgusted"},
        { value: "CALM",       labelKey: "forms.emotions.calm"},
        { value: "CONFUSED",   labelKey: "forms.emotions.confused"},
        { value: "EMPATHETIC", labelKey: "forms.emotions.empathetic"},
        { value: "DEPRESSED",  labelKey: "forms.emotions.depressed"},
    ]

    const SPEAKING_STYLES = [
        { value: "NORMAL",        labelKey: "forms.styles.normal"},
        { value: "WHISPER",       labelKey: "forms.styles.whisper"},
        { value: "SHOUT",         labelKey: "forms.styles.shout"},
        { value: "STORYTELLING",  labelKey: "forms.styles.storytelling"},
        { value: "NEWS",          labelKey: "forms.styles.news"},
        { value: "COMMERCIAL",    labelKey: "forms.styles.commercial"},
        { value: "CHILD",         labelKey: "forms.styles.child"},
        { value: "ELDER",         labelKey: "forms.styles.elder"},
        { value: "MYSTERIOUS",    labelKey: "forms.styles.mysterious"},
        { value: "GENTLE",        labelKey: "forms.styles.gentle"},
        { value: "AUTHORITATIVE", labelKey: "forms.styles.authoritative"},
        { value: "WARM",          labelKey: "forms.styles.warm"},
        { value: "LIVELY",        labelKey: "forms.styles.lively"},
    ]

    return (
        <div>
            {/* Emotion */}
            <label htmlFor="emotion">{t('forms.emotion_label')}</label>

            <select
                id="emotion"
                value={emotion}
                onChange={(e) => onChange({ emotion: e.target.value, speakingStyle })}
            >
                {EMOTIONS.map(({ value, labelKey}) => (
                    <option key={value} value={value}>
                        {t(labelKey)}
                    </option>
                ))}
            </select>

            {/* Speaking style */}
            {showStyle && (
                <>
                    <label htmlFor="speakingStyle">{t('forms.speaking_style_label')}</label>

                    <select
                        id="speakingStyle"
                        value={speakingStyle}
                        onChange={(e) => onChange({ emotion, speakingStyle: e.target.value })}
                    >
                        {SPEAKING_STYLES.map(({ value, labelKey}) => (
                            <option key={value} value={value}>
                                {t(labelKey)}
                            </option>
                        ))}
                    </select>
                </>
            )}
        </div>
    )
}