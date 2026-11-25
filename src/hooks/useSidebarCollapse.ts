"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "homepulse_sidebar_collapsed";
const LEGACY_STORAGE_KEY = "homeliocare_sidebar_collapsed";
const LARGE_DESKTOP_MIN_WIDTH = 1400;

function getDesktopPreference(): boolean {
  if (typeof window === "undefined") return false;
  const stored =
    localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (stored === null) return false;
  try {
    return Boolean(JSON.parse(stored));
  } catch {
    return false;
  }
}

let currentCollapsed: boolean | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function computeInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  const isLargeDesktop = window.innerWidth >= LARGE_DESKTOP_MIN_WIDTH;
  return isLargeDesktop ? getDesktopPreference() : true;
}

function getCollapsedSnapshot(): boolean {
  if (currentCollapsed === null && typeof window !== "undefined") {
    currentCollapsed = computeInitialCollapsed();
  }
  return currentCollapsed ?? false;
}

function getServerCollapsedSnapshot(): boolean {
  return false;
}

function subscribeCollapsed(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const mediaQuery = window.matchMedia(
    `(min-width: ${LARGE_DESKTOP_MIN_WIDTH}px)`
  );

  const handleMediaChange = (event: MediaQueryListEvent) => {
    currentCollapsed = event.matches ? getDesktopPreference() : true;
    notifyListeners();
  };

  mediaQuery.addEventListener("change", handleMediaChange);

  return () => {
    listeners.delete(listener);
    mediaQuery.removeEventListener("change", handleMediaChange);
  };
}

function setCollapsedStore(next: boolean) {
  currentCollapsed = next;
  if (typeof window !== "undefined" && window.innerWidth >= LARGE_DESKTOP_MIN_WIDTH) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  notifyListeners();
}

const emptySubscribe = () => () => {};

export function useSidebarCollapse() {
  const isCollapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getServerCollapsedSnapshot
  );

  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const setIsCollapsed = useCallback((next: boolean) => {
    setCollapsedStore(next);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsedStore(!getCollapsedSnapshot());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsedStore(!getCollapsedSnapshot());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isCollapsed,
    hasMounted,
    setIsCollapsed,
    toggleCollapse,
  };
}
