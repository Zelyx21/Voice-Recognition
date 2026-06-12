import { useState, useRef } from 'react'
import './styles/App.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'

function IdentifyVoice() {

    const [mode, setMode] = useState(null)

    const [resultDiarization, setResultDiarization] = useState(null)
    const [result, setResult] = useState(null)
    const [diarization, setDiarization] = useState(null)
    const { call, loading, error, setError } = useApi()
    const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()

    // ---------------- SEND ----------------

    const sendRecording = async () => {
        if (!audioBlob && !audioFile) return

        try{
            const formData = new FormData()
            if (audioBlob) {
                formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
            } else {
                formData.append("file", audioFile)
            }

            const response = await call("/identify", { method: "POST", body: formData })

            const data = await response.json()
            const test = data.data
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
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="box" style={{alignItems:"center"}}>

            <h2>Identify a voice</h2>

            {/* MODE SELECTION */}

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

            {/* RECORD MODE */}

            {mode === "record" && (

                <div>

                    {!isRecording && !audioURL && (
                        <button
                            className="button"
                            onClick={()=>{setError(null); startRecording()}}
                        >
                            Start recording
                        </button>
                    )}

                    {isRecording && (
                        <div>
                            <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
                            <button
                                className="remove"
                                onClick={()=>stopRecording(setError)}
                            >
                                Stop recording
                            </button>
                        </div>
                    )}

                </div>
            )}

            {/* IMPORT MODE */}

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

            {/* AUDIO PREVIEW */}

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

                    {diarization && (
                        <div className="diarization-result-card">
                        <div className="result-header">
                            <span className="warning-icon">⚠️</span>
                            <h3>Multiple Speakers Detected</h3>
                        </div>
                        <p>
                            The audio sample contains <strong>{Object.keys(diarization).length} speakers</strong>.
                            Voice cloning requires a single-speaker recording. Preview each speaker below
                            and re-upload an isolated segment.
                        </p>
                        <div className="speakers-list">
                            {Object.entries(diarization).map(([speakerName, speakerData]) => (
                            <div key={speakerName} className="speaker-item">
                                <div className="speaker-meta">
                                <span className="speaker-label">{speakerName}</span>
                                <span className="speaker-duration">
                                    {speakerData.duration.toFixed(1)}s
                                </span>
                                </div>
                                <audio
                                controls
                                src={`data:audio/wav;base64,${speakerData.audio}`}
                                className="custom-audio-player"
                                />
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                    {result && (
                        <div className="result">

                            <p>
                                Speaker : {result.name}
                            </p>

                            <p>
                                Score : {result.score}
                            </p>

                        </div>
                    )}

                    {result && result.issue && (

                        <div className="issue">

                            <p>
                                Issues : {result.issue}
                            </p>

                        </div>

                    )}

                </div>
            )}

        </div>
    )
}

export default IdentifyVoice