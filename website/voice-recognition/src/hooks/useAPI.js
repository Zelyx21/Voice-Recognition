import { useState } from "react";

const API_URL = "http://localhost:8000";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Erreur ${response.status}`);
      }

      return await response.json();

    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("No access to server");
      } else {
        setError(err.message);
      }
      return null;

    } finally {
      setLoading(false);
    }
  };

  return { call, loading, error, setError };
}