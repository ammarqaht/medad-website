/* Shared in-memory state of the Halqah demo. One reducer feeds all three
   portals, so what the teacher saves is what the supervisor and the student
   read. Nothing is persisted: no storage, no network. */
import {
  DAYS,
  LINES,
  POINTS,
  TODAY,
  circles,
  key,
  seedEntries,
  students,
  type Entry,
  type Student,
} from '../../data/halqah';

export interface State {
  entries: Record<string, Entry>;
  /** Bumped on reset so every portal remounts with clean local state. */
  epoch: number;
}

export type Action =
  | { type: 'save'; week: number; day: number; student: string; entry: Entry }
  | { type: 'reset' };

export const initial = (epoch = 0): State => ({ entries: seedEntries(), epoch });

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'save':
      return { ...state, entries: { ...state.entries, [key(action.week, action.day, action.student)]: action.entry } };
    case 'reset':
      return initial(state.epoch + 1);
  }
}

const AR = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits for display. */
export const ar = (n: number): string => String(n).replace(/\d/g, (d) => AR[Number(d)]);

/** Arabic number agreement for errors. */
export function errorsText(n: number, none: string): string {
  if (n === 0) return none;
  if (n === 1) return 'خطأ واحد';
  if (n === 2) return 'خطآن';
  if (n <= 10) return `${ar(n)} أخطاء`;
  return `${ar(n)} خطأ`;
}

export const isFuture = (week: number, day: number): boolean => week === 0 && day > TODAY;

export const studentsOf = (circle: string): Student[] => students.filter((s) => s.circle === circle);
export const studentById = (id: string): Student => students.find((s) => s.id === id)!;
export const circleById = (id: string) => circles.find((c) => c.id === id)!;

export function earned(e: Entry | undefined): number {
  if (!e || e.att === 'absent') return 0;
  let p = POINTS.attend;
  for (const l of LINES) if (e.lines[l].done) p += POINTS[l];
  return p;
}

export function balance(entries: State['entries'], s: Student): number {
  let total = s.base;
  for (const [k, e] of Object.entries(entries)) if (k.endsWith(`:${s.id}`)) total += earned(e);
  return total;
}

export interface Tally {
  present: number;
  late: number;
  absent: number;
  missing: number;
  total: number;
}

export function tally(entries: State['entries'], circle: string, week: number, day: number): Tally {
  const list = studentsOf(circle);
  const t: Tally = { present: 0, late: 0, absent: 0, missing: 0, total: list.length };
  for (const s of list) {
    const e = entries[key(week, day, s.id)];
    if (e) t[e.att]++;
    else t.missing++;
  }
  return t;
}

export const dayIndexes = DAYS.map((_, i) => i);
