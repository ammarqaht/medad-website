/* Shared in-memory state of the Injaz demo. One reducer feeds the participant
   and the supervisor, so a review shows up in the participant's tasks and the
   leaderboard in the same session. Nothing is persisted. */
import { people, seedSubs, subKey, tasks, type Person, type Submission } from '../../data/injaz';

export interface State {
  subs: Record<string, Submission>;
  /** Bumped on reset so every view remounts with clean local state. */
  epoch: number;
}

export type Action =
  | { type: 'submit'; person: string; task: string; text: string }
  | { type: 'review'; key: string; ok: boolean; grade: number; feedback: string }
  | { type: 'reset' };

export const initial = (epoch = 0): State => ({ subs: seedSubs(), epoch });

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'submit': {
      // one record per participant per task: update it in place (upsert)
      const k = subKey(action.person, action.task);
      const old = state.subs[k];
      // a submission is sent once, and again only after a redo request
      if (old && old.status !== 'returned') return state;
      const next: Submission = { text: action.text, status: 'pending', grade: 0, feedback: '', sent: (old?.sent ?? 0) + 1 };
      return { ...state, subs: { ...state.subs, [k]: next } };
    }
    case 'review': {
      const old = state.subs[action.key];
      if (!old || old.status !== 'pending') return state;
      const max = taskById(action.key.split(':')[1]).max;
      const grade = Math.min(max, Math.max(0, Math.round(action.grade)));
      const next: Submission = action.ok
        ? { ...old, status: 'approved', grade, feedback: action.feedback }
        : { ...old, status: 'returned', grade: 0, feedback: action.feedback };
      return { ...state, subs: { ...state.subs, [action.key]: next } };
    }
    case 'reset':
      return initial(state.epoch + 1);
  }
}

export interface Standing {
  person: Person;
  points: number;
  done: number;
  rank: number;
}

/** Points = earlier points + grades of approved submissions. Ties share a rank. */
export function standings(subs: State['subs']): Standing[] {
  const rows = people.map((p) => {
    let points = p.base;
    let done = p.doneBefore;
    for (const t of tasks) {
      const s = subs[subKey(p.id, t.id)];
      if (s?.status === 'approved') {
        points += s.grade;
        done++;
      }
    }
    return { person: p, points, done, rank: 0 };
  });
  rows.sort((a, b) => b.points - a.points || a.person.name.localeCompare(b.person.name, 'ar'));
  rows.forEach((r, i) => {
    r.rank = i > 0 && rows[i - 1].points === r.points ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

export const personById = (id: string): Person => people.find((p) => p.id === id)!;
export const taskById = (id: string) => tasks.find((t) => t.id === id)!;

const AR = '٠١٢٣٤٥٦٧٨٩';
/** Arabic-Indic digits for display. */
export const ar = (n: number | string): string => String(n).replace(/\d/g, (d) => AR[Number(d)]);

export function pointsText(n: number): string {
  if (n === 0) return 'لا نقاط';
  if (n === 1) return 'نقطة واحدة';
  if (n === 2) return 'نقطتان';
  if (n <= 10) return `${ar(n)} نقاط`;
  return `${ar(n)} نقطة`;
}
