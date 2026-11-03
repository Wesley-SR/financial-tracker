import { AppState, initialState } from "./model";

const STORAGE_KEY = "financial-tracker:v1";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...initialState,
      ...parsed,
      profile: { ...initialState.profile, ...parsed.profile },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    };
  } catch {
    return initialState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadBackup(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `financial-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function parseBackup(file: File): Promise<AppState> {
  const raw = await file.text();
  const parsed = JSON.parse(raw) as AppState;

  if (!parsed.profile || !Array.isArray(parsed.transactions)) {
    throw new Error("Arquivo de backup inválido.");
  }

  return {
    ...initialState,
    ...parsed,
    configured: true,
    profile: { ...initialState.profile, ...parsed.profile },
  };
}
