import type { TrainingPlan, TrainingWeek, PlannedSession, SessionType } from "@/types/training";

const SESSION_TYPE_VALUES: SessionType[] = ['run', 'tempo', 'heavy', 'unilateral', 'rest'];

const validatePlan = (raw: unknown): TrainingPlan => {
  if (!raw || typeof raw !== 'object') throw new Error("Plan must be an object");
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string') throw new Error("Missing required field: name");
  if (typeof r.totalWeeks !== 'number') throw new Error("Missing required field: totalWeeks");
  if (typeof r.currentWeek !== 'number') throw new Error("Missing required field: currentWeek");
  if (!Array.isArray(r.weeks)) throw new Error("Missing required field: weeks");

  const weeks: TrainingWeek[] = r.weeks.map((w: unknown, wi: number) => {
    if (!w || typeof w !== 'object') throw new Error(`Week ${wi} is invalid`);
    const ww = w as Record<string, unknown>;
    if (typeof ww.weekNumber !== 'number') throw new Error(`Week ${wi} missing weekNumber`);
    if (!Array.isArray(ww.sessions)) throw new Error(`Week ${wi} missing sessions`);

    const sessions: PlannedSession[] = ww.sessions.map((s: unknown, si: number) => {
      if (!s || typeof s !== 'object') throw new Error(`Session ${si} in week ${wi} is invalid`);
      const ss = s as Record<string, unknown>;
      if (typeof ss.dayOfWeek !== 'number') throw new Error(`Session ${si} missing dayOfWeek`);
      if (!SESSION_TYPE_VALUES.includes(ss.type as SessionType)) throw new Error(`Session ${si} has invalid type`);
      if (typeof ss.label !== 'string') throw new Error(`Session ${si} missing label`);
      const session: PlannedSession = {
        dayOfWeek: ss.dayOfWeek as number,
        type: ss.type as SessionType,
        label: ss.label as string,
      };
      if (typeof ss.sub === 'string') session.sub = ss.sub;
      if (typeof ss.distanceKm === 'number') session.distanceKm = ss.distanceKm;
      if (typeof ss.durationMin === 'number') session.durationMin = ss.durationMin;
      if (typeof ss.notes === 'string') session.notes = ss.notes;
      return session;
    });

    const week: TrainingWeek = { weekNumber: ww.weekNumber as number, sessions };
    if (typeof ww.phase === 'string') week.phase = ww.phase;
    if (typeof ww.isDeload === 'boolean') week.isDeload = ww.isDeload;
    if (typeof ww.weeklyKm === 'number') week.weeklyKm = ww.weeklyKm;
    return week;
  });

  const plan: TrainingPlan = {
    name: r.name as string,
    totalWeeks: r.totalWeeks as number,
    currentWeek: r.currentWeek as number,
    weeks,
  };
  if (typeof r.id === 'string') plan.id = r.id;
  if (typeof r.description === 'string') plan.description = r.description;
  return plan;
};

export const parseJsonPlan = (json: string): TrainingPlan => {
  const raw = JSON.parse(json) as unknown;
  return validatePlan(raw);
};

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const SESSION_TYPES: SessionType[] = ['run', 'tempo', 'heavy', 'unilateral', 'rest'];

export const parseMarkdownPlan = (md: string): TrainingPlan => {
  const lines = md.split('\n');

  let name = 'Training Plan';
  let currentWeek = 1;
  let totalWeeks = 8;
  const weeks: TrainingWeek[] = [];
  let currentWeekData: TrainingWeek | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Title
    if (line.startsWith('# ')) {
      name = line.slice(2).trim();
      continue;
    }

    // Metadata lines (key: value)
    const metaMatch = line.match(/^(\w+):\s*(.+)$/);
    if (metaMatch && !line.startsWith('#') && !line.startsWith('-')) {
      const key = metaMatch[1].toLowerCase();
      const val = parseInt(metaMatch[2], 10);
      if (key === 'currentweek' && !isNaN(val)) currentWeek = val;
      if (key === 'totalweeks' && !isNaN(val)) totalWeeks = val;
      continue;
    }

    // Week header: ## Week 4 | Build 1
    if (line.startsWith('## ')) {
      if (currentWeekData) weeks.push(currentWeekData);
      const weekLine = line.slice(3).trim();
      const parts = weekLine.split('|').map(p => p.trim());
      const weekNumMatch = parts[0].match(/Week\s+(\d+)/i);
      const weekNum = weekNumMatch ? parseInt(weekNumMatch[1], 10) : weeks.length + 1;
      const phase = parts[1] ?? undefined;
      currentWeekData = {
        weekNumber: weekNum,
        phase,
        isDeload: phase?.toLowerCase().includes('deload'),
        sessions: [],
      };
      continue;
    }

    // Session line: - Sun: heavy | Heavy Lift | Full body compound
    if (line.startsWith('- ') && currentWeekData) {
      const content = line.slice(2).trim();
      const dayMatch = content.match(/^(\w+):\s*/);
      if (!dayMatch) continue;

      const dayStr = dayMatch[1].toLowerCase();
      const dayOfWeek = DAY_MAP[dayStr];
      if (dayOfWeek === undefined) continue;

      const rest = content.slice(dayMatch[0].length).trim();
      const parts = rest.split('|').map(p => p.trim());

      const rawType = parts[0]?.toLowerCase() ?? 'rest';
      const type: SessionType = SESSION_TYPES.includes(rawType as SessionType)
        ? (rawType as SessionType)
        : 'rest';
      const label = parts[1] ?? type;
      const sub = parts[2];

      const session: PlannedSession = { dayOfWeek, type, label };
      if (sub) session.sub = sub;

      currentWeekData.sessions.push(session);
    }
  }

  if (currentWeekData) weeks.push(currentWeekData);

  return { name, totalWeeks, currentWeek, weeks };
};
