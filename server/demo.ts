// Built-in demo account for sales demos. Fictional company — not in Salesforce,
// so the daily Salesforce refresh / contact sync never removes it.
export const DEMO_DOMAIN = 'demo.broadpeakcyber.com';
export const DEMO_EMAIL = 'demo@broadpeakcyber.com';
export const DEMO_PASSWORD = 'BPDemo2026!';
export const DEMO_NAME = 'Demo User';

function iso(offsetDays: number) {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + offsetDays); return d.toISOString().slice(0, 10);
}
function entry(category: string, products: { name: string; vendor: string }[], start: number, end: number) {
  const startedAt = iso(start), expiresAt = iso(end);
  return { category, status: end < 0 ? 'expired' : 'active', startedAt, expiresAt,
    products: products.map(p => ({ ...p, startedAt, expiresAt })) };
}

export function demoCustomer() {
  const barracuda = { name: 'Barracuda CCB/EIP/XDR', vendor: 'Barracuda' };
  const aw = { name: 'Arctic Wolf', vendor: 'Arctic Wolf' };
  return {
    accountName: 'Northwind Demo Ltd',
    domain: DEMO_DOMAIN,
    grid: [
      entry('Email Protection', [barracuda], -300, 430),
      entry('Data Protection', [barracuda, { name: 'Keepit', vendor: 'Keepit' }], -300, 430),
      entry('MDR/SOC', [aw], -120, 975),
      entry('GRC', [aw, { name: 'CyberSmart Cyber Essentials', vendor: 'CyberSmart' }], -120, 975),
      entry('Security Awareness', [{ name: 'Boxphish Security Awareness', vendor: 'Boxphish' }], -330, 35),
      entry('Network Protection', [{ name: 'WatchGuard MDR', vendor: 'WatchGuard' }], -760, -30),
      entry('Penetration Testing', [{ name: 'CyberSmart Cyber Essentials', vendor: 'CyberSmart' }], -200, 165),
    ],
    hasProducts: true,
    opportunityCount: 6,
    accountOwner: { name: 'Tim Blakey', email: 'tim.blakey@broadpeakcyber.com', phone: null },
    awCsms: [{ name: 'Sam Taylor (demo)', email: 'csm.demo@example.com', phone: '+441234567890' }],
  };
}

export function demoTickets() {
  const now = Date.now();
  const t = (id: number, subject: string, status: string, statusCode: number, priority: string, priorityCode: number, days: number) => ({
    id, subject, status, statusCode, priority, priorityCode,
    createdAt: new Date(now - days * 864e5).toISOString(), updatedAt: new Date(now - (days - 1) * 864e5).toISOString(),
    requesterName: DEMO_NAME, requesterEmail: DEMO_EMAIL, type: 'Question', tags: ['demo'],
  });
  return [
    t(900003, 'Quarantined invoice email from a supplier needs releasing', 'Open', 2, 'Medium', 2, 1),
    t(900002, 'Restore a deleted SharePoint folder from Keepit backup', 'Resolved', 4, 'High', 3, 6),
    t(900001, 'Add two new starters to phishing awareness training', 'Closed', 5, 'Low', 1, 14),
  ];
}

export function isDemo(v: string | null | undefined) {
  const s = String(v || '').toLowerCase().trim();
  return s === DEMO_EMAIL || s === DEMO_DOMAIN;
}

// Broad Peak staff test logins attached to a real customer account. Kept in code
// (not portal_contacts) so the daily Salesforce contact sync never removes them.
// They use the normal per-user password flow (temporary password, then forced change).
export const TEST_USERS: Record<string, { domain: string; name: string; accountName: string }> = {
  'daniel.bailey@broadpeakcyber.com': { domain: 'polfed.org', name: 'Daniel Bailey (test)', accountName: 'Police Federation of England and Wales' },
};
