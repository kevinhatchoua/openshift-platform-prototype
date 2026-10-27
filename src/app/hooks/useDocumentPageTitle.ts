import { useEffect } from "react";
import { useLocation } from "react-router";
import {
  formatDocumentTitle,
  readPageTitleFromDom,
} from "../../lib/documentPageTitle";
import { pageTitleFromPath } from "../../lib/pageTitleFromPath";

const MAIN_CONTENT_ID = "app-main-container";

function resolveAndApplyTitle(): void {
  const root = document.getElementById(MAIN_CONTENT_ID);
  const pageTitle = readPageTitleFromDom(root) ?? pageTitleFromPath(window.location.pathname);
  document.title = formatDocumentTitle(pageTitle);
}

/**
 * Keeps `document.title` in sync with the visible page h1 (or route fallback).
 */
export function useDocumentPageTitle(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    let raf = 0;
    let debounce: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(resolveAndApplyTitle);
      }, 0);
    };

    schedule();

    const root = document.getElementById(MAIN_CONTENT_ID);
    const observer =
      root &&
      new MutationObserver(() => {
        schedule();
      });

    if (observer && root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      if (debounce) clearTimeout(debounce);
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [pathname]);
}
