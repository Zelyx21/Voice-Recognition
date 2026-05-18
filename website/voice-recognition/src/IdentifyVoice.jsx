import { useState, useRef } from 'react'
import './App.css'
import { useApi } from './hooks/useAPI'

function IdentifyVoice() {

    const [mode, setMode] = useState(null)

    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioFile, setAudioFile] = useState(null)

    const [result, setResult] = useState(null)
    const { call, loading, error, setError } = useApi()

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const fileInputRef = useRef(null)

    // ---------------- RECORDING ----------------

    const startRecording = async () => {
        try {
            //Ask access to the microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
                const url = URL.createObjectURL(blob)
                setAudioBlob(blob)
                setAudioURL(url)

                // Stop all microphone tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)

            setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    stopRecording()
                }
            }, 10 * 60 * 1000)

        } catch (err) {
            alert("Microphone inaccessible : " + err.message)
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
    }

    const resetRecording = () => {
        setAudioURL(null)
        setAudioBlob(null)
        setAudioFile(null)
        setResult(null)
        setError(null)
    }

    // ---------------- IMPORT ----------------

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const audio = new Audio(URL.createObjectURL(file))

        audio.onloadedmetadata = () => {
            if (audio.duration > 10 * 60) {
                setError("Audio file must be under 10 minutes")
                event.target.value = ""
                return
            }
            setError(null)
            setAudioFile(file)
            setAudioURL(URL.createObjectURL(file))
            setResult(null)
        }
    }

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

    return (
        <div className="box">

            <p>Identify a voice</p>

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
                            onClick={startRecording}
                        >
                            Start recording
                        </button>
                    )}

                    {isRecording && (
                        <button
                            className="remove"
                            onClick={stopRecording}
                        >
                            Stop recording
                        </button>
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
                        onChange={handleFileChange}
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
    )
}

export default IdentifyVoice