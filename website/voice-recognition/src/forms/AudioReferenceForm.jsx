import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const TRANSCRIBE_URL = "http://localhost:8000/ASR"

export default function AudioReferenceForm({ transcriptAudio, onChange, audioBlob }) {
    const { t } = useTranslation()
    const [suggestion,   setSuggestion]   = useState(null)
    const [transcribing, setTranscribing] = useState(false)
    const [error,        setError]        = useState(null)

    const transcribe = async () => {
        if (!audioBlob) return
        setTranscribing(true)
        setError(null)
        setSuggestion(null)
        try{
            const formData = new FormData()
            formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))

            const response = await fetch(TRANSCRIBE_URL, { method: "POST", body: formData })

            if (!response.ok) {
                const data = await response.json()
                setError(data.detail || t('forms.audio_reference.transcription_failed'))
            } else {
                const data = await response.json()
                setSuggestion(data.transcript)
            }
        } catch (err) {
            console.error("Fetch error:", err)
            setError(t('forms.audio_reference.network_error'))
        } finally {
            setTranscribing(false)
        }
    }

    return (
        <div>
            <label htmlFor="promptText">{t('forms.audio_reference.label')}</label>
            <p>{t('forms.audio_reference.description')}</p>

            <input
                id="promptText"
                type="text"
                value={transcriptAudio}
                placeholder={t('forms.audio_reference.placeholder')}
                onChange={(e) => onChange(e.target.value)}
            />

            {/* Button transcription  */}
            <button
                onClick={transcribe}
                disabled={!audioBlob || transcribing}
                type="button"
            >
                {transcribing ? t('forms.audio_reference.transcribing') : t('forms.audio_reference.auto_transcribe_button')}
            </button>

            {/* Use Whisper transcription */}
            {suggestion && (
                <div>
                    <p><em>{suggestion}</em></p>
                    <button
                        type="button"
                        onClick={() => { onChange(suggestion); setSuggestion(null) }}
                    >
                        {t('forms.audio_reference.use_transcript_button')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSuggestion(null)}
                    >
                        {t('forms.audio_reference.dismiss_button')}
                    </button>
                </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}

            {!transcriptAudio && !suggestion && (
                <p>
                    {t('forms.audio_reference.warning')}
                </p>
            )}
        </div>
    )
}