import { useState, useRef } from 'react'
import './../styles/App.css'
import { useApi } from './../hooks/useAPI'
import { useRecording } from './../hooks/useRecording'

export default function ButtonRecord({isRecording, audioURL, setError, startRecording, stopRecording, recordingTime}) {

    const EXAMPLE_SENTENCES = {
        None: "None",
        English:
            "Of course I'm angry ! You dropped an old hammer on my lap ! Do you know what time the meeting starts ? " +
            "Can you bring these books back to the library ? Trees also provide shade, and they can temper the climate. " +
            "The city lies at the mouth of the river.",
        French:
            "Bonjour, comment allez-vous aujourd'hui ? Chaque chercheur poursuit ses propres hypothèses. " +
            "Les journalistes interrogent plusieurs témoins. Le spectateur applaudit chaleureusement les musiciens. " +
            "Le système détecte correctement la voix humaine.",

    }

    const [exempleLanguage, setExempleLanguage] = useState("")


    return (

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

        <div>
            <p>Say anything !</p>
            <p>You don't know what to say ? Choose a language and get example sentences</p>

            <select
            id="exemple"
            value={exempleLanguage}
            onChange={(e) => setExempleLanguage(e.target.value)}
            >
            {Object.entries(EXAMPLE_SENTENCES).map( ([key, value]) => (
            <option key={key} value={key}>{key}</option>
            ))}

            </select>
            
            <div className="text_Exemple">

                {exempleLanguage !== "None" && (
                    EXAMPLE_SENTENCES[exempleLanguage]
                )}
            </div>

        </div>

    </div>

    );
}
