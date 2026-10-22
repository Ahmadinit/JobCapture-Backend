import { useCallback, useEffect, useState } from 'react';

const SAVED_STORAGE_KEY = 'jobcapture_saved_jobs_v1';
const APPLIED_STORAGE_KEY = 'jobcapture_applied_jobs_v1';

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // quota exceeded or private mode
  }
}

export function useUserJobState() {
  const [savedMap, setSavedMap] = useState(() => readStorage(SAVED_STORAGE_KEY));
  const [appliedMap, setAppliedMap] = useState(() => readStorage(APPLIED_STORAGE_KEY));

  useEffect(() => {
    writeStorage(SAVED_STORAGE_KEY, savedMap);
  }, [savedMap]);

  useEffect(() => {
    writeStorage(APPLIED_STORAGE_KEY, appliedMap);
  }, [appliedMap]);

  const isSaved = useCallback(id => Boolean(savedMap[id]), [savedMap]);
  const isApplied = useCallback(id => Boolean(appliedMap[id]), [appliedMap]);

  const toggleSave = useCallback((job, e) => {
    if (e) e.stopPropagation();
    if (!job?._id) return;
    setSavedMap(prev => {
      const next = { ...prev };
      if (next[job._id]) {
        delete next[job._id];
      } else {
        next[job._id] = job;
      }
      return next;
    });
  }, []);

  const markApplied = useCallback((job, e) => {
    if (e) e.stopPropagation();
    if (!job?._id) return;
    setAppliedMap(prev => ({
      ...prev,
      [job._id]: {
        ...job,
        appliedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const unmarkApplied = useCallback((id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    setAppliedMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const savedList = Object.values(savedMap);
  const appliedList = Object.values(appliedMap).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  return {
    isSaved,
    isApplied,
    toggleSave,
    markApplied,
    unmarkApplied,
    savedList,
    appliedList,
    savedCount: savedList.length,
    appliedCount: appliedList.length,
  };
}
