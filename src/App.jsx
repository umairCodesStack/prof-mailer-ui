import { useCallback, useEffect, useState } from "react";
import { api, getKey, setKey } from "./api";
import Pipeline from "./Pipeline.jsx";
import ProfessorsTab from "./ProfessorsTab.jsx";
import ScheduleTab from "./ScheduleTab.jsx";
import MessageTab from "./MessageTab.jsx";

const TABS = [
  ["professors", "Professors"],
  ["schedule", "Schedule"],
  ["message", "Message"],
];

export default function App() {
  const [tab, setTab] = useState("professors");
  const [status, setStatus] = useState("");
  const [stats, setStats] = useState(null);
  const [conn, setConn] = useState("connecting"); // connecting | ok | offline | auth
  const [keyInput, setKeyInput] = useState(getKey());
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = useCallback(async () => {
    try {
      setStats(await api.stats());
      setConn("ok");
    } catch (e) {
      setConn(e.status === 401 ? "auth" : "offline");
    }
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, [refresh]);

  const fmt = useCallback(
    (iso) => {
      if (!iso) return "";
      return new Date(iso).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: stats?.timezone || undefined,
      });
    },
    [stats?.timezone],
  );

  function saveKey(e) {
    e.preventDefault();
    setKey(keyInput.trim());
    setConn("connecting");
    refresh();
  }

  const pickStatus = (s) => {
    setStatus(s);
    setTab("professors");
  };

  return (
    <div className="app">
      <header className="top">
        <h1>Professor Mailer</h1>
        <nav aria-label="Sections">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              className={tab === k ? "on" : ""}
              aria-current={tab === k ? "page" : undefined}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </nav>
      </header>

      {/* {stats?.dry_run && conn === 'ok' && (
        <div className="banner dry">Dry run is on. The server logs emails but does not send them. Set <code>DRY_RUN=false</code> in the backend <code>.env</code> to send for real.</div>
      )} */}

      {conn === "offline" && (
        <div className="banner err">
          Cannot reach the backend. Start it in the <code>prof-mailer</code>{" "}
          folder with <code>uvicorn app.main:app --reload</code>, then reload
          this page.
        </div>
      )}

      {conn === "auth" ? (
        <form className="panel keyform" onSubmit={saveKey}>
          <h2>Enter your API key</h2>
          <p className="hint">
            This is the <code>API_KEY</code> value from the backend{" "}
            <code>.env</code> file. It is stored only in this browser.
          </p>
          <label>
            API key
            <input
              type="password"
              autoFocus
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
          </label>
          <button className="btn primary">Connect</button>
        </form>
      ) : (
        conn === "ok" && (
          <main>
            <Pipeline
              stats={stats}
              active={tab === "professors" ? status : ""}
              onPick={pickStatus}
              fmt={fmt}
            />
            {tab === "professors" && (
              <ProfessorsTab
                stats={stats}
                refresh={refresh}
                notify={notify}
                status={status}
                setStatus={setStatus}
                fmt={fmt}
                gotoSchedule={() => setTab("schedule")}
              />
            )}
            {tab === "schedule" && (
              <ScheduleTab
                stats={stats}
                refresh={refresh}
                notify={notify}
                gotoMessage={() => setTab("message")}
              />
            )}
            {tab === "message" && <MessageTab stats={stats} notify={notify} />}
          </main>
        )
      )}

      {toast && (
        <div key={toast.id} className={`toast ${toast.kind}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
