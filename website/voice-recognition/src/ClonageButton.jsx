import { useState } from "react";

export default function ClonageButton({audioBlob}) {

    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleClone = async () => {

        if (!audioBlob) return;
        setLoading(true);

        try {

            const formData = new FormData()
            formData.append("file",new File([audioBlob], "recording.wav", { type: 'audio/wav' }))

            const response = await fetch("http://localhost:8000/clonage", {
                method: "POST",
                body: formData
            });

            const blob = await response["clones"].blob();

            const url = URL.createObjectURL(blob);

            setAudioUrl(url);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    return (
        <div>

            <button onClick={handleClone}>
                {loading ? "Clonage..." : "Cloner la voix"}
            </button>

            {audioUrl && (
                <audio controls src={audioUrl} />
            )}

        </div>
    );
}