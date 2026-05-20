import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

export function useApi(token = null, setIsAuthenticated = null, setUser = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate()

  const call = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    const headers = {...options.headers}
    if (token) headers["Authorization"] = `Bearer ${token}`
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401){
          if (setIsAuthenticated) setIsAuthenticated(false)
          if (setUser) setUser(null)
          if (navigate) navigate("/login?expired=true")
            return null
        }
        if (response.status === 429){
          throw new Error("Too many attempts, please wait a minute before trying again")
        }
        throw new Error(data.detail || `Erreur ${response.status}`);
      }

      return await response.json();

    } catch (err) {
      console.log(err)
      
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