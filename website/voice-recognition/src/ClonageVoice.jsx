import { useState } from 'react'
import './App.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import ClonageButton from './ClonageButton.jsx'
import ClonageButtonsCosyVoice from './ClonageButtonsCosyVoice.jsx'

function ClonageVoice({ isAuthenticated }) {

    const [mode, setMode] = useState(null)
    const [result, setResult] = useState(null)
    const { call, loading, error, setError } = useApi()
    const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()
    const [CloningMode, setCloningMode] = useState(null)

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
        resetRecording()
        setResult(null)
        setMode(null)
    }

    return (
        <div className="box">
            {!isAuthenticated ? (
                <p>Please log in to use voice cloning.</p>
            ) : (
                <>
                    <p>Clone your voice</p>

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
                            CosyVoice3 (slower, more accurate)
                        </label>
                    </div>

                    {(CloningMode === "OpenVoice" || CloningMode === "CosyVoice") && (
                        <div>
                            <div className="button-group">
                                <button onClick={() => { setMode("record"); resetRecording() }}>
                                    Record your voice
                                </button>
                                <button onClick={() => { setMode("import"); resetRecording() }}>
                                    Import your voice
                                </button>
                            </div>

                            {mode === "record" && (
                                <div>
                                    {!isRecording && !audioURL && (
                                        <button className="button" onClick={() => { setError(null); startRecording() }}>
                                            Start recording
                                        </button>
                                    )}
                                    {isRecording && (
                                        <div>
                                            <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
                                            <button className="remove" onClick={() => stopRecording(setError)}>
                                                Stop recording
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === "import" && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        id="audio-upload-clonage"
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handleFileChange(e, setError)}
                                    />
                                    {!audioFile && (
                                        <label htmlFor="audio-upload-clonage" className="button">
                                            Import an audio file
                                        </label>
                                    )}
                                </div>
                            )}

                            {error && <p style={{ color: "red" }}>{error}</p>}

                            {audioURL && (
                                <div className="file-info">
                                    <p>Audio ready</p>
                                    <audio controls src={audioURL} />

                                    <button className="remove" onClick={resetRecording}>
                                        Remove audio
                                    </button>

                                    <button className="button" onClick={sendRecording} disabled={loading}>
                                        {loading ? "Analysis in progress..." : "Identify speaker"}
                                    </button>

                                    {CloningMode === "OpenVoice" && (
                                        <ClonageButton
                                            audioBlob={audioBlob || audioFile}
                                            CloningMode={CloningMode}
                                        />
                                    )}

                                    {CloningMode === "CosyVoice" && (
                                        <ClonageButtonsCosyVoice
                                            audioBlob={audioBlob || audioFile}
                                        />
                                    )}

                                    {result && !result.issue && (
                                        <div className="result">
                                            <p>Speaker : {result.name}</p>
                                            <p>Score : {result.score}</p>
                                        </div>
                                    )}
                                    {result && result.issue && (
                                        <div className="issue">
                                            <p>Issues : {result.issue}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ClonageVoice