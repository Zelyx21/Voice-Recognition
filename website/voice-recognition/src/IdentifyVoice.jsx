import { useState, useRef } from 'react'
import './App.css'

function IdentifyVoice() {

    const [mode, setMode] = useState(null)

    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    const [audioFile, setAudioFile] = useState(null)

    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const fileInputRef = useRef(null)

    // ---------------- RECORDING ----------------

    const startRecording = async () => {
        try {

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

                const blob = new Blob(chunksRef.current, {
                    type: 'audio/wav'
                })

                const url = URL.createObjectURL(blob)

                setAudioBlob(blob)
                setAudioURL(url)

                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)

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
    }

    // ---------------- IMPORT ----------------

    const handleFileChange = (event) => {

        const file = event.target.files[0]

        if (file) {
            setAudioFile(file)
            setAudioURL(URL.createObjectURL(file))
            setResult(null)
        }
    }

    // ---------------- SEND ----------------

    const sendRecording = async () => {

        if (!audioBlob && !audioFile) {
            setError("Please provide an audio file")
            return
        }

        setError(null)
        setLoading(true)

        try {

            const formData = new FormData()

            if (audioBlob) {

                formData.append(
                    "file",
                    new File(
                        [audioBlob],
                        "recording.wav",
                        { type: "audio/wav" }
                    )
                )

            } else if (audioFile) {

                formData.append("file", audioFile)
            }

            const response = await fetch("http://localhost:8000/identify", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                throw new Error("Server error")
            }

            const data = await response.json()

            setResult(data)

        } catch (err) {

            setError(err.message)

        } finally {

            setLoading(false)
        }
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

                    {error && (
                        <p style={{ color: "red" }}>
                            {error}
                        </p>
                    )}

                </div>
            )}

        </div>
    )
}

export default IdentifyVoice