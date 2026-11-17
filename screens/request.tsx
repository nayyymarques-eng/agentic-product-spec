// Screen: Request. Spec: spec/screens/request.md. Built with ai-ready-design-system, from the detail page template.
// The behaviour lives in src/request.ts; this file only shows it. The root carries data-state, so the checks know
// which state the screen thinks it is in. It shows no fee and no price anywhere: answering is free (BR-06).
import { DetailPage, NavRail, Badge, Banner, Button, Card, Dialog, Field, List, ListItem, Section, Stack } from 'ai-ready-design-system/src';
import { actionsFor, days, daysBetween, dueDate, short, stateOf, type Request, type View } from '../src/request';

export const title = 'Request';

/** The {words} of the spec's Words table, for one request on one day. The checks read the spec's text through it. */
export function words({ request: r, view: v }: { request: Request; view: View }): Record<string, string> {
  const due = dueDate(r);
  const left = daysBetween(v.today, due);
  const d = (day?: string) => (day ? short(day, v.today) : '');
  return {
    due: d(due), received: d(r.received), sent: d(r.sentOn), asked: d(r.proofAskedOn), answered: d(r.answeredOn),
    in: left === 0 ? 'today' : left === 1 ? 'tomorrow' : `in ${left} days`,
    overdue: days(-left),
    late: r.answeredOn ? days(daysBetween(due, r.answeredOn)) : '',
  };
}

export function RequestScreen({ request: r, view: v }: { request: Request; view: View }) {
  const state = stateOf(r, v);
  const w = words({ request: r, view: v });
  const actions = actionsFor(r, v);

  const status = {
    'ST-01': <Badge tone="info">Due on {w.due}</Badge>,
    'ST-02': <Badge tone="warning">Due {w.in}</Badge>,
    'ST-03': <Badge tone="critical">Overdue by {w.overdue}</Badge>,
    'ST-04': <Badge tone="info">Extended to {w.due}</Badge>,
    'ST-05': <Badge>Waiting for proof of identity</Badge>,
    'ST-06': <Badge tone="positive">Answered on {w.answered}</Badge>,
    'ST-07': <Badge tone="info">Due {w.in}</Badge>,
    'ST-08': <Badge>With the privacy lead</Badge>,
    'ST-09': <Badge tone="warning">Due {w.in}</Badge>,
    'ST-10': <Badge tone="critical">Overdue by {w.overdue}</Badge>,
    'ST-11': <Badge tone="warning">Answered {w.late} late</Badge>,
    'ST-12': <Badge tone="info">Due on {w.due}</Badge>,
    'ST-13': <Badge tone="info">Due {w.in}</Badge>,
  }[state];

  const buttons = actions.map(a => <Button key={a.label} variant={a.variant} disabled={a.disabled}>{a.label}</Button>);
  const dialog = {
    'ST-07': { title: 'Extend the due date by two months', field: 'Reason, for the letter to the person', hint: 'The new due date goes in the letter, with this reason.' }, // BR-02
    'ST-13': { title: 'Ask for proof of identity', field: 'Your doubt about who wrote', hint: 'Ask only for what confirms who they are.' },                    // BR-05
    'ST-12': { title: 'Mark as answered', field: 'Date the answer was sent', hint: 'Not after today, and not before the request reached the shop.' },          // BR-04
  }[state as 'ST-07' | 'ST-12' | 'ST-13'];

  const banner = {
    'ST-03': <Banner tone="critical"><p>This request is past its due date. It stays at the top of your list until you mark it as answered.</p></Banner>,
    'ST-10': <Banner tone="critical"><p>This request is past its due date. You asked for proof of identity on {w.asked} and it has not arrived.</p></Banner>,
    'ST-05': <Banner><p>You asked for proof of identity on {w.asked}. Waiting does not move the due date: {w.due}.</p></Banner>,
    'ST-09': <Banner><p>You asked for proof of identity on {w.asked}. Waiting does not move the due date.</p></Banner>,
  }[state as 'ST-03' | 'ST-05' | 'ST-09' | 'ST-10'];

  const says = {
    'ST-06': `Sent from the shop's email on ${w.answered}`,
    'ST-11': `Sent from the shop's email on ${w.answered}, ${w.late} after the due date`,
    'ST-08': `Sent to the privacy lead on ${w.sent}`,
  }[state as 'ST-06' | 'ST-08' | 'ST-11'];

  const history = [
    `Reached the shop on ${w.received}`,
    `Sent to the privacy lead on ${w.sent}`,
    r.proofAskedOn ? `Proof of identity asked for on ${w.asked}` : null,
    r.proofReceivedOn ? `Proof of identity received on ${short(r.proofReceivedOn, v.today)}` : null,
    r.extendedOn ? `Extended on ${short(r.extendedOn, v.today)}` : null,
  ].filter((h): h is string => h !== null);

  return (
    <div data-state={state}>
      <DetailPage
        nav={<NavRail brand="Privacy inbox" items={[{ label: 'Requests', href: '#', current: true }, { label: 'Settings', href: '#' }]} />}
        title="Request to see their data"
        status={status}
        actions={!dialog && buttons.length ? buttons : undefined}
        main={
          <Stack>
            {banner ?? null}
            {says ? <p>{says}</p> : null}
            <Section title="The person's message" titleId="message">
              <Card><p>Hello, I would like a copy of the personal data your shop holds about me, and to know who you shared it with. My last order was in September. Thank you, Alex Romero</p></Card>
            </Section>
          </Stack>
        }
        aside={
          <Stack>
            <Section title="About the request" titleId="about">
              <List>
                <ListItem label="Kind" value="See their data" />
                <ListItem label="From" value="alex@example.com" />
                <ListItem label="Order" value="#10482" />
                <ListItem label="Due date" value={w.due} />
                {r.extendReason ? <ListItem label="Reason for the extension" value={r.extendReason} /> : null}
                {r.proofDoubt ? <ListItem label="Reason for asking for proof" value={r.proofDoubt} /> : null}
              </List>
            </Section>
            <Section title="History" titleId="history">
              <List>{history.map(h => <ListItem key={h}>{h}</ListItem>)}</List>
            </Section>
          </Stack>
        }
      />
      {dialog ? (
        <Dialog id="dialog" title={dialog.title} open actions={buttons}>
          <Field id="draft" label={dialog.field} hint={dialog.hint} />
        </Dialog>
      ) : null}
    </div>
  );
}

/** A sample to preview: E-02 in the spec. */
export default function Sample() {
  return <RequestScreen request={{ received: '2026-11-03', sentOn: '2026-11-03' }} view={{ viewer: 'R-01', today: '2026-11-28' }} />;
}

/** The screen, for the checks. */
export const Screen = RequestScreen;

/** Turns one eval row of the spec into the screen's props. */
export function fromExample(row: Record<string, string>): { request: Request; view: View } {
  const v = (k: string) => (row[k] && row[k] !== '-' ? row[k] : undefined);
  const dialog = v('Dialog') as View['dialog'];
  return {
    request: {
      received: row.Received,
      sentOn: row['Sent on'],
      extendedOn: v('Extended on'),
      extendReason: v('Extended on') ? 'Your request covers five years of orders kept in two systems.' : undefined,
      proofAskedOn: v('Proof asked on'),
      proofDoubt: v('Proof asked on') ? 'The email is not the one on the order.' : undefined,
      proofReceivedOn: v('Proof received on'),
      answeredOn: v('Answered on'),
    },
    view: { viewer: row.Viewer as View['viewer'], today: row.Today, dialog },
  };
}

/** What the code alone decides, before anything is drawn. */
export function behaviour({ request, view }: { request: Request; view: View }) {
  return { due: dueDate(request), state: stateOf(request, view), actions: actionsFor(request, view).map(a => a.label) };
}
