import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './../styles/App.css'
import { useApi } from './../hooks/useAPI'
import { useRecording } from './../hooks/useRecording'

export default function ButtonRecord({isRecording, audioURL, setError, startRecording, stopRecording, recordingTime, clonage=false}) {
    const { t } = useTranslation()

    const EXAMPLE_SENTENCES = {
        None: "None",
        English: t('forms.record.examples.english'),
        French: t('forms.record.examples.french'),
    }

    const [exempleLanguage, setExempleLanguage] = useState("")

    return (
        <div>
            {!isRecording && !audioURL && (
                <button
                    className="button"
                    onClick={()=>{setError(null); startRecording()}}
                >
                    {t('forms.record.start_button')}
                </button>
            )}

            {isRecording && (
                <div>
                    {clonage ? (
                        <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 30sec</p>
                    ):
                    <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
                    }

                    <button
                        className="remove"
                        onClick={()=>stopRecording(setError)}
                    >
                        {t('forms.record.stop_button')}
                    </button>
                </div>
            )}

            <div>
                <p>{t('forms.record.instruction')}</p>
                <p>{t('forms.record.help_text')}</p>

                <select
                    id="exemple"
                    value={exempleLanguage}
                    onChange={(e) => setExempleLanguage(e.target.value)}
                >
                    {Object.entries(EXAMPLE_SENTENCES).map( ([key, value]) => (
                        <option key={key} value={key}>{key}</option>
                    ))}
                </select>
                
                <div className="text_Exemple">
                    {exempleLanguage !== "None" && (
                        EXAMPLE_SENTENCES[exempleLanguage]
                    )}
                </div>
            </div>
        </div>
    );
}