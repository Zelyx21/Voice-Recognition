
import { useState } from 'react' 
import { useApi } from './hooks/useAPI' 

function Diarization({audioBlob, audioFile}) {

    const [result_diari, setResult_diari] = useState(null)
    const { call, loading, error, setError } = useApi()

    // ---------------- SEND ----------------

    const sendRecordingDiari = async () => {
        if (!audioBlob && !audioFile) return

        const formData = new FormData()
        if (audioBlob) {
            formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
        } else {
        
            formData.append("file", audioFile)
        }

        const data = await call("/diarization", { method: "POST", body: formData })
        if (data) setResult_diari(data)
    }

    return (
            <div>
                {!result_diari && (
                    <button
                        className="button"
                        onClick={sendRecordingDiari}
                        disabled={loading}
                        style={{ alignSelf: "center" }}
                    >
                        {
                            loading
                                ? "Analysis in progress..."
                                : "Diarization"
                        }
                    </button>
                    )}
                {result_diari && (
                    <>
                    {Object.entries(result_diari).map(([speaker, data]) => (
                    <div key={speaker} className="file-info" style={{alignItems:"center"}}>
                        <h3>{speaker}</h3>

                        <audio
                        controls
                        src={`data:audio/wav;base64,${data.audio}`}
                        />
                    </div>
                    ))}
                </>
                )}
            {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
            )
        }

export default Diarization

