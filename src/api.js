const KEY = "pm_api_key";
const API_BASE = "https://prof-mailer.onrender.com";
export const getKey = () => localStorage.getItem(KEY) || "";
export const setKey = (k) => localStorage.setItem(KEY, k);

async function request(path, { json, body, method = "GET" } = {}) {
  const headers = { "X-API-Key": getKey() };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(API_BASE + "/api" + path, { method, headers, body });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const d = await res.json();
      msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
    } catch {
      /* keep statusText */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res;
}

const j = async (p, o) => (await request(p, o)).json();
const upload = (path, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return j(path, { method: "POST", body: fd });
};

export const api = {
  stats: () => j("/stats"),
  list: ({ status, q, page, pageSize }) => {
    const p = new URLSearchParams({ page, page_size: pageSize });
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    return j("/professors?" + p);
  },
  importExcel: (file) => upload("/professors/import", file),
  remove: (id) => j(`/professors/${id}`, { method: "DELETE" }),
  schedule: (data) => j("/schedule", { method: "POST", json: data }),
  unschedule: (ids) => j("/unschedule", { method: "POST", json: ids }),
  retryFailed: () => j("/retry-failed", { method: "POST" }),
  runNow: () => j("/run-now", { method: "POST" }),
  getTemplate: () => j("/template"),
  saveTemplate: (data) => j("/template", { method: "PUT", json: data }),
  uploadCv: (file) => upload("/cv", file),
  testEmail: (to) => j("/test-email", { method: "POST", json: { to } }),
  async downloadExcel() {
    const blob = await (await request("/export")).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "professors_status.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
};
