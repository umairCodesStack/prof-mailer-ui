import { useEffect, useState } from 'react'
import { api } from './api'

function defaultStart() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`
}

export default function ScheduleTab({ stats, refresh, notify, gotoMessage }) {
  const [start, setStart] = useState(defaultStart())
  const [interval, setIntervalMin] = useState(4)
  const [jitter, setJitter] = useState(90)
  const [perDay, setPerDay] = useState(30)
  const [cv, setCv] = useState(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.getTemplate().then((t) => setCv(t.cv)).catch(() => {}) }, [])

  const pending = stats?.counts?.pending || 0
  const scheduled = stats?.counts?.scheduled || 0
  const days = perDay ? Math.ceil(pending / perDay) : 1
  const lastDayCount = perDay ? pending - (days - 1) * perDay : pending
  const lastDayMinutes = Math.round(Math.max(0, lastDayCount - 1) * interval)
  const canSchedule = pending > 0 && cv && !busy

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api.schedule({
        start_time: start,
        interval_minutes: Number(interval),
        jitter_seconds: Number(jitter),
        per_day: perDay ? Number(perDay) : null,
      })
      notify(`Scheduled ${r.scheduled} email${r.scheduled === 1 ? '' : 's'}`)
      refresh()
    } catch (err) { notify(err.message, 'err') }
    setBusy(false)
  }

  async function cancelAll() {
    try {
      const r = await api.unschedule()
      notify(`Cancelled ${r.unscheduled} scheduled email${r.unscheduled === 1 ? '' : 's'}`)
      refresh()
    } catch (err) { notify(err.message, 'err') }
  }

  return (
    <div className="split">
      <form className="panel form" onSubmit={submit}>
        <h2>Schedule emails</h2>
        <p className="hint">
          Sends to every pending professor, spread out over time. Times are in {stats?.timezone || 'your server time zone'}.
        </p>

        {cv === null && (
          <p className="notice">Upload your CV before scheduling. <button type="button" className="link" onClick={gotoMessage}>Go to Message</button></p>
        )}

        <label>First email goes out at
          <input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <div className="grid3">
          <label>Minutes between emails
            <input type="number" min="0" step="0.5" value={interval} onChange={(e) => setIntervalMin(e.target.value)} />
          </label>
          <label>Random extra delay (seconds)
            <input type="number" min="0" value={jitter} onChange={(e) => setJitter(e.target.value)} />
          </label>
          <label>Emails per day
            <input type="number" min="1" placeholder="No limit" value={perDay} onChange={(e) => setPerDay(e.target.value)} />
          </label>
        </div>
        <p className="hint">Gmail works best at 20 to 40 emails a day with gaps between them. Bursts often land in spam.</p>

        <div className="row">
          <button className="btn primary" disabled={!canSchedule}>
            {busy ? 'Scheduling…' : `Schedule ${pending} email${pending === 1 ? '' : 's'}`}
          </button>
          {scheduled > 0 && (
            <button type="button" className="btn" onClick={cancelAll}>Cancel {scheduled} scheduled</button>
          )}
        </div>
      </form>

      <aside className="panel summary">
        <h2>What will happen</h2>
        {pending === 0 ? (
          <p className="muted">No pending professors. Import an Excel file, or move failed emails back to pending.</p>
        ) : (
          <ul>
            <li><b>{pending}</b> pending professor{pending === 1 ? '' : 's'} will be scheduled.</li>
            <li>Over about <b>{days}</b> day{days === 1 ? '' : 's'}{perDay ? `, up to ${perDay} per day` : ''}.</li>
            <li>Each day's batch takes about <b>{lastDayMinutes >= 60 ? `${Math.floor(lastDayMinutes / 60)} h ${lastDayMinutes % 60} min` : `${lastDayMinutes} min`}</b> to finish.</li>
            <li>The CV <b>{cv ? cv.split(/[\\/]/).pop() : 'is missing'}</b> is attached to each one.</li>
          </ul>
        )}
        {stats?.dry_run && <p className="notice">Dry run is on. Emails are logged by the server but not really sent.</p>}
      </aside>
    </div>
  )
}
