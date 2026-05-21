
import { useState, useRef } from 'react'
import './App.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import ClonageButton from './ClonageButton.jsx'

function ClonageVoice() {

    const [mode, setMode] = useState(null)

    const [result, setResult] = useState(null)
    const { call, loading, error, setError } = useApi()
    const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()
    
    const [CloningMode, setCloningMode] = useState(null)

    // ---------------- SEND ----------------

    const sendRecording = async () => {
        if (!audioBlob && !audioFile) return

        const formData = new FormData()
        if (audioBlob) {
            formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
        } else {
            formData.append("file", audioFile)
        }

        const data = await call("/identify", { method: "POST", body: formData })
        if (data) setResult(data)
    }

    const handleModeClonageChange = (e) => {
        setCloningMode(e.target.value)
    }

    return (
        <div className="box">

            <p>Clone your voice</p>

            {/* MODE SELECTION */}

        <div className="button-group">
            <label>
                <input
                    type="radio"
                    name="cloningMode"
                    value="OpenVoice"
                    checked={CloningMode === "OpenVoice"}
                    onChange={handleModeClonageChange}
                />
                OpenVoice (faster, less accurate)
            </label>
            <label>
                <input
                    type="radio"
                    name="cloningMode"
                    value="CosyVoice"
                    checked={CloningMode === "CosyVoice"}
                    onChange={handleModeClonageChange}
                />
                CosyVoice
            </label>
        </div>


            {CloningMode === "OpenVoice" && (
                <div>
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
                                    id="audio-upload-clonage"
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleFileChange(e,setError)}
                                />

                                {!audioFile && (
                                    <label
                                        htmlFor="audio-upload-clonage"
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

                            <div className="file-info">

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
                                >
                                    Remove audio
                                </button>

                                <button
                                    className="button"
                                    onClick={sendRecording}
                                    disabled={loading}
                                >
                                    {
                                        loading
                                            ? "Analysis in progress..."
                                            : "Identify speaker"
                                    }
                                </button>
                                
                                <ClonageButton audioBlob={audioBlob || audioFile} CloningMode={CloningMode} />

                                {result && !result.issue && (

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
        )}

            {CloningMode === "coquiTTS" && (
                <div>
                    <p>Comming soon</p>
                </div>
            )}

    </div>
    )
}

export default ClonageVoice