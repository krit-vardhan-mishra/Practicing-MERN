import { useEffect } from "react";

export function setPageTitle(str) {
  useEffect(() => {
    document.title = str;
  }, [str]);
}

export function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}