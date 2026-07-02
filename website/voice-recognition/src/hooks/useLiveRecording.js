import { useRef, useState, useCallback } from "react";

export function useLiveRecording(call, setError) {

    const [isRecording, setIsRecording] = useState(false);

    const [speaker, setSpeaker] = useState({
        status: "not_speaking",
        name: "",
        score: ""
    });

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const isStoppingRef = useRef(false);

    // Compteur global pour ordonner les chunks, et tracker le dernier appliqué
    const chunkSeqRef = useRef(0);
    const lastAppliedSeqRef = useRef(0);

    const sendChunk = async (blob) => {

        if (blob.size === 0)
            return;

        // on assigne un numéro de séquence AU MOMENT DE L'ENVOI (ordre d'enregistrement)
        const seq = ++chunkSeqRef.current;

        const formData = new FormData();

        formData.append(
            "file",
            new File([blob], "live.webm", { type: blob.type })
        );

        try {
            const result = await call("/identify_live", {
                method: "POST",
                body: formData
            });

            console.log(`identify_live result (seq=${seq}):`, result);

            if (!result)
                return;

            // si un chunk PLUS RÉCENT a déjà été appliqué, on ignore cette réponse tardive
            if (seq <= lastAppliedSeqRef.current) {
                console.log(`Chunk seq=${seq} ignoré (obsolète, dernier appliqué=${lastAppliedSeqRef.current})`);
                return;
            }

            lastAppliedSeqRef.current = seq;

            switch (result.status) {

                case "not_speaking":
                    setSpeaker({ status: "not_speaking", name: "", score: "" });
                    break;

                case "unknown":
                    setSpeaker({ status: "unknown", name: "", score: result.score ?? "" });
                    break;

                case "success":
                    setSpeaker({
                        status: "success",
                        name: result.data.name,
                        score: result.data.score
                    });
                    break;

                case "error":
                    console.error("Backend error:", result.message);
                    // on ne touche PAS à l'affichage courant si c'est juste une erreur ponctuelle,
                    // pour ne pas écraser un bon résultat récent par une erreur d'un autre chunk
                    break;

                default:
                    console.warn("Unexpected status:", result.status, result);
            }

        } catch (e) {
            console.error(e);
        }
    };

    const createRecorder = useCallback((stream) => {

        const chunks = [];

        const recorder = new MediaRecorder(stream, {
            mimeType: "audio/webm;codecs=opus"
        });

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0)
                chunks.push(event.data);
        };

        recorder.onstop = () => {

            const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
            sendChunk(blob);

            if (!isStoppingRef.current && streamRef.current) {
                const newRecorder = createRecorder(streamRef.current);
                mediaRecorderRef.current = newRecorder;
                newRecorder.start();
            }
        };

        return recorder;

    }, []);

    const startRecording = async () => {

        try {

            setError(null);
            isStoppingRef.current = false;
            chunkSeqRef.current = 0;
            lastAppliedSeqRef.current = 0;

            setSpeaker({
                status: "not_speaking",
                name: "",
                score: ""
            });

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            streamRef.current = stream;

            const recorder = createRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.start();

            setIsRecording(true);

            intervalRef.current = setInterval(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    mediaRecorderRef.current.stop();
                }
            }, 3000);

        } catch (err) {
            setError(err.message);
        }
    };

    const stopRecording = () => {

        isStoppingRef.current = true;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        mediaRecorderRef.current?.stop();

        streamRef.current
            ?.getTracks()
            .forEach(track => track.stop());

        streamRef.current = null;

        setIsRecording(false);
    };

    return {
        isRecording,
        speaker,
        startRecording,
        stopRecording
    };
}