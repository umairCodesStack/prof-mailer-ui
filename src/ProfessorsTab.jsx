import { useEffect, useRef, useState } from 'react'
import { api } from './api'

const FILTERS = [['', 'All'], ['pending', 'Pending'], ['scheduled', 'Scheduled'], ['sent', 'Sent'], ['failed', 'Failed']]
const PAGE_SIZE = 25

export default function ProfessorsTab({ stats, refresh, notify, status, setStatus, fmt, gotoSchedule }) {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0 })
  const [report, setReport] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])
  useEffect(() => { setPage(1) }, [status])

  const signature = JSON.stringify(stats?.counts)
  useEffect(() => {
    let alive = true
    api.list({ status, q: debouncedQ, page, pageSize: PAGE_SIZE })
      .then((d) => alive && setData(d))
      .catch((e) => notify(e.message, 'err'))
    return () => { alive = false }
  }, [status, debouncedQ, page, signature])

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const failed = stats?.counts?.failed || 0

  async function onImport(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const r = await api.importExcel(file)
      setReport(r)
      notify(`Imported ${r.added} professor${r.added === 1 ? '' : 's'}`)
      refresh()
    } catch (err) { notify(err.message, 'err') }
    setBusy(false)
  }

  async function act(fn, okMsg) {
    try { await fn(); notify(okMsg); refresh() } catch (e) { notify(e.message, 'err') }
  }

  return (
    <div>
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by status">
          {FILTERS.map(([k, l]) => (
            <button key={k} className={'chip' + (status === k ? ' on' : '')} onClick={() => setStatus(k)}>{l}</button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Search name, email or university"
          aria-label="Search professors" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="actions">
          {failed > 0 && <button className="btn" onClick={() => act(api.retryFailed, 'Failed emails moved back to pending')}>Retry {failed} failed</button>}
          <button className="btn" onClick={() => act(api.downloadExcel, 'Excel downloaded')}>Download Excel</button>
          <button className="btn primary" disabled={busy} onClick={() => fileRef.current.click()}>
            {busy ? 'Importing…' : 'Import Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm" hidden onChange={onImport} />
        </div>
      </div>

      {report && (
        <div className="panel report">
          <div className="row between">
            <p><b>{report.added}</b> added, <b>{report.skipped_count}</b> skipped.
              {report.added > 0 && <> <button className="link" onClick={gotoSchedule}>Schedule them</button></>}</p>
            <button className="link" onClick={() => setReport(null)}>Dismiss</button>
          </div>
          {report.skipped.length > 0 && (
            <ul className="skipped">
              {report.skipped.slice(0, 8).map((s, i) => (
                <li key={i}>{s.row ? `Row ${s.row}` : 'Row'}: {s.reason}{s.email ? ` (${s.email})` : ''}</li>
              ))}
              {report.skipped.length > 8 && <li>and {report.skipped.length - 8} more</li>}
            </ul>
          )}
        </div>
      )}

      {stats && stats.total === 0 ? (
        <div className="empty">
          <h2>No professors yet</h2>
          <p>Import an Excel file with the columns <b>University</b>, <b>Professor Name</b> and <b>Email</b>.</p>
          <button className="btn primary" onClick={() => fileRef.current.click()}>Import Excel</button>
        </div>
      ) : (
        <>
          <div className="tablewrap">
            <table>
              <thead>
                <tr><th>University</th><th>Professor</th><th>Email</th><th>Status</th><th>When</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.university || <span className="muted">—</span>}</td>
                    <td>{p.name}</td>
                    <td className="email">{p.email}</td>
                    <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                    <td className="when">
                      {p.status === 'sent' && fmt(p.sent_at)}
                      {p.status === 'scheduled' && fmt(p.scheduled_at)}
                      {p.status === 'failed' && <span className="err" title={p.error_message}>{p.error_message}</span>}
                    </td>
                    <td className="rowact">
                      {p.status === 'scheduled' && (
                        <button className="link" onClick={() => act(() => api.unschedule([p.id]), 'Unscheduled')}>Unschedule</button>
                      )}
                      {p.status !== 'sending' && p.status !== 'sent' && (
                        <button className="link danger" onClick={() => act(() => api.remove(p.id), 'Removed')}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr><td colSpan="6" className="muted center">No professors match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span>{data.total} professor{data.total === 1 ? '' : 's'}</span>
            <div>
              <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="pageno">Page {page} of {pages}</span>
              <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
