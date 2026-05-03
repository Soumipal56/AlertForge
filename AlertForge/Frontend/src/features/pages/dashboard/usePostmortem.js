import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import { postmortemApi } from "@/api/postmortem.api";
import { normalizePostmortem } from "@/lib/mapper";

export function usePostmortem() {
  const { incidentId } = useParams();
  const [pm, setPm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPostmortem = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postmortemApi.getByIncident(incidentId);
      setPm(normalizePostmortem(data));
    } catch (err) {
      console.error("[usePostmortem] Failed to fetch postmortem:", err);
      // If 404, we might not have one yet, which is fine
      if (err.status === 404) {
        setPm(null);
      } else {
        setError("Failed to load postmortem data");
      }
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    if (incidentId) fetchPostmortem();
  }, [incidentId, fetchPostmortem]);

  const handleGenerate = async () => {
    try {
      setAiLoading(true);
      const data = await postmortemApi.generate(incidentId);
      setPm(normalizePostmortem(data));
    } catch (err) {
      console.error("[usePostmortem] AI Generation failed:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const updateField = async (payload) => {
    try {
      const data = await postmortemApi.update(incidentId, payload);
      setPm(normalizePostmortem(data));
    } catch (err) {
      console.error("[usePostmortem] Update failed:", err);
    }
  };

  const advanceStatus = async (nextStatus) => {
    await updateField({ status: nextStatus.toLowerCase() });
  };

  return {
    pm,
    loading,
    aiLoading,
    error,
    handleGenerate,
    updateField,
    advanceStatus,
    refresh: fetchPostmortem,
  };
}
