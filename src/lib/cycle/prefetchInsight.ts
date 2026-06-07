// Fire-and-forget cache warm — call after any action that changes cycle/journal data.
// The API route stores the result in the predictions table, so the next page load is instant.
export const prefetchCycleInsight = () => {
  const today = new Date().toLocaleDateString("en-CA");
  fetch(`/api/cycle-insight?date=${today}`, { cache: "no-store" }).catch(() => {});
};
