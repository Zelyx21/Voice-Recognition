import { useTranslation } from "react-i18next";

import "./styles/App.css";

import { useApi } from "./hooks/useAPI";
import { useLiveRecording } from "./hooks/useLiveRecording";

function LiveIdentify() {

    const { t } = useTranslation();

    const {
        call,
        loading,
        error,
        setError
    } = useApi();

    const {

        isRecording,
        speaker,

        startRecording,
        stopRecording

    } = useLiveRecording(call, setError);

    return (

        <div className="box" style={{ alignItems: "center" }}>

            <h2>Live Speaker Identification</h2>

            {!isRecording ? (

                <button
                    className="button"
                    onClick={startRecording}
                >
                    Start
                </button>

            ) : (

                <button
                    className="remove"
                    onClick={stopRecording}
                >
                    Stop
                </button>

            )}

            <br />
            <br />

            <div className="speaker-result">

                {speaker.status === "not_speaking" && (

                    <div className="speaker-result-row">

                        <span className="speaker-result-label">

                            Status

                        </span>

                        <span className="speaker-result-value">

                            Not speaking

                        </span>

                    </div>

                )}

                {speaker.status === "unknown" && (

                    <>

                        <div className="speaker-result-row">

                            <span className="speaker-result-label">

                                Speaker

                            </span>

                            <span className="speaker-result-value">

                                Unknown

                            </span>

                        </div>

                        <div className="speaker-result-row">

                            <span className="speaker-result-label">

                                Score

                            </span>

                            <span className="speaker-result-value">

                                {speaker.score}

                            </span>

                        </div>

                    </>

                )}

                {speaker.status === "success" && (

                    <>

                        <div className="speaker-result-row">

                            <span className="speaker-result-label">

                                Speaker

                            </span>

                            <span className="speaker-result-value">

                                {speaker.name}

                            </span>

                        </div>

                        <div className="speaker-result-row">

                            <span className="speaker-result-label">

                                Score

                            </span>

                            <span className="speaker-result-value score">

                                {speaker.score}

                            </span>

                        </div>

                    </>

                )}

            </div>

            {error && (

                <p style={{ color: "red" }}>

                    {error}

                </p>

            )}

        </div>

    );

}

export default LiveIdentify;