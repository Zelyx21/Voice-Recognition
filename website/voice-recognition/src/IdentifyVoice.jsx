import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import './styles/App.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'

import ButtonRecord from './forms/ButtonRecord'

function IdentifyVoice() {

    const { t } = useTranslation()

    const [mode, setMode] = useState(null)

    const [resultDiarization, setResultDiarization] = useState(null)
    const [result, setResult] = useState(null)
    const [diarization, setDiarization] = useState(null)

    const { call, loading, error, setError } = useApi()

    const {
        isRecording,
        audioURL,
        audioBlob,
        audioFile,
        recordingTime,
        fileInputRef,
        startRecording,
        stopRecording,
        resetRecording,
        handleFileChange
    } = useRecording()

    const sendRecording = async () => {
        if (!audioBlob && !audioFile) return

        try {
            setDiarization(null)
            setResultDiarization(null)
            setResult(null)

            const formData = new FormData()

            if (audioBlob) {
                formData.append(
                    "file",
                    new File([audioBlob], "recording.wav", {
                        type: "audio/wav"
                    })
                )
            } else {
                formData.append("file", audioFile)
            }

            const data = await call("/identify", {
                method: "POST",
                body: formData
            })

            if (data.status === "multiple_speakers") {
                setDiarization(data.diarization)
                setResultDiarization(data.data)
            }
            else if (data.status === "success") {
                setResult(data.data)
            }
            else {
                throw new Error("Unexpected response format from server.")
            }

        } catch (err) {
            setError(
                err.message ||
                t('errors.voice_recognition_error')
            )
        }
    }

    const switchMode = (newMode) => {
        setMode(newMode)
        resetRecording()
        setResult(null)
        setDiarization(null)
        setResultDiarization(null)
        setError(null)
    }

    return (
        <div className="box" style={{ alignItems: "center" }}>

            <h2>{t('identify.title')}</h2>

            <div className="button-group">

                <button
                    onClick={() => switchMode("record")}
                >
                    {t('identify.button_record')}
                </button>

                <button
                    onClick={() => switchMode("import")}
                >
                    {t('identify.button_import')}
                </button>

            </div>

            <p>{t('identify.duration_info')}</p>

            {mode === "record" && (
                <div className="record_state">

                    <ButtonRecord
                        isRecording={isRecording}
                        audioURL={audioURL}
                        setError={setError}
                        startRecording={startRecording}
                        stopRecording={stopRecording}
                        recordingTime={recordingTime}
                    />

                </div>
            )}

            {mode === "import" && (

                <div>

                    <input
                        ref={fileInputRef}
                        id="audio-upload-identify"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileChange(e, setError)}
                    />

                    {!audioFile && (
                        <label
                            htmlFor="audio-upload-identify"
                            className="button"
                        >
                            {t('identify.button_import')}
                        </label>
                    )}

                </div>
            )}

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            {audioURL && (

                <div
                    className="file-info"
                    style={{ alignItems: "center" }}
                >

                    <p>{t('common.audio_ready')}</p>

                    <audio
                        controls
                        src={audioURL}
                    />

                    <div className="file-actions-row">
                        <button
                            className="remove"
                            onClick={resetRecording}
                        >
                            {t('common.button_remove')}
                        </button>

                        <button
                            className="button"
                            onClick={sendRecording}
                            disabled={loading}
                        >
                            {loading
                                ? t('identify.button_analyzing')
                                : t('identify.button_identify')}
                        </button>
                    </div>

                    {diarization && resultDiarization && (
                        <div className="diarization-result-card">

                            <div className="result-header">
                                <h3>{t('identify.multiple_speakers')}</h3>
                            </div>

                            <p>
                                {t('identify.speakers_count', {
                                    count: Object.keys(diarization).length
                                })}
                            </p>

                            <div className="speakers-list">

                                {Object.entries(diarization).map(
                                    ([speakerName, speakerData], idx) => (

                                        <div
                                            key={speakerName}
                                            className="speaker-item"
                                        >

                                            <audio
                                                controls
                                                src={`data:audio/wav;base64,${speakerData.audio}`}
                                                className="custom-audio-player"
                                            />

                                            <SpeakerResult result={resultDiarization[idx]} />

                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    )}

                    {result && (
                        <SpeakerResult result={result} />
                    )}

                </div>
            )}

        </div>
    )
}

function SpeakerResult({ result }) {

    const { t } = useTranslation()

    if (!result) return null

    return (
        <div className="speaker-result">

            <div className="speaker-result-row">
                <span className="speaker-result-label">
                    {t('identify.speaker_label')}
                </span>
                <span className="speaker-result-value">
                    {result.name}
                </span>
            </div>

            <div className="speaker-result-row">
                <span className="speaker-result-label">
                    {t('identify.score_label')}
                </span>
                <span className="speaker-result-value score">
                    {result.score}
                </span>
            </div>

            {result.issue && (
                <div className="speaker-result-row issue">
                    <span className="speaker-result-label">
                        {t('identify.issue_label')}
                    </span>
                    <span className="speaker-result-value">
                        {result.issue}
                    </span>
                </div>
            )}

        </div>
    )
}

export default IdentifyVoice