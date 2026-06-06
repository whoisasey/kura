// Returns "Jun 2–8" (same month) or "May 26 – Jun 1" (spans months)
export const formatWeekRange = (weekStartDate: string): string => {
  // Append time to avoid timezone-shifted date parsing
  const mon = new Date(`${weekStartDate}T00:00:00`);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);

  const monthFmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

  if (mon.getMonth() === sun.getMonth()) {
    return `${monthFmt(mon)} ${mon.getDate()}–${sun.getDate()}`;
  }
  return `${monthFmt(mon)} ${mon.getDate()} – ${monthFmt(sun)} ${sun.getDate()}`;
};
