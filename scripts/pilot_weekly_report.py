#!/usr/bin/env python3
"""Broad Peak Portal pilot - weekly activity report.

Usage: python3 weekly_report.py [week_number 1-4] [--domains a,b] [--out file.html]
Pilot start: Tue 29 Sep 2026 09:00 Dubai (05:00 UTC). Week N covers
[start + 7*(N-1) days, start + 7*N days). With no week number, reports the
most recently completed week.
Outputs an HTML email body (Outlook-safe inline styles) and prints the subject.
"""
import html, json, sys, urllib.request
from datetime import datetime, timedelta, timezone

API = "https://broadpeak-portal.onrender.com/api/admin/activity"
SECRET = "bpseed2026"
START = datetime(2026, 9, 29, 5, 0, tzinfo=timezone.utc)
PILOTS = {
    "so.energy": ("So Energy", "Andrew Lee"),
    "unitedlearning.org.uk": ("United Learning", "Michael Coyne"),
}
TAB_NAMES = {"products": "My Products", "support": "Technical Support", "news": "News & Updates",
             "resources": "Resources", "ce-readiness": "CE Readiness", "risk-score": "Risk Score"}
GRAD = "linear-gradient(135deg,#C65793 0%,#9b4da8 40%,#5a6bbf 70%,#4494D1 100%)"


def fetch(domains, since, until):
    q = f"{API}?domains={','.join(domains)}&since={since.isoformat()}&until={until.isoformat()}"
    req = urllib.request.Request(q, headers={"x-seed-secret": SECRET})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)


def e(s):
    return html.escape(str(s or ""))


def dubai(ts):
    return (datetime.fromisoformat(ts.replace("Z", "+00:00")) + timedelta(hours=4)).strftime("%a %d %b, %H:%M")


def verdict(c):
    n, logins = c["totals"]["events"], c["totals"]["logins"]
    engaged = sum(c["counts"].get(k, 0) for k in ("support_question", "ai_chat_question", "ticket_raised",
                                                    "assessment_submitted", "datasheet_open", "ai_prompt_generated"))
    if logins == 0:
        return "Not used this week", "#b91c1c", "#fef2f2"
    if engaged >= 5 or c["totals"]["activeDays"] >= 3:
        return "Actively using", "#166534", "#f0fdf4"
    if engaged >= 1:
        return "Exploring", "#92400e", "#fffbeb"
    return "Logged in only", "#92400e", "#fffbeb"


def items(evts, kinds, fmt=lambda r: e(r["detail"])):
    rows = [r for r in evts if r["event"] in kinds]
    if not rows:
        return ""
    lis = "".join(f'<li style="margin:0 0 4px">{fmt(r)} <span style="color:#9ca3af;font-size:12px">· {dubai(r["ts"])}</span></li>' for r in rows[-15:])
    return f'<ul style="margin:4px 0 0;padding-left:18px;color:#374151;font-size:13px">{lis}</ul>'


def section(title, body):
    if not body:
        return ""
    return f'<div style="margin-top:14px"><div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280">{title}</div>{body}</div>'


def customer_block(c, prev):
    org, person = PILOTS.get(c["domain"], (c["domain"], ""))
    v, vc, vbg = verdict(c)
    t, cnt, ev = c["totals"], c["counts"], c["events"]
    prev_logins = prev["totals"]["logins"] if prev else None
    trend = "" if prev_logins is None else f' <span style="color:#6b7280;font-size:12px">(prev week {prev_logins})</span>'
    stat = lambda label, val: (f'<td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;width:25%">'
                               f'<div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">{label}</div>'
                               f'<div style="font-size:20px;font-weight:700;color:#111827;margin-top:2px">{val}</div></td>')
    questions = cnt.get("support_question", 0) + cnt.get("ai_chat_question", 0)
    stats = (f'<table role="presentation" cellspacing="6" style="width:100%;border-collapse:separate;margin-top:10px"><tr>'
             f'{stat("Logins", str(t["logins"]) + trend)}{stat("Active days", t["activeDays"])}'
             f'{stat("Questions asked", questions)}{stat("Tickets / feedback", cnt.get("ticket_raised",0)+cnt.get("feedback_happy",0)+cnt.get("feedback_not_happy",0))}</tr></table>')

    tabs = c.get("tabs", {})
    areas = "".join(
        f'<tr><td style="padding:4px 0;color:#374151;font-size:13px">{e(TAB_NAMES.get(k, k))}</td>'
        f'<td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px">{n} view{"s" if n != 1 else ""}</td></tr>'
        for k, n in sorted(tabs.items(), key=lambda x: -x[1]))
    unused = [TAB_NAMES[k] for k in TAB_NAMES if k not in tabs]
    areas_html = ""
    if areas:
        areas_html = f'<table style="width:100%;border-collapse:collapse;margin-top:4px">{areas}</table>'
        if unused and t["logins"]:
            areas_html += f'<div style="font-size:12px;color:#9ca3af;margin-top:4px">Not visited: {e(", ".join(unused))}</div>'

    vendors = c.get("vendors", {})
    vend_html = (f'<div style="font-size:13px;color:#374151;margin-top:4px">' +
                 " · ".join(f"<b>{e(k)}</b> ({n})" for k, n in sorted(vendors.items(), key=lambda x: -x[1])) + "</div>") if vendors else ""

    pw = ('<span style="color:#166534;font-weight:600">Changed ✓</span>' if c["passwordChanged"]
          else '<span style="color:#b91c1c;font-weight:600">Still on temporary password</span>')
    last = dubai(c["allTime"]["lastSeen"]) if c["allTime"]["lastSeen"] else "Never"

    users = c.get("users", [])
    active = [u for u in users if u.get("lastLogin")]
    users_html = "".join(
        f'<div style="font-size:13px;color:#374151;margin:3px 0"><b>{e(u.get("name") or u["email"])}</b> '
        f'<span style="color:#6b7280">{e(u["email"])}</span> · {u.get("logins",0)} sign-in(s) this week · '
        f'{"password set" if u.get("passwordSet") else "temporary password"}'
        f' · last seen {dubai(u["lastLogin"])}</div>' for u in active)
    if users:
        users_html += f'<div style="font-size:12px;color:#9ca3af;margin-top:4px">{len(active)} of {len(users)} registered contacts have signed in.</div>'

    body = "".join([
        section("People using the portal", users_html),
        section("Areas used", areas_html),
        section("Technical support by vendor", vend_html),
        section("Technical support questions", items(ev, {"support_question"})),
        section("Ask Broad Peak AI questions", items(ev, {"ai_chat_question"})),
        section("Tickets & answer feedback", items(ev, {"ticket_raised", "feedback_happy", "feedback_not_happy"},
                lambda r: ({"feedback_happy": "👍 Happy: ", "feedback_not_happy": "<b style='color:#b91c1c'>👎 Not happy:</b> ", "ticket_raised": "Ticket: "}[r["event"]]) + e(r["detail"]))),
        section("AI configuration prompts generated", items(ev, {"ai_prompt_generated"})),
        section("Assessments completed", items(ev, {"assessment_submitted"})),
        section("Resources opened", items(ev, {"datasheet_open", "vendor_library_open", "newsletter_open"})),
        section("Enquiries sent", items(ev, {"enquiry_sent"})),
    ])
    if not t["logins"]:
        body = '<p style="color:#6b7280;font-size:13px;margin:12px 0 0">No sign-ins this week. Worth a nudge from the account manager.</p>' + body

    return f'''
<div style="border:1px solid #e5e7eb;border-radius:12px;padding:18px 20px;margin-top:16px;background:#ffffff">
  <table role="presentation" style="width:100%"><tr>
    <td><div style="font-size:17px;font-weight:700;color:#111827">{e(org)}</div>
        <div style="font-size:13px;color:#6b7280">{e(person)} · @{e(c["domain"])}</div></td>
    <td style="text-align:right"><span style="display:inline-block;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:700;color:{vc};background:{vbg}">{v}</span></td>
  </tr></table>
  {stats}
  <div style="font-size:13px;color:#374151;margin-top:8px">Password: {pw} · Last seen: {e(last)}</div>
  {body}
</div>'''


def main():
    args = sys.argv[1:]
    domains = list(PILOTS)
    out = None
    week = None
    i = 0
    while i < len(args):
        if args[i] == "--domains": domains = args[i + 1].split(","); i += 2
        elif args[i] == "--out": out = args[i + 1]; i += 2
        else: week = int(args[i]); i += 1
    now = datetime.now(timezone.utc)
    if week is None:
        week = max(1, min(4, int((now - START).days // 7)))
    since, until = START + timedelta(days=7 * (week - 1)), START + timedelta(days=7 * week)
    data = fetch(domains, since, until)
    prev = {c["domain"]: c for c in fetch(domains, since - timedelta(days=7), since)["customers"]} if week > 1 else {}
    label = f'{(since + timedelta(hours=4)).strftime("%d %b")} – {(until + timedelta(hours=4) - timedelta(days=1)).strftime("%d %b %Y")}'
    blocks = "".join(customer_block(c, prev.get(c["domain"])) for c in data["customers"])
    subject = f"Broad Peak Portal pilot – Week {week} of 4 activity report ({label})"
    body = f'''<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f0f2f5;padding:20px">
<div style="max-width:680px;margin:0 auto">
  <div style="background:{GRAD};background-color:#9b4da8;border-radius:14px;padding:20px 22px;color:#ffffff">
    <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Broad Peak Customer Portal · Pilot</div>
    <div style="font-size:21px;font-weight:800;margin-top:4px">Week {week} of 4 activity report</div>
    <div style="font-size:13px;opacity:.9;margin-top:2px">{label} (Dubai time)</div>
  </div>
  {blocks}
  <p style="font-size:11px;color:#9ca3af;margin-top:14px">Generated from portal activity logs for @{" and @".join(domains)}. Counts include everyone signing in from each organisation's domain. Tracked: sign-ins, tab views, vendor support questions, Broad Peak AI questions, tickets and answer feedback, assessments, AI prompts and resource opens.</p>
</div></div>'''
    if out:
        open(out, "w").write(body)
    print(subject)
    return subject, body


if __name__ == "__main__":
    main()
