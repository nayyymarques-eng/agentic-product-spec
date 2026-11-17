// The request's behaviour, in one place: its due date, its state and the actions it offers.
// Each function cites the rules it applies. Spec: spec/screens/request.md, spec/rules.md.

export type Role = 'R-01' | 'R-02';
export type StateId = 'ST-01' | 'ST-02' | 'ST-03' | 'ST-04' | 'ST-05' | 'ST-06' | 'ST-07' | 'ST-08' | 'ST-09' | 'ST-10' | 'ST-11' | 'ST-12' | 'ST-13';
export type Action = { label: string; variant: 'primary' | 'secondary' | 'tertiary'; disabled?: boolean };

/** Dates are days, written YYYY-MM-DD, in the shop's time zone. */
export type Request = {
  received: string;
  sentOn: string;
  extendedOn?: string;
  extendReason?: string;
  proofAskedOn?: string;
  proofDoubt?: string;
  proofReceivedOn?: string;
  answeredOn?: string;
};

/** A dialog open on the screen, and what the lead has written in it so far. */
export type Dialog = 'extend' | 'proof' | 'answer';
export type View = { viewer: Role; today: string; dialog?: Dialog; draft?: string };

const DAY = 86_400_000;
const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
const toDay = (d: Date) => d.toISOString().slice(0, 10);

/** The same day, n months later; the last day of that month when it has no such day (Q-02). */
export function addMonths(day: string, n: number): string {
  const d = toDate(day);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), last));
  return toDay(target);
}

/** Days from one day to another: negative once the second day has passed. */
export const daysBetween = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY);

/** BR-01, BR-02: one month after the request reached the shop; three once extended (Q-03). Proof of identity moves nothing (BR-05). */
export function dueDate(r: Request): string {
  return addMonths(r.received, r.extendedOn ? 3 : 1);
}

/** BR-05: asked for proof, and it has not arrived. */
const waitingForProof = (r: Request) => Boolean(r.proofAskedOn && !r.proofReceivedOn);

/** Which state the screen is in. The order is the spec's: the first state that applies wins. */
export function stateOf(r: Request, v: View): StateId {
  const left = daysBetween(v.today, dueDate(r));
  if (r.answeredOn) return daysBetween(dueDate(r), r.answeredOn) > 0 ? 'ST-11' : 'ST-06'; // BR-04, BR-03
  if (v.viewer === 'R-02') return 'ST-08';                                               // BR-08
  if (v.dialog === 'answer' && !v.draft?.trim()) return 'ST-12';                          // BR-04
  if (left < 0) return waitingForProof(r) ? 'ST-10' : 'ST-03';                            // BR-03: closes any other dialog
  if (v.dialog === 'extend' && !v.draft?.trim()) return 'ST-07';                          // BR-02
  if (v.dialog === 'proof' && !v.draft?.trim()) return 'ST-13';                           // BR-05
  if (waitingForProof(r)) return left <= 7 ? 'ST-09' : 'ST-05';                           // BR-05, BR-07
  if (left <= 7) return 'ST-02';                                                         // BR-07
  if (r.extendedOn) return 'ST-04';                                                      // BR-02
  return 'ST-01';
}

/** The buttons the state offers, in order. */
export function actionsFor(r: Request, v: View): Action[] {
  const answer: Action = { label: 'Mark as answered', variant: 'primary' };
  const extend: Action = { label: 'Extend', variant: 'secondary' };
  const ask: Action = { label: 'Ask for proof of identity', variant: 'tertiary' };
  const received: Action = { label: 'Proof received', variant: 'primary' };
  const cancel: Action = { label: 'Cancel', variant: 'tertiary' };
  const once = r.extendedOn ? [] : [extend];                 // extended once (BR-02)
  switch (stateOf(r, v)) {
    case 'ST-06': case 'ST-08': case 'ST-11': return [];
    case 'ST-12': return [{ label: 'Mark as answered', variant: 'primary', disabled: true }, cancel];
    case 'ST-07': return [{ label: 'Extend', variant: 'primary', disabled: true }, cancel];
    case 'ST-13': return [{ label: 'Ask', variant: 'primary', disabled: true }, cancel];
    case 'ST-10': return [received, { ...answer, variant: 'tertiary' }]; // no Extend once the due date has passed (BR-02); answering stays least prominent (Q-05)
    case 'ST-03': return [answer];
    case 'ST-09': case 'ST-05': return [received, ...once, { ...answer, variant: 'tertiary' }];
    case 'ST-04': return [answer, ask];
    default: return [answer, ...once, ask];
  }
}

/** "3 Dec", with the year when it is not today's year: "3 Feb 2027". */
export const short = (day: string, today: string) => toDate(day).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'short', ...(day.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}), timeZone: 'UTC',
});

/** "1 day", "5 days" */
export const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
