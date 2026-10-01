"use client";

import { useSyncExternalStore } from "react";

/**
 * The open photograph, stored in the URL fragment.
 *
 * The fragment is the single source of truth, so a pasted link, a search
 * result and the browser's back button all land on the same photo without a
 * second copy of the state to keep in step. `history.replaceState` does not
 * emit `hashchange`, so writes notify the subscribers here.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

function getSnapshot(): string {
  return decodeURIComponent(window.location.hash.slice(1));
}

/** Nothing is open while the page is being prerendered. */
function getServerSnapshot(): string {
  return "";
}

export function usePhotoHash(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setPhotoHash(id: string | null): void {
  window.history.replaceState(
    null,
    "",
    id
      ? `#${encodeURIComponent(id)}`
      : `${window.location.pathname}${window.location.search}`,
  );
  for (const onChange of listeners) onChange();
}
