const ORDER = [
  ['pending', 'Pending'],
  ['scheduled', 'Scheduled'],
  ['sent', 'Sent'],
  ['failed', 'Failed'],
]

export default function Pipeline({ stats, active, onPick, fmt }) {
  const c = stats?.counts || {}
  const total = stats?.total || 0
  return (
    <section className="pipeline" aria-label="Email progress">
      <div className="bar" role="img"
        aria-label={ORDER.map(([k, l]) => `${l}: ${c[k] || 0}`).join(', ')}>
        {total === 0 && <span className="seg empty" style={{ flexGrow: 1 }} />}
        {ORDER.map(([k]) => c[k] ? <span key={k} className={`seg ${k}`} style={{ flexGrow: c[k] }} /> : null)}
      </div>
      <ul className="legend">
        {ORDER.map(([k, label]) => (
          <li key={k}>
            <button className={active === k ? 'on' : ''} onClick={() => onPick(active === k ? '' : k)}
              aria-pressed={active === k}>
              <i className={`dot ${k}`} />{label} <b>{c[k] || 0}</b>
            </button>
          </li>
        ))}
        <li className="meta">
          Sent today <b>{stats?.sent_today ?? 0}</b> of {stats?.daily_limit ?? 0}
          {stats?.next_scheduled_at && <> · next email {fmt(stats.next_scheduled_at)}</>}
        </li>
      </ul>
    </section>
  )
}
