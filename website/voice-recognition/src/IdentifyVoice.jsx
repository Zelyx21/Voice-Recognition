import { useState, useRef } from 'react'
import './styles/App.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'

import ButtonRecord from './forms/ButtonRecord'

function IdentifyVoice() {

    const [mode, setMode] = useState(null)

    const [resultDiarization, setResultDiarization] = useState(null)
    const [result, setResult] = useState(null)
    const [diarization, setDiarization] = useState(null)
    const { call, loading, error, setError } = useApi()
    const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()

    
    // send audio to API

    const sendRecording = async () => {
        if (!audioBlob && !audioFile) return

        try{
            setDiarization(null)
            setResultDiarization(null)
            setResult(null)
            
            const formData = new FormData()
            if (audioBlob) {
                formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
            } else {
                formData.append("file", audioFile)
            }

            const response = await call("/identify", { method: "POST", body: formData })
            
      
            const data = await response
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
            setErrorclone(err.message || "An unexpected error occurred during Voice recognition.")
        } 
    }


    return (
        <div className="box" style={{alignItems:"center"}}>

            <h2>Identify a voice</h2>
            {/* mode selection */}


            <div className="button-group">
                <button
                    onClick={() => {
                        setMode("record")
                        resetRecording()
                    }}
                >
                    Record your voice
                </button>

                <button
                    onClick={() => {
                        setMode("import")
                        resetRecording()
                    }}
                >
                    Import your voice
                </button>
            </div>

            <p className="clonage-subtitle">Please provide an audio between 5 seconds and 10 minutes</p>

            {/* record mode */}

            {mode === "record" && (

                <div className="record_state">

                    <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime}/>

                </div>
            )}

            {/* import mode */}

            {mode === "import" && (

                <div>

                    <input
                        ref={fileInputRef}
                        id="audio-upload-identify"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileChange(e,setError)}
                    />

                    {!audioFile && (
                        <label
                            htmlFor="audio-upload-identify"
                            className="button"
                        >
                            Import an audio file
                        </label>
                    )}

                </div>
            )}

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            {/* audio preview */}

            {audioURL && (

                <div className="file-info" style={{alignItems:"center"}}>

                    <p>
                        Audio ready
                    </p>

                    <audio
                        controls
                        src={audioURL}
                    />

                    <button
                        className="remove"
                        onClick={resetRecording}
                        style={{ alignSelf: "center" }}
                    >
                        Remove audio
                    </button>

                    <button
                        className="button"
                        onClick={sendRecording}
                        disabled={loading}
                        style={{ alignSelf: "center" }}
                    >
                        {
                            loading
                                ? "Analysis in progress..."
                                : "Identify speaker"
                        }
                    </button>

                    {diarization && resultDiarization && (
                    <div className="diarization-result-card">
                    <div className="result-header">
                        <h3>Multiple Speakers Detected</h3>
                    </div>
                    <p>
                        The audio sample contains <strong>{Object.keys(diarization).length} speakers</strong>.
                    </p>
                    <div className="speakers-list">
                        {Object.entries(diarization).map(([speakerName, speakerData], idx) => (
                        <div key={speakerName} className="speaker-item">
                            <div className="speaker-meta">
                            </div>
                            <audio
                            controls
                            src={`data:audio/wav;base64,${speakerData.audio}`}
                            className="custom-audio-player"
                            />
                            <SpeakerResult result={resultDiarization[idx]} />

                        </div>
                        ))}
                    </div>
                    </div>
                )}

                {result && <SpeakerResult result={result} />}

                </div>
            )}

        </div>
    )
}

function SpeakerResult({ result }) {
    if (!result) return null
    return (
        <div className="speaker-result">
            <div className="speaker-result-row">
                <span className="speaker-result-label">Speaker : </span>
                <span className="speaker-result-value">{result.name}</span>
            </div>
            <div className="speaker-result-row">
                <span className="speaker-result-label">Score : </span>
                <span className="speaker-result-value score">{result.score}</span>
            </div>
            {result.issue && (
                <div className="speaker-result-row issue">
                    <span className="speaker-result-label">Issue : </span>
                    <span className="speaker-result-value">{result.issue}</span>
                </div>
            )}
        </div>
    )
}


export default IdentifyVoice