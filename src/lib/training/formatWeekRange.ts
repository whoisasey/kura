// Returns "Jun 7–13" (same month) or "May 31 – Jun 6" (spans months)
// weekStartDate is always a Sunday; end is the following Saturday (+6 days)
export const formatWeekRange = (weekStartDate: string): string => {
  const start = new Date(`${weekStartDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const monthFmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

  if (start.getMonth() === end.getMonth()) {
    return `${monthFmt(start)} ${start.getDate()}–${end.getDate()}`;
  }
  return `${monthFmt(start)} ${start.getDate()} – ${monthFmt(end)} ${end.getDate()}`;
};
