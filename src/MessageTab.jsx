import { useEffect, useRef, useState } from 'react'
import { api } from './api'

export default function MessageTab({ stats, notify }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [cv, setCv] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [busy, setBusy] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    api.getTemplate().then((t) => {
      setSubject(t.subject); setBody(t.body); setCv(t.cv); setLoaded(true)
    }).catch((e) => notify(e.message, 'err'))
  }, [])

  const preview = (s) => s.replaceAll('{name}', 'Li Wei').replaceAll('{university}', 'Nanjing University')

  async function save() {
    setBusy('save')
    try { await api.saveTemplate({ subject, body }); setDirty(false); notify('Message saved') }
    catch (e) { notify(e.message, 'err') }
    setBusy('')
  }

  async function onCv(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = await api.uploadCv(file)
      setCv(r.cv); notify(`CV uploaded (${r.size_kb} KB)`)
    } catch (err) { notify(err.message, 'err') }
  }

  async function sendTest() {
    if (dirty) { notify('Save your message first, then send the test', 'err'); return }
    setBusy('test')
    try {
      const r = await api.testEmail(testTo)
      notify(r.dry_run ? 'Dry run: test email logged on the server, not sent' : `Test email sent to ${r.sent_to}`)
    } catch (e) { notify(e.message, 'err') }
    setBusy('')
  }

  if (!loaded) return <p className="muted">Loading…</p>

  return (
    <div className="split">
      <div className="stack">
        <section className="panel form">
          <h2>Email message</h2>
          <p className="hint">Use <code>{'{name}'}</code> and <code>{'{university}'}</code>. They are filled in for each professor.</p>
          <label>Subject
            <input value={subject} onChange={(e) => { setSubject(e.target.value); setDirty(true) }} />
          </label>
          <label>Body
            <textarea rows="14" value={body} onChange={(e) => { setBody(e.target.value); setDirty(true) }} />
          </label>
          <div className="row">
            <button className="btn primary" disabled={!dirty || busy === 'save'} onClick={save}>
              {busy === 'save' ? 'Saving…' : 'Save message'}
            </button>
            {dirty && <span className="muted">Unsaved changes</span>}
          </div>
        </section>

        <section className="panel form">
          <h2>CV attachment</h2>
          <p>{cv ? <>Current file: <b>{cv.split(/[\\/]/).pop()}</b></> : <span className="muted">No CV uploaded yet.</span>}</p>
          <div className="row">
            <button className="btn" onClick={() => fileRef.current.click()}>{cv ? 'Replace CV' : 'Upload CV'}</button>
            <span className="hint">PDF, up to 5 MB</span>
          </div>
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={onCv} />
        </section>

        <section className="panel form">
          <h2>Send a test to yourself</h2>
          <p className="hint">Check the message and attachment before scheduling.{stats?.dry_run && ' Dry run is on, so nothing is actually sent.'}</p>
          <div className="row">
            <input type="email" placeholder="you@example.com" aria-label="Your email address"
              value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button className="btn" disabled={!testTo || busy === 'test'} onClick={sendTest}>
              {busy === 'test' ? 'Sending…' : 'Send test'}
            </button>
          </div>
        </section>
      </div>

      <aside className="panel preview">
        <h2>Preview</h2>
        <p className="hint">How it looks to Professor Li Wei at Nanjing University.</p>
        <div className="letter">
          <p className="subject">{preview(subject)}</p>
          <pre>{preview(body)}</pre>
          {cv && <p className="attach">Attachment: {cv.split(/[\\/]/).pop()}</p>}
        </div>
      </aside>
    </div>
  )
}
