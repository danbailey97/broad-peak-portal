// Keepit implementation wizard — content sourced from the Keepit Help Center (keepit.com/help)
// Each step has a short customer-facing summary plus the detailed instructions that are
// turned into a Claude CoWork prompt for that one small section of the implementation.

export interface ImplLink { label: string; url: string }
export interface ImplStep {
  id: string;
  title: string;
  portal: string;          // where the work happens
  startUrl: string;        // where CoWork should open
  summary: string;         // 1–2 sentence explanation
  actions: string[];       // short key actions shown in the wizard
  needs?: string[];        // what you need before starting
  detail: string[];        // full numbered instructions used in the CoWork prompt
  verify: string[];        // how to confirm it worked
  pauseBefore?: string[];  // CoWork must stop and confirm with the user before these
  links: ImplLink[];
  infoOnly?: boolean;      // no CoWork prompt (planning / reading step)
}
export interface ImplPhase { id: string; title: string; subtitle: string; steps: ImplStep[]; coverage?: ImplLink; note?: string }

export interface ImplModule { id: string; name: string; group: 'Microsoft' | 'Google & Salesforce' | 'Atlassian' | 'Other SaaS' | 'Platform'; hint: string }

export const KEEPIT_MODULES: ImplModule[] = [
  { id: 'm365', name: 'Microsoft 365', group: 'Microsoft', hint: 'Exchange, OneDrive, SharePoint, Groups & Teams, Teams Chats' },
  { id: 'entra', name: 'Microsoft Entra ID', group: 'Microsoft', hint: 'Users, groups, roles, policies, app registrations' },
  { id: 'ado', name: 'Azure DevOps', group: 'Microsoft', hint: 'Boards, Pipelines, Repos' },
  { id: 'pbi', name: 'Power BI', group: 'Microsoft', hint: 'Workspace reports and dataflows' },
  { id: 'pp', name: 'Power Platform & Dynamics 365', group: 'Microsoft', hint: 'Dataverse, Power Apps, Power Automate, D365' },
  { id: 'gw', name: 'Google Workspace', group: 'Google & Salesforce', hint: 'Gmail, Drive, Shared drives, Calendar, Contacts' },
  { id: 'sf', name: 'Salesforce', group: 'Google & Salesforce', hint: 'CRM data, files and metadata' },
  { id: 'jira', name: 'Jira & Jira Service Management', group: 'Atlassian', hint: 'Projects, issues, schemes, filters' },
  { id: 'conf', name: 'Confluence', group: 'Atlassian', hint: 'Spaces, pages, blog posts' },
  { id: 'zd', name: 'Zendesk', group: 'Other SaaS', hint: 'Tickets, users, groups, macros' },
  { id: 'okta', name: 'Okta', group: 'Other SaaS', hint: 'Users, groups, apps, policies' },
  { id: 'ds', name: 'Docusign', group: 'Other SaaS', hint: 'Envelopes, documents, audit trails' },
  { id: 'bhr', name: 'BambooHR', group: 'Other SaaS', hint: 'Employee records and company files' },
  { id: 'miro', name: 'Miro', group: 'Other SaaS', hint: 'Boards and spaces (Enterprise plan)' },
  { id: 'gh', name: 'GitHub', group: 'Other SaaS', hint: 'Organisation repositories and metadata' },
  { id: 'monday', name: 'Monday.com', group: 'Other SaaS', hint: 'Boards, items and workspaces' },
  { id: 'forma', name: 'Autodesk Forma', group: 'Other SaaS', hint: 'Hub projects and data management' },
  { id: 'sso', name: 'Single Sign-On (Entra ID)', group: 'Platform', hint: 'Sign in to Keepit with Microsoft Entra SAML' },
  { id: 'siem', name: 'SIEM integration (Splunk)', group: 'Platform', hint: 'Send audit log and job events to Splunk' },
  { id: 'api', name: 'Keepit API', group: 'Platform', hint: 'Automation and reporting via the Keepit API' },
];

export const KEEPIT_DATACENTRES = [
  { id: 'uk-ld', label: 'United Kingdom (London)' },
  { id: 'de-fr', label: 'Germany (Frankfurt)' },
  { id: 'dk-co', label: 'Denmark (Copenhagen)' },
  { id: 'ch-zh', label: 'Switzerland (Zurich)' },
  { id: 'us-dc', label: 'United States (Washington, DC)' },
  { id: 'ca-tr', label: 'Canada (Toronto)' },
  { id: 'au-sy', label: 'Australia (Sydney)' },
];

export interface ImplOptions {
  modules: string[];
  dc: string;              // e.g. 'uk-ld'
  teamsChats: boolean;     // M365: back up 1:1 / group Teams chats (Connector 3)
  largeTenant: boolean;    // M365: more than 500 users
  keyVault: boolean;       // Entra: connect Azure Key Vault for app restores
}

const H = 'https://www.keepit.com/help/';
const L = (label: string, path: string): ImplLink => ({ label, url: path.startsWith('http') ? path : H + path });

export function buildKeepitPlan(o: ImplOptions): ImplPhase[] {
  const host = `${o.dc}.keepit.com`;
  const keepitUrl = `https://${host}/`;
  const has = (m: string) => o.modules.includes(m);
  const msMods = ['m365', 'entra', 'ado', 'pbi', 'pp'].filter(has);
  const phases: ImplPhase[] = [];

  // ── Phase 1: Prepare ───────────────────────────────────────────
  const prep: ImplStep[] = [{
    id: 'prep-keepit',
    title: 'Sign in to Keepit and confirm your data centre',
    portal: 'Keepit', startUrl: keepitUrl,
    summary: `Your Keepit account lives in the ${KEEPIT_DATACENTRES.find(d => d.id === o.dc)?.label} data centre (${host}). Several redirect URLs later in this guide depend on this hostname, so confirm it before you start.`,
    actions: [`Sign in at ${keepitUrl} as a Master Admin or Backup Admin`, 'Open the Connectors page and check no connectors exist yet for these workloads', 'Note the hostname in the address bar — it must match the one used throughout this plan'],
    detail: [
      `Open ${keepitUrl} (I will sign in myself if prompted).`,
      'Confirm the hostname shown in the browser address bar. Report it back to me exactly.',
      'Open the Connectors page from the left-hand navigation.',
      'List every existing connector: name, type (e.g. Microsoft 365, Google Workspace) and status. Do not change anything.',
      'Open the account profile in the lower-left corner > Account info and note my role (Master Admin / Backup Admin).',
    ],
    verify: ['The hostname is confirmed', 'You have a list of any existing connectors', 'Your role is Master Admin or Backup Admin'],
    links: [L('Keepit Help Center', 'https://www.keepit.com/help/')],
  }];

  if (has('m365')) {
    const plan = o.largeTenant
      ? ['Connector 1 — Exchange (incl. Public Folders)', 'Connector 2 — OneDrive', 'Connector 3 — SharePoint & Groups + Teams', ...(o.teamsChats ? ['Connector 4 — Teams Chats'] : [])]
      : ['Connector 1 — Exchange & OneDrive', 'Connector 2 — SharePoint & Groups + Teams', ...(o.teamsChats ? ['Connector 3 — Teams Chats'] : [])];
    prep.push({
      id: 'prep-connector-plan',
      title: 'Agree your Microsoft 365 connector layout (best practice)',
      portal: 'Planning', startUrl: H + 'microsoft-365-category/configure-your-microsoft-365-backup/',
      infoOnly: true,
      summary: 'Keepit recommends splitting Microsoft 365 workloads across separate connectors rather than putting everything in one. Your plan: ' + plan.join('; ') + '.',
      actions: [
        'Why: each connector backs up in parallel, so one slow data type (e.g. a huge SharePoint estate) never holds up mailboxes',
        'Why: Teams Chats is throttled per app by Microsoft — giving it its own connector and its own Entra app registration keeps chat backups timely and complete',
        'Why: smaller connectors give faster initial backups and quicker sub-folder search when you need to restore',
        'Exchange, OneDrive and Teams Chats share user selection by default — pairing Exchange with OneDrive keeps that simple',
        'The same Privileged Role Admin / Global Admin service account can be used for every connector',
        ...(o.largeTenant ? ['Over 500 users: Keepit advises separate Exchange and OneDrive connectors as shown above'] : []),
      ],
      detail: [], verify: [],
      links: [L('Configure your Microsoft 365 backup', 'microsoft-365-category/configure-your-microsoft-365-backup/'), L('Microsoft 365 getting started', 'microsoft-365-category/')],
    });
  }

  if (msMods.length) {
    const roles: string[] = [];
    if (has('m365')) roles.push('Privileged Role Admin or Global Admin (Microsoft 365)');
    if (has('entra') || has('pbi') || has('pp')) roles.push('Global Admin (required for Entra ID, Power BI and Power Platform connectors)');
    if (has('pbi')) roles.push('Fabric Administrator + Power BI Pro or Premium licence (Power BI)');
    if (has('pp')) roles.push('Dynamics 365 Administrator + System Administrator security role with Read-Write access mode (Power Platform / D365)');
    if (has('ado')) roles.push('Organization Owner, or member of the organisation and its Project Collection Administrators group (Azure DevOps)');
    prep.push({
      id: 'prep-ms-account',
      title: 'Create the Microsoft backup service account',
      portal: 'Microsoft 365 admin center', startUrl: 'https://admin.microsoft.com/',
      summary: 'Use one dedicated, licensed service account for Keepit (e.g. keepit_backup@yourdomain) so the backup never depends on an individual employee.',
      actions: [
        'Create a user named "Keepit Backup" (keepit_backup@yourdomain)',
        'Assign a licence that includes Teams/Groups (Business Basic/Standard, Apps for business/enterprise, or Office 365 E1/E3/E5)',
        ...roles.map(r => 'Assign: ' + r),
        'Optional: include the account in your Conditional Access policies now, so MFA/CA issues surface before connector creation',
        'Optional: create Microsoft 365 groups to control which users are backed up',
      ],
      needs: ['Global Admin access to Microsoft 365', 'A spare licence for the service account'],
      detail: [
        'Open https://admin.microsoft.com/ > Users > Active users > Add a user.',
        'First name "Keepit", last name "Backup", display name "Keepit Backup", username "keepit_backup" on the primary domain. Let Microsoft generate a password and show it to me on screen only — do not record it in your report.',
        'Assign a licence that grants access to Microsoft Teams and Groups (Microsoft 365 Business Basic, Business Standard, Apps for business, Apps for enterprise, or Office 365 E1/E3/E5). Ask me which licence to use if more than one is available.',
        ...roles.map((r, i) => `Role ${i + 1}: assign ${r}. ${r.includes('Azure DevOps') ? 'This is done in Azure DevOps (Organization settings > Permissions > Project Collection Administrators > Add) for every organisation to be backed up.' : r.includes('System Administrator security role') ? 'The security role is set in the Power Platform admin center > Manage > Environments > [environment] > Access > Users (add the user, then Manage security roles > System administrator; check Access Mode = Read-Write).' : 'Assign it under Roles > Role assignments in the Microsoft 365 admin center or the Entra admin center.'}`),
        ...(has('m365') ? ['If Public Folders are in use, tell me — the service account needs Owner permission on the root and every sub-folder (Microsoft\'s client permissions script https://aka.ms/PFPermissionScript can apply this).'] : []),
        'Ask me whether the account should be included in existing Conditional Access policies. If yes, open Entra admin center > Protection > Conditional Access and add the user to the policies I name.',
      ],
      verify: ['The Keepit Backup user exists and is licensed', 'All required roles show on the user\'s Roles tab'],
      pauseBefore: ['assigning any admin role', 'changing Conditional Access policies'],
      links: [
        ...(has('m365') ? [L('Requirements for Microsoft 365 backup', 'microsoft-365-category/requirements-for-setting-up-a-microsoft-365-backup/')] : []),
        ...(has('entra') ? [L('Requirements for Entra ID backup', 'entra-id-category/requirements-for-setting-up-an-entra-id-backup/')] : []),
        ...(has('pbi') ? [L('Requirements for Power BI backup', 'power-bi-category/requirements-for-setting-up-a-power-bi-backup/')] : []),
        ...(has('pp') ? [L('Requirements for Power Platform / D365', 'power-platform-dynamics-365-category/requirements-for-setting-up-a-power-platform-dynamics-365-backup/')] : []),
        ...(has('ado') ? [L('Requirements for Azure DevOps', 'azure-devops-category/requirements-for-azure-devops-connector-creation-and-backup/')] : []),
      ],
    });
  }
  phases.push({ id: 'prepare', title: 'Prepare', subtitle: 'Accounts, access and connector strategy', steps: prep });

  // shared helper for "create connector" detail text
  const connectorCreate = (kind: string, extra: string[]) => [
    `Open ${keepitUrl} and go to the Connectors page.`,
    `Select Add connector > Add ${kind} connector.`,
    ...extra,
  ];

  // ── Microsoft 365 ──────────────────────────────────────────────
  if (has('m365')) {
    const steps: ImplStep[] = [];
    const mk = (id: string, name: string, keep: string[], drop: string[], extraCfg: string[]): ImplStep => ({
      id, title: `Create connector: ${name}`, portal: 'Keepit + Microsoft sign-in', startUrl: keepitUrl,
      summary: `Create a Microsoft 365 connector that backs up only ${keep.join(' and ')}. All data areas are ticked by default, so the others must be excluded before you start the backup.`,
      actions: ['Add connector > Add Microsoft 365 connector > Create Connector', 'Sign in with the Keepit Backup service account and accept permissions', `Keep only: ${keep.join(', ')}`, `Untick: ${drop.join(', ')}`, `Name it "M365 – ${name}" and click Start backup`],
      needs: ['The Keepit Backup service account credentials (entered by you, never by the AI)'],
      detail: connectorCreate('Microsoft 365', [
        'Confirm the service account is ready and click Create Connector.',
        'A Microsoft sign-in window opens. STOP and ask me to sign in with the Keepit Backup service account. Wait until I confirm.',
        'Read the permissions page and summarise it for me, then wait for my go-ahead before clicking Accept.',
        'Review the summary and click Configure.',
        `In the backup configuration, keep these data areas enabled: ${keep.join(', ')}.`,
        `Disable these data areas: ${drop.join(', ')}.`,
        ...extraCfg,
        `Rename the connector to "M365 – ${name}".`,
        'Show me the final configuration and wait for my confirmation, then click Start backup (not Complete later — that leaves the first backup unscheduled).',
      ]),
      verify: ['The connector appears on the Connectors page', `Only ${keep.join(' + ')} are enabled`, 'A first backup job is scheduled'],
      pauseBefore: ['signing in to Microsoft', 'accepting permissions', 'clicking Start backup'],
      links: [L('Create a Microsoft 365 connector', 'microsoft-365-category/create-a-microsoft-365-connector/'), L('Configure your Microsoft 365 backup', 'microsoft-365-category/configure-your-microsoft-365-backup/')],
    });
    const all = ['Exchange', 'OneDrive', 'SharePoint', 'Groups & Teams', 'Teams Chats'];
    const others = (k: string[]) => all.filter(a => !k.includes(a));
    const userSel = 'Select Configure under Exchange and choose which users or groups to back up (ask me which groups; by default all users are included). Exchange, OneDrive and Teams Chats user selections are linked — leave them linked unless I say otherwise. Click OK.';
    const versions = 'Ask me how many SharePoint/OneDrive file versions to keep (latest only is default; 10, 100 or all are available under Advanced — more versions means slower backups). Set it under Advanced, then OK.';
    if (o.largeTenant) {
      steps.push(mk('m365-c1', 'Exchange', ['Exchange'], others(['Exchange']), [userSel]));
      steps.push(mk('m365-c2', 'OneDrive', ['OneDrive'], others(['OneDrive']), [versions]));
      steps.push(mk('m365-c3', 'SharePoint & Groups + Teams', ['SharePoint', 'Groups & Teams'], others(['SharePoint', 'Groups & Teams']), [versions]));
    } else {
      steps.push(mk('m365-c1', 'Exchange & OneDrive', ['Exchange', 'OneDrive'], others(['Exchange', 'OneDrive']), [userSel, versions]));
      steps.push(mk('m365-c2', 'SharePoint & Groups + Teams', ['SharePoint', 'Groups & Teams'], others(['SharePoint', 'Groups & Teams']), [versions]));
    }
    if (o.teamsChats) {
      steps.push({
        id: 'm365-appreg', title: 'Create the Teams Chats app registration in Entra ID', portal: 'Microsoft Entra admin center', startUrl: 'https://entra.microsoft.com/',
        summary: 'Teams Chats needs its own app registration so Microsoft\'s per-app throttling doesn\'t slow the rest of your backup. Requires an Application Administrator or Global Administrator.',
        actions: ['App registrations > New registration "Keepit Teams Chat Backup" (single tenant)', `Add Web platform + redirect URIs on ${host}`, 'Upload a certificate (x509, sha256, rsa2048 — CRT/CER/PEM)', 'Add Graph permissions and grant admin consent', 'Copy the Application (client) ID'],
        needs: ['A certificate (.cer/.crt/.pem) and its private key (.key) — generate one first if you don\'t have it'],
        detail: [
          'Open https://entra.microsoft.com/ > Applications > App registrations > New registration.',
          'Display name: "Keepit Teams Chat Backup". Supported account types: Accounts in this organizational directory only (Single tenant). Click Register.',
          'Copy the Application (client) ID and show it to me.',
          `Go to Authentication > Add a platform > Web. Redirect URI: https://${host}/desktop/connector/restore/auth. Tick "Access tokens (used for implicit flows)". Click Configure.`,
          `Click Add URI and add, one at a time: https://${host}/desktop/connector/create and https://${host}/desktop/connector/reauth. Click Save.`,
          'Go to Certificates & secrets > Certificates > Upload certificate. Ask me to select the certificate file from my computer, then click Add.',
          'Go to API permissions > Add a permission > Microsoft Graph > Application permissions and add: ChannelMessage.Read.All, Chat.Read.All, Directory.Read.All, TeamsTab.Read.All, User.Read.All.',
          'Add a permission > Microsoft Graph > Delegated permissions > User.Read. Click Add permissions.',
          'Wait for my confirmation, then click Grant admin consent and confirm Yes.',
        ],
        verify: ['All six permissions show "Granted"', 'Three redirect URIs are listed under Web', 'The certificate thumbprint appears under Certificates'],
        pauseBefore: ['uploading the certificate', 'granting admin consent'],
        links: [L('Create an app registration in Entra ID', 'microsoft-365-category/create-an-app-registration-in-entra-id/')],
      });
      steps.push(mk(o.largeTenant ? 'm365-c4' : 'm365-c3', 'Teams Chats', ['Teams Chats'], others(['Teams Chats']), [
        'With Teams Chats enabled, select ••• in the lower-right corner > App registration. Click Next.',
        'Enter the Application (client) ID from the previous step. Ask me to upload the certificate and the private key (.key) into the designated fields myself.',
        'Click Connect app registration. STOP and ask me to sign in with a Global Admin and accept the permissions.',
        'Review the summary and click Configure.',
      ]));
    }
    phases.push({ id: 'm365', title: 'Microsoft 365', subtitle: `${steps.length} steps · ${o.largeTenant ? (o.teamsChats ? 4 : 3) : (o.teamsChats ? 3 : 2)} connectors`, steps, coverage: L('Microsoft 365 coverage', 'microsoft-365-category/') });
  }

  // ── Entra ID ───────────────────────────────────────────────────
  if (has('entra')) {
    const steps: ImplStep[] = [{
      id: 'entra-conn', title: 'Create the Entra ID connector', portal: 'Keepit + Microsoft sign-in', startUrl: keepitUrl,
      summary: 'Back up users, groups, administrative units, roles and (with Entra ID Advanced) activity logs and policies. Use an incognito window so no personal Microsoft account interferes.',
      actions: ['Use an incognito window signed in only as the Global Admin service account', 'Add connector > Add Entra ID connector > Sign in > Accept', 'Use the gear icons to scope users, groups and administrative units', 'Entra ID Advanced: create a separate connector for Activity Logs', 'Click Create'],
      needs: ['Global Admin service account', 'Entra ID P2 / Governance licence if backing up eligible role assignments', 'Entra ID P1/P2 for activity logs'],
      detail: connectorCreate('Entra ID', [
        'Click Sign in. STOP and ask me to enter the Global Admin service account credentials in the Microsoft window.',
        'Summarise the permissions requested and wait for my approval before clicking Accept.',
        'Back in Keepit, rename the connector "Entra ID".',
        'Click the gear icon next to Users, Groups, Administrative units and show me the options; apply what I choose.',
        'Ask me whether we have Entra ID Advanced. If yes, ask whether Activity Logs should go in a separate connector (recommended) and how many hours/days of logs to include in the initial backup.',
        'Wait for my confirmation, then click Create.',
      ]),
      verify: ['The Entra ID connector appears with a first backup scheduled'],
      pauseBefore: ['signing in', 'accepting permissions', 'clicking Create'],
      links: [L('Create an Entra ID connector', 'entra-id-category/create-an-entra-id-connector'), L('Entra ID requirements', 'entra-id-category/requirements-for-setting-up-an-entra-id-backup/')],
    }];
    if (o.keyVault) steps.push({
      id: 'entra-kv', title: 'Connect Azure Key Vault for app restores', portal: 'Azure portal + Keepit', startUrl: 'https://portal.azure.com/',
      summary: 'Lets Keepit store newly created certificates and secrets in your own vault when it restores applications and service principals. Affects restores only, not backups.',
      actions: ['Create a Key Vault in the same tenant, with public network access enabled', 'Give the "Keepit for Entra ID" service principal Key Vault Secrets Officer + Certificates Officer (RBAC) — or Secret: Set; Certificate: Get, Update, Create (access policy)', 'Copy the Vault URI', 'Keepit connector > gear next to App registrations > Connect Azure Key Vault'],
      detail: [
        'Open https://portal.azure.com/ > Key vaults. Ask me whether to use an existing vault or create a new one (same tenant as Keepit for Entra ID; public network access enabled).',
        'Open the vault > Access configuration and tell me whether it uses Azure RBAC or vault access policies.',
        'RBAC: Access control (IAM) > Add role assignment > Key Vault Secrets Officer, member = "Keepit for Entra ID" service principal. Repeat for Key Vault Certificates Officer.',
        'Access policies: Create > Secret permissions: Set; Certificate permissions: Get, Update, Create; principal = "Keepit for Entra ID".',
        'Copy the Vault URI from the Overview pane (format https://<name>.vault.azure.net).',
        `Open ${keepitUrl} > Connectors > the Entra ID connector configuration > gear icon next to App registrations > Connect Azure Key Vault. Paste the Vault URI and Save.`,
      ],
      verify: ['The Vault URI is saved on the Entra ID connector'],
      pauseBefore: ['creating the vault', 'adding role assignments'],
      links: [L('Configure Azure Key Vault', 'entra-id-category/connect-azure-key-vault/')],
    });
    phases.push({ id: 'entra', title: 'Microsoft Entra ID', subtitle: `${steps.length} step${steps.length > 1 ? 's' : ''}`, steps, coverage: L('Entra ID coverage', 'entra-id-category/entra-id-backup-coverage/'), note: 'Configuration profiles based on administrative templates cannot be backed up, and sign-in logs require audit logs to be backed up too.' });
  }

  // ── Azure DevOps ───────────────────────────────────────────────
  if (has('ado')) phases.push({
    id: 'ado', title: 'Azure DevOps', subtitle: '2 steps', coverage: L('Azure DevOps coverage', 'azure-devops-category/azure-devops-backup-coverage/'),
    note: 'Secure files/variables, pipeline logs and repos over 256 GB are not backed up.',
    steps: [{
      id: 'ado-prep', title: 'Enable OAuth access for each organisation', portal: 'Azure DevOps', startUrl: 'https://dev.azure.com/',
      summary: 'Keepit needs third-party OAuth access enabled in every Azure DevOps organisation you back up, and the service account must be an owner or Project Collection Administrator in each.',
      actions: ['Organization settings > Policies > enable "Third-party application access via OAuth"', 'Confirm the service account is Organization Owner or in Project Collection Administrators', 'Repeat for every organisation', 'Never change the service account\'s UPN afterwards'],
      detail: [
        'Open https://dev.azure.com/ and list the organisations available. Ask me which ones to back up.',
        'For each chosen organisation: Organization settings > Policies > turn on "Third-party application access via OAuth".',
        'Organization settings > Permissions > Project Collection Administrators > Members: confirm the Keepit Backup service account is listed (or is the Organization Owner). If not, ask me before adding it.',
      ],
      verify: ['OAuth policy is On in every chosen organisation', 'The service account is a PCA member/owner in each'],
      pauseBefore: ['changing any policy or group membership'],
      links: [L('Azure DevOps requirements', 'azure-devops-category/requirements-for-azure-devops-connector-creation-and-backup/'), L('Change organisation-level permissions (Microsoft)', 'https://learn.microsoft.com/en-us/azure/devops/organizations/security/change-organization-collection-level-permissions?view=azure-devops&tabs=preview-page')],
    }, {
      id: 'ado-conn', title: 'Create the Azure DevOps connector', portal: 'Keepit + Microsoft sign-in', startUrl: keepitUrl,
      summary: 'Sign in with the service account (it needs "Allow user consent for apps" or Global Admin at creation time) and create the connector.',
      actions: ['Sign out of personal Microsoft accounts first', 'Add connector > Add Azure DevOps connector > Sign in > Accept', 'Name it and click Create'],
      detail: connectorCreate('Azure DevOps', ['Click Sign in. STOP and ask me to sign in with the service account.', 'Summarise the permissions and wait for my approval before Accept.', 'Rename the connector "Azure DevOps" and, after my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'accepting permissions'],
      links: [L('Create an Azure DevOps connector', 'azure-devops-category/create-an-azure-devops-connector/')],
    }],
  });

  // ── Power BI ───────────────────────────────────────────────────
  if (has('pbi')) phases.push({
    id: 'pbi', title: 'Power BI', subtitle: '1 step', coverage: L('Power BI coverage', 'power-bi-category/power-bi-backup-data-coverage/'),
    note: 'Personal workspaces and reports that cannot be downloaded as .pbix are not backed up.',
    steps: [{
      id: 'pbi-conn', title: 'Create the Power BI connector', portal: 'Keepit + Microsoft sign-in', startUrl: keepitUrl,
      summary: 'With the service account holding Global Admin, Fabric Administrator and a Power BI Pro/Premium licence, add the Power BI connector and choose the workspaces to protect.',
      actions: ['Check the service account has Global Admin + Fabric Administrator + Pro/Premium licence', 'Add connector > Power BI > sign in > Accept', 'Select workspaces and Create'],
      detail: connectorCreate('Power BI', ['Click Sign in / Continue. STOP and ask me to sign in with the service account.', 'Summarise the permissions and wait for my approval before Accept.', 'Show me the workspace selection and apply my choices. Rename the connector "Power BI".', 'After my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'accepting permissions'],
      links: [L('Set up your Power BI backup', 'power-bi-category/requirements-for-setting-up-a-power-bi-backup/')],
    }],
  });

  // ── Power Platform / D365 ──────────────────────────────────────
  if (has('pp')) phases.push({
    id: 'pp', title: 'Power Platform & Dynamics 365', subtitle: '2 steps', coverage: L('Power Platform / D365 coverage', 'power-platform-dynamics-365-category/power-platform-dynamics-365-backup-coverage/'),
    note: 'Power Apps and cloud flows are only backed up if they are part of a Microsoft solution.',
    steps: [{
      id: 'pp-prep', title: 'Check the security role and access mode in each environment', portal: 'Power Platform admin center', startUrl: 'https://admin.powerplatform.microsoft.com/',
      summary: 'The service account must be a System Administrator with Read-Write access in every environment you back up, and hold a Dynamics or Power Platform licence.',
      actions: ['Manage > Environments > [environment] > Access > Users', 'Add the service account if missing', 'Manage security roles: System administrator', 'Access Mode: Read-Write', 'Repeat for each environment'],
      detail: [
        'Open https://admin.powerplatform.microsoft.com/ > Manage > Environments. List the environments and ask me which ones to back up.',
        'For each: open it > Access > Users. If the Keepit Backup account is missing, ask me before clicking Add user.',
        'Open the user > Manage security roles: confirm System administrator is ticked.',
        'Under Administration confirm Access Mode = Read-Write.',
      ],
      verify: ['Service account is System administrator / Read-Write in every chosen environment'], pauseBefore: ['adding users or changing roles'],
      links: [L('Power Platform / D365 requirements', 'power-platform-dynamics-365-category/requirements-for-setting-up-a-power-platform-dynamics-365-backup/')],
    }, {
      id: 'pp-conn', title: 'Create the Power Platform / Dynamics 365 connector', portal: 'Keepit + Microsoft sign-in', startUrl: keepitUrl,
      summary: 'Add the connector, sign in, and choose which environments to include.',
      actions: ['Add connector > Add Power Platform / Dynamics 365 connector > Continue', 'Sign in and Accept', 'Select environments, then Create'],
      detail: connectorCreate('Power Platform / Dynamics 365', ['Click Continue. STOP and ask me to sign in with the service account.', 'Summarise the permissions and wait for approval before Accept.', 'Select the environments I chose in the previous step. Rename the connector "Power Platform / D365".', 'After my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'accepting permissions'],
      links: [L('Create a Power Platform / D365 connector', 'power-platform-dynamics-365-category/create-a-power-platform-dynamics-365-connector/')],
    }],
  });

  // ── Google Workspace ───────────────────────────────────────────
  if (has('gw')) phases.push({
    id: 'gw', title: 'Google Workspace', subtitle: '3 steps', coverage: L('Google Workspace coverage', 'google-workspace-category/google-workspace-backup-coverage/'),
    note: 'For suspended users only Gmail and non-native Drive files are backed up.',
    steps: [{
      id: 'gw-api', title: 'Prepare a Super Admin and allow third-party API access', portal: 'Google Admin console', startUrl: 'https://admin.google.com/',
      summary: 'Keepit needs a service account with the Super Administrator role (no paid licence required) — keep the role in place after setup. Third-party apps must be allowed API access.',
      actions: ['Create or choose a dedicated Super Admin (e.g. keepit_backup@)', 'Security > Access and data control > API controls > Settings', 'Unconfigured third-party apps: "Allow users to access third-party apps"', 'Save'],
      detail: [
        'Open https://admin.google.com/ (I will sign in). Ask me which account is the Keepit service account and confirm it has the Super Admin role (Directory > Users > [user] > Admin roles and privileges). Do not create or change roles without my approval.',
        'Go to Security > Access and data control > API controls.',
        'Click the Settings card > Unconfigured third-party apps.',
        'Select "(Default) Allow users to access third-party apps" and click Save.',
      ],
      verify: ['Service account shows Super Admin', 'Unconfigured third-party apps = Allow'], pauseBefore: ['changing API controls'],
      links: [L('Google Workspace requirements', 'google-workspace-category/requirements-for-setting-up-a-google-workspace-backup/')],
    }, {
      id: 'gw-app', title: 'Install the Keepit app from Google Workspace Marketplace', portal: 'Google Admin console', startUrl: 'https://admin.google.com/',
      summary: 'Install "Keepit for Google Workspace" for everyone in the organisation (can also be done during connector setup).',
      actions: ['Apps > Google Workspace Marketplace apps > Apps list > Install app', 'Search "Keepit backup" > Keepit for Google Workspace > Install', 'Install for Everyone at your organisation'],
      detail: [
        'In https://admin.google.com/ go to Apps > Google Workspace Marketplace apps > Apps list.',
        'Click Install app, search "Keepit backup" and open "Keepit for Google Workspace".',
        'Click Install. When asked who can use it, choose "Everyone at your organization". Wait for my approval before accepting the permission screen.',
      ],
      verify: ['Keepit for Google Workspace appears in the Apps list as installed for everyone'], pauseBefore: ['accepting the app permissions'],
      links: [L('Install the Keepit app', 'google-workspace-category/install-the-keepit-app-in-google-workspace-marketplace/')],
    }, {
      id: 'gw-conn', title: 'Create the Google Workspace connector', portal: 'Keepit + Google sign-in', startUrl: keepitUrl,
      summary: 'Sign in with the Super Admin and choose which users (by org unit / group) and whether Shared drives are included.',
      actions: ['Add connector > Add Google Workspace connector', 'Skip the install step if already done', 'Sign in as the Super Admin', 'Choose OUs / groups and Shared drives, then Create'],
      detail: connectorCreate('Google Workspace', ['If the Keepit app is already installed, select Skip this step.', 'Select Sign in. STOP and ask me to sign in with the Google Super Admin.', 'Rename the connector "Google Workspace". Show me the user selection (organisational units and groups — all users by default) and the Shared drives toggle; apply my choices.', 'After my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'clicking Create'],
      links: [L('Create a Google Workspace connector', 'google-workspace-category/create-a-google-workspace-connector/')],
    }],
  });

  // ── Salesforce ─────────────────────────────────────────────────
  if (has('sf')) phases.push({
    id: 'sf', title: 'Salesforce', subtitle: '2 steps',
    note: 'Supported editions: Professional (with API access), Enterprise, Unlimited, Performance, Einstein 1, Developer. Test permissions in a sandbox first.',
    steps: [{
      id: 'sf-user', title: 'Create the Keepit Salesforce user and permission set', portal: 'Salesforce Setup', startUrl: 'https://login.salesforce.com/',
      summary: 'Create a dedicated Salesforce user (System Administrator profile, or a custom profile with Modify All Data) and a "Keepit Backup Admin" permission set with the permissions Keepit lists.',
      actions: ['Setup > Users > New User "Keepit" with a Salesforce licence', 'Profile: System Administrator (or custom "Keepit User" with Modify All Data)', 'Setup > Permission Sets > New "Keepit Backup Admin" — enable the permissions in Keepit\'s article, then assign it', 'No login-hour restrictions; allow Keepit IPs if IP restrictions are on; password policy "Never expires"', 'If MFA is enforced org-wide, exclude this user'],
      detail: [
        'Open Salesforce Setup (I will sign in as a System Administrator).',
        'Setup > Users > New User. Name "Keepit", my chosen email, unique username (ask me). Assign a Salesforce user licence and the System Administrator profile (ask me if we prefer the custom-profile option instead). Save.',
        'Setup > Permission Sets > New. Label "Keepit Backup Admin". Save.',
        `Open ${H}salesforce-category/set-up-salesforce-user/ in a new tab and enable every permission listed there for the chosen profile option. Show me the list before saving.`,
        'Manage Assignments > Add Assignments > select the Keepit user.',
        'Check the Keepit user\'s profile: no login-hour restrictions; password policy set to Never expires. Report any IP restrictions so I can add Keepit\'s data-centre IP ranges.',
      ],
      verify: ['Keepit user is active with the permission set assigned', 'API Enabled permission present'], pauseBefore: ['creating the user', 'saving permission changes'],
      links: [L('Set up a Salesforce user', 'salesforce-category/set-up-salesforce-user/'), L('Permissions for Salesforce backup & restore', 'salesforce-category/permissions-for-salesforce-backup-and-restore/')],
    }, {
      id: 'sf-conn', title: 'Install the managed package and create the connector', portal: 'Keepit + Salesforce', startUrl: keepitUrl,
      summary: 'Keepit installs "keepit-sf-managed-package" (an External Client App) and then authorises with the Keepit user.',
      actions: ['Add connector > Add Salesforce connector > Production or Sandbox', 'Install > Install for Admins Only', 'Sign in with the Keepit user (Use Custom Domain if needed) and approve', 'Name it, set API request usage, Start backup'],
      detail: connectorCreate('Salesforce', [
        'Ask me whether this is Production or Sandbox and select it.',
        'Select Install. STOP and ask me to sign in with a Salesforce System Administrator. Select "Install for Admins Only" and wait for my approval before approving the installation.',
        'Return to the Keepit setup page. STOP and ask me to sign in with the Keepit Salesforce user (if login.salesforce.com is blocked, choose Use Custom Domain and ask me for it).',
        'Summarise the authorisation request and wait for approval.',
        'Enter the connector name "Salesforce – Production" (or Sandbox). Show me the API request usage toggle and apply my choice.',
        'After my confirmation, select Start backup.',
      ]),
      verify: ['keepit-sf-managed-package is listed under Setup > Installed Packages', 'Connector listed with first backup scheduled'], pauseBefore: ['installing the package', 'approving authorisation', 'Start backup'],
      links: [L('Create a Salesforce connector', 'salesforce-category/create-a-salesforce-connector/')],
    }],
  });

  // ── Atlassian ──────────────────────────────────────────────────
  const atlassian = (id: string, product: string, reqUrl: string, connUrl: string, cov: ImplLink, extraAccess: string, finish: string): ImplPhase => ({
    id, title: product === 'Jira' ? 'Jira & Jira Service Management' : product, subtitle: '2 steps', coverage: cov,
    steps: [{
      id: `${id}-role`, title: `Give the Keepit service account App Admin on ${product}`, portal: 'Atlassian Administration', startUrl: 'https://admin.atlassian.com/',
      summary: `Use a dedicated Atlassian account with the App Admin product role for ${product}. Anything the account can't see is excluded from backup.`,
      actions: ['admin.atlassian.com > Directory > Users > [service account]', `Product roles: App Admin under ${product === 'Jira' ? 'Jira Administration' : 'Confluence'} for the correct organisation`, extraAccess],
      detail: [
        'Open https://admin.atlassian.com/ > Directory > Users. Ask me which account is the Keepit service account.',
        'Open the user. In the user settings panel confirm you are viewing the organisation whose site we are connecting (ask me if there are several).',
        `In the Product roles column assign App Admin under ${product === 'Jira' ? 'Jira Administration' : 'Confluence'}. Wait for my approval before saving.`,
        extraAccess,
      ],
      verify: ['App Admin role shown for the correct site'], pauseBefore: ['assigning the role'],
      links: [L(`${product} backup requirements`, reqUrl)],
    }, {
      id: `${id}-conn`, title: `Create the ${product} connector`, portal: 'Keepit + Atlassian sign-in', startUrl: keepitUrl,
      summary: 'Enter your exact Atlassian site URL (e.g. yourname.atlassian.net), sign in with the admin account and create the connector.',
      actions: [`Add connector > Add ${product} connector`, 'Organization URL: exact host from your browser (yourname.atlassian.net)', 'Sign in > Accept', finish],
      detail: connectorCreate(product, ['Ask me for the exact Atlassian site host (e.g. yourname.atlassian.net) and enter it in Organization URL.', 'Click Sign in. STOP and ask me to sign in with the admin account.', 'Summarise the permissions and wait for approval before Accept.', `Rename the connector "${product}". After my confirmation, ${finish.toLowerCase()}.`]),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'accepting permissions'],
      links: [L(`Create a ${product} connector`, connUrl)],
    }],
  });
  if (has('jira')) phases.push(atlassian('jira', 'Jira', 'jira-category/requirements-for-setting-up-your-jira-backup/', 'jira-category/create-a-jira-connector/', L('Jira coverage', 'jira-category/jira-backup-coverage/'),
    'Team-managed projects: Project settings > Access > Add people > the service account as Administrator (repeat per project)', 'Click Start backup'));
  if (has('jira')) phases[phases.length - 1].note = 'Jira Service Management coverage: ' + H + 'jira-category/jsm-backup-coverage/';
  if (has('conf')) phases.push(atlassian('conf', 'Confluence', 'confluence-category/requirements-for-setting-up-your-confluence-backup/', 'confluence-category/create-a-confluence-connector/', L('Confluence coverage', 'confluence-category/confluence-backup-coverage/'),
    'Ask owners of restricted pages, blogs and spaces to share them (at least View) with the Keepit service account', 'Click Create'));

  // ── Simple OAuth SaaS connectors ───────────────────────────────
  const simple = (id: string, title: string, kind: string, summary: string, actions: string[], extra: string[], connUrl: string, cov: string, note?: string): ImplPhase => ({
    id, title, subtitle: '1 step', coverage: L(`${title} coverage`, cov), note,
    steps: [{
      id: `${id}-conn`, title: `Create the ${title} connector`, portal: `Keepit + ${title} sign-in`, startUrl: keepitUrl, summary, actions,
      detail: connectorCreate(kind, [...extra, 'Summarise the permissions requested and wait for my approval before accepting.', `Rename the connector "${title}". After my confirmation, click Create.`]),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in', 'accepting permissions'],
      links: [L(`Create a ${title} connector`, connUrl)],
    }],
  });
  if (has('zd')) phases.push(simple('zd', 'Zendesk', 'Zendesk', 'Enter your Zendesk company domain and sign in with an account that has admin access to the areas you want backed up.',
    ['Add connector > Add Zendesk connector', 'Enter your company domain > Sign in', 'Sign in as a Zendesk admin > Allow', 'Configure backup and Create'],
    ['Ask me for our Zendesk company domain and enter it, then select Sign in.', 'STOP and ask me to sign in with a Zendesk admin account.', 'Show me the backup configuration options (tickets, users, groups; optional views, macros, triggers, automations) and apply my choices.'],
    'zendesk-category/create-a-zendesk-connector/', 'zendesk-category/zendesk-backup-coverage/'));
  if (has('okta')) phases.push({
    id: 'okta', title: 'Okta', subtitle: '2 steps', coverage: L('Okta coverage', 'okta-category/okta-backup-coverage/'),
    steps: [{
      id: 'okta-app', title: 'Create the Okta app integration for Keepit', portal: 'Okta Admin Console', startUrl: 'https://login.okta.com/',
      summary: 'Create an OIDC web app integration, grant the read scopes, assign it to a Super Administrator and switch on refresh-token rotation (otherwise backups stop every 90 days).',
      actions: ['Security > Administrators: confirm a Super Administrator for authentication', 'Applications > Create App Integration > OIDC > Web Application', `Refresh Token grant; redirect URI https://${host}/desktop/oauth`, 'Okta API Scopes: grant the backup (and restore) scopes', 'Assign the app to the Super Admin', 'Refresh token behaviour: Rotate token after every use'],
      detail: [
        'Open the Okta Admin Console (I will sign in).',
        'Security > Administrators > Admins: confirm which user has Super Administrator and will authenticate the connector. If none is suitable, ask me before adding one.',
        'Applications > Applications > Create App Integration > OIDC - OpenID Connect > Web Application > Next.',
        `Name "Keepit Backup". Enable the Refresh Token grant type. Sign-in redirect URI: https://${host}/desktop/oauth. Assignments: Skip group assignment for now. Save.`,
        `Open the Okta API Scopes tab (refresh after a minute if empty). Grant the backup scopes listed in ${H}okta-category/configure-an-okta-app-integration (okta.apiTokens.read, okta.appGrants.read, okta.apps.read, okta.clients.read, okta.groups.read, okta.idps.read, okta.linkedObjects.read, okta.networkZones.read, okta.oauthIntegrations.read, okta.orgs.read, okta.policies.read, okta.profileMappings.read, okta.rateLimits.read, okta.roles.read, okta.schemas.read, okta.templates.read, okta.threatInsights.read, okta.trustedOrigins.read, okta.users.read, okta.userTypes.read, plus okta.authenticators.read and okta.captchas.read on Identity Engine). Ask me whether to also grant the restore scopes from that article.`,
        'Directory > People > [Super Admin user] > Applications > Assign Applications > Keepit Backup > Assign.',
        'Applications > Keepit Backup > General Settings > Edit > Refresh Token: "Rotate token after every use" > Save.',
        'Show me (on screen only) where the Client ID and Client Secret are — do not copy the secret into your report.',
      ],
      verify: ['App shows the scopes as granted', 'Refresh token rotation enabled', 'App assigned to the Super Admin'], pauseBefore: ['granting scopes', 'assigning the app'],
      links: [L('Configure an Okta app integration', 'okta-category/configure-an-okta-app-integration')],
    }, {
      id: 'okta-conn', title: 'Create the Okta connector', portal: 'Keepit + Okta sign-in', startUrl: keepitUrl,
      summary: 'Enter your Okta org host (without "-admin"), the application (client) ID and secret, then sign in as the Super Administrator.',
      actions: ['Add connector > Add Okta connector', 'Org host e.g. company.okta.com — not company-admin.okta.com', 'Paste client ID and secret > Sign in', 'Create'],
      detail: connectorCreate('Okta', ['Ask me for the Okta organisation host and enter it WITHOUT the -admin suffix (e.g. company.okta.com).', 'Ask me to paste the Client ID and Client Secret into the fields myself.', 'Click Sign in. STOP and ask me to sign in as the Super Administrator.', 'Rename the connector "Okta". After my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['entering the secret', 'signing in'],
      links: [L('Create an Okta connector', 'okta-category/create-an-okta-connector/')],
    }],
  });
  if (has('ds')) phases.push(simple('ds', 'Docusign', 'Docusign', 'Sign in with a dedicated Docusign admin. Only accounts this user can access are included in the backup.',
    ['Create a dedicated Docusign admin user', 'Add connector > Add Docusign connector > Sign in', 'Accept and Create'],
    ['Click Sign in. STOP and ask me to sign in with the dedicated Docusign admin account.'],
    'docusign-category/create-a-docusign-connector/', 'docusign-category/docusign-backup-coverage/', 'Envelopes are backed up (with documents and audit trails) but cannot be restored into the signing workflow — this is a Docusign platform limitation.'));
  if (has('bhr')) phases.push(simple('bhr', 'BambooHR', 'BambooHR', 'Enter your BambooHR organisation URL (company.bamboohr.com) and sign in with an admin account.',
    ['Add connector > Add BambooHR connector', 'Organization URL: company.bamboohr.com', 'Sign in as admin > Accept > Create', 'Share company files with the Keepit admin user'],
    ['Ask me for our BambooHR base URL (company.bamboohr.com) and enter it in Organization URL.', 'Click Sign in. STOP and ask me to sign in with a BambooHR admin.'],
    'bamboohr-category/create-a-bamboohr-connector/', 'bamboohr-category/bamboohr-backup-coverage/', 'Company files must be explicitly shared with the Keepit admin user in BambooHR to be backed up.'));
  if (has('miro')) phases.push({
    id: 'miro', title: 'Miro', subtitle: '2 steps', coverage: L('Miro coverage', 'miro-category/miro-backup-coverage/'), note: 'Keepit for Miro supports Miro Enterprise plan customers only.',
    steps: [simple('x', 'Miro', 'Miro', 'Sign in with a company admin who is a member of the team and has editor access to every space to be backed up.',
      ['Add connector > Add Miro connector > Sign in', 'Sign in as a Miro company admin', 'Accept and Create'],
      ['Click Sign in. STOP and ask me to sign in with a Miro company admin.'], 'miro-category/create-a-miro-connector/', 'miro-category/miro-backup-coverage/').steps[0],
    {
      id: 'miro-scope', title: 'Grant Keepit data access to all Miro teams', portal: 'Miro Admin Console', startUrl: 'https://miro.com/',
      summary: 'Make sure the Keepit app can see the entire organisation, not just one team.',
      actions: ['Avatar > Admin Console > Apps and integrations > Apps > Data access', 'Find "Keepit Backup and Recovery for Miro"', 'If scope isn\'t All teams: ••• > Edit > Permissions > Entire organization (all teams) > Save'],
      detail: ['Open https://miro.com/ as a company admin > avatar > Admin Console.', 'Apps and integrations > Apps > Data access tab.', 'Find "Keepit Backup and Recovery for Miro" and report its Data access scope.', 'If it is not All teams: ••• > Edit > Permissions > Data scope = Entire organization (all teams). Wait for approval, then Save.'],
      verify: ['Data access scope shows All teams'], pauseBefore: ['saving the scope change'],
      links: [L('Create a Miro connector', 'miro-category/create-a-miro-connector/')],
    }],
  });
  if (has('gh')) phases.push({
    id: 'gh', title: 'GitHub', subtitle: '2 steps', coverage: L('GitHub coverage', 'github-category/github-backup-coverage/'),
    steps: [{
      id: 'gh-app', title: 'Install the Keepit Backup GitHub App on your organisation', portal: 'GitHub', startUrl: 'https://github.com/apps/keepit-backup-for-github',
      summary: 'Install the app on the business organisation (not a personal account) that holds the repositories.',
      actions: ['Open github.com/apps/keepit-backup-for-github > Install', 'Choose the correct organisation', 'Review permissions > Install & Authorize'],
      detail: ['Open https://github.com/apps/keepit-backup-for-github and click Install.', 'List the installation targets and ask me which organisation to choose (never a personal account).', 'Summarise the requested permissions and wait for approval, then click Install & Authorize.'],
      verify: ['Organisation Settings > GitHub Apps lists Keepit Backup'], pauseBefore: ['Install & Authorize'],
      links: [L('Create a GitHub connector', 'github-category/create-a-github-connector/')],
    }, {
      id: 'gh-conn', title: 'Create the GitHub connector', portal: 'Keepit + GitHub sign-in', startUrl: keepitUrl,
      summary: 'Enter the organisation URL (github.com/YourOrg), connect, and sign in as an organisation owner.',
      actions: ['Add connector > Add GitHub connector', 'Organization URL: github.com/YourOrg > Connect', 'Sign in as an org owner > Create'],
      detail: connectorCreate('GitHub', ['Enter the organisation URL (https://github.com/<org>) for the org where the app was installed, then click Connect.', 'STOP and ask me to sign in with an organisation owner.', 'Rename the connector "GitHub". After my confirmation, click Create.']),
      verify: ['Connector listed with first backup scheduled'], pauseBefore: ['signing in'],
      links: [L('Create a GitHub connector', 'github-category/create-a-github-connector/')],
    }],
  });
  if (has('monday')) phases.push(simple('monday', 'Monday.com', 'monday.com', 'Sign in with a dedicated monday.com admin account and authorise Keepit.',
    ['Add connector > Add monday.com connector > Sign in', 'Sign in as admin > Authorize', 'Create'],
    ['Click Sign in. STOP and ask me to sign in with the monday.com admin account.'],
    'monday-category/create-a-monday-connector/', 'monday-category/monday-backup-coverage/'));
  if (has('forma')) phases.push({
    id: 'forma', title: 'Autodesk Forma', subtitle: '3 steps', coverage: L('Autodesk Forma coverage', 'autodesk-forma-category/autodesk-forma-coverage/'),
    note: 'Requires Autodesk Platform Services. The authorising user must be Hub Admin, assigned to each project, with Build and Data Management activated per project.',
    steps: [{
      id: 'forma-aps', title: 'Create the integration app in Autodesk Platform Services', portal: 'aps.autodesk.com', startUrl: 'https://aps.autodesk.com/',
      summary: 'Create a Traditional Web App, note its Client ID/Secret, set the Keepit callback and enable the required APIs.',
      actions: ['Developer Hubs > Applications > Create application (Traditional Web App)', `Callback URL https://${host}/desktop/oauth`, 'API Access: Data Management API, Forma API, BIM 360 API', 'Note Client ID and Client Secret'],
      detail: ['Open https://aps.autodesk.com/ (I will sign in) > Developer Hubs > Applications > Create application.', 'Type: Traditional Web App. Name: "Keepit Backup".', `General Settings > Callback URL: https://${host}/desktop/oauth.`, 'API Access: add Data Management API, Forma API (formerly ACC), BIM 360 API. Save.', 'Show me where the Client ID and Client Secret are — do not put the secret in your report.'],
      verify: ['App exists with callback URL and three APIs enabled'], pauseBefore: ['creating the application'],
      links: [L('Create an Autodesk Forma connector', 'autodesk-forma-category/create-an-autodesk-forma-connector/')],
    }, {
      id: 'forma-hub', title: 'Register Keepit as a custom integration in Forma', portal: 'Autodesk Forma', startUrl: 'https://acc.autodesk.com/',
      summary: 'Add the APS Client ID as a custom integration and note the Hub ID.',
      actions: ['Hub Admin > Custom Integrations > Add custom integration', 'Paste the APS Client ID, name it', 'Note the Hub ID > Next > Proceed anyway'],
      detail: ['Open Autodesk Forma (I will sign in) > Hub Admin > Custom Integrations > Add custom integration.', 'Ask me to paste the APS Client ID. Name: "Keepit Backup".', 'Note the Hub ID shown in the dialog and report it. Click Next, then Proceed anyway after my approval.'],
      verify: ['Keepit Backup listed under Custom Integrations', 'Hub ID recorded'], pauseBefore: ['Proceed anyway'],
      links: [L('Create an Autodesk Forma connector', 'autodesk-forma-category/create-an-autodesk-forma-connector/')],
    }, {
      id: 'forma-conn', title: 'Create the Autodesk Forma connector', portal: 'Keepit + Autodesk sign-in', startUrl: keepitUrl,
      summary: 'Enter the Hub ID, Client ID and Client Secret in Keepit, sign in and create the connector.',
      actions: ['Connectors > Add connector > Autodesk Forma', 'Organization ID = Hub ID; Application ID = Client ID; Application Secret = Client Secret', 'Sign in, grant access, name and Create'],
      detail: [`Open ${keepitUrl} > Connectors > Add connector > Autodesk Forma.`, 'Enter the Hub ID as Organization ID. Ask me to paste the Client ID and Client Secret myself.', 'Select Sign in. STOP and ask me to sign in to Autodesk and grant access.', 'Name the connector "Autodesk Forma". After my confirmation, select Create.'],
      verify: ['Connector listed and initial backup started'], pauseBefore: ['entering the secret', 'signing in'],
      links: [L('Create an Autodesk Forma connector', 'autodesk-forma-category/create-an-autodesk-forma-connector/')],
    }],
  });

  // ── Platform ───────────────────────────────────────────────────
  if (has('sso')) phases.push({
    id: 'sso', title: 'Single Sign-On (Entra ID)', subtitle: '3 steps', note: 'Requires a Microsoft Entra Premium subscription to add a non-gallery SAML app. Create an SSO Admin first so nobody is locked out if SSO is misconfigured.',
    steps: [{
      id: 'sso-entra', title: 'Create the SAML application in Microsoft Entra', portal: 'Microsoft Entra admin center', startUrl: 'https://entra.microsoft.com/',
      summary: 'Create a non-gallery enterprise app with Keepit\'s Entity ID and Reply URL, then download the Base64 certificate and copy the Login URL.',
      actions: ['Enterprise applications > New application > Create your own (Non-gallery)', 'Single sign-on > SAML', `Entity ID https://${host}/sso/metadata · Reply URL https://${host}/sso/login`, 'Download Certificate (Base64); copy the Login URL (IDP URL)'],
      detail: ['Open https://entra.microsoft.com/ > Applications > Enterprise applications > + New application > + Create your own application.', 'Name "Keepit SSO", choose "Integrate any other application you don\'t find in the gallery (Non-gallery)", Create.', 'Single sign-on > SAML. Basic SAML Configuration > pencil icon.', `Add identifier (Entity ID): https://${host}/sso/metadata. Add reply URL: https://${host}/sso/login. Save.`, 'In SAML Certificates, Download Certificate (Base64) and tell me where it saved.', 'Copy the Login URL from the "Set up Keepit SSO" box and report it.'],
      verify: ['Entity ID and Reply URL saved', 'Certificate downloaded and Login URL recorded'], pauseBefore: ['creating the application'],
      links: [L('Set up SSO using Microsoft Entra', 'platform-category/set-up-sso-using-microsoft-entra-as-identity-provider/'), L('SSO setup requirements', 'platform-category/sso-setup-requirements/')],
    }, {
      id: 'sso-users', title: 'Assign users and check they exist in Keepit', portal: 'Entra + Keepit', startUrl: 'https://entra.microsoft.com/',
      summary: 'Assign the Master Admin and other SSO users to the Entra app, then check the same users exist in Keepit with exactly matching (case-sensitive) email/UPN.',
      actions: ['Enterprise app > Users and groups > Add user/group > select users > Assign', 'Keepit > Account info > Users: confirm each user exists (case-sensitive)', 'Create an SSO Admin user in Keepit'],
      detail: ['In Entra open Enterprise applications > Keepit SSO > Users and groups > + Add user/group > None Selected. Ask me which users (always include the Master Admin). Select > Assign.', `Open ${keepitUrl} > account profile (lower-left) > Account info > Users. Compare against the Entra assignments; report any missing users or case mismatches. Do not create users without my approval.`, 'Ask me whether an SSO Admin already exists; if not, guide me through creating one (it keeps Keepit-password access to the SSO settings).'],
      verify: ['Every SSO user exists in both Entra assignment and Keepit with matching email case', 'An SSO Admin exists'], pauseBefore: ['assigning users', 'creating Keepit users'],
      links: [L('Set up SSO using Microsoft Entra', 'platform-category/set-up-sso-using-microsoft-entra-as-identity-provider/')],
    }, {
      id: 'sso-keepit', title: 'Configure and enable SSO in Keepit', portal: 'Keepit', startUrl: keepitUrl,
      summary: 'Paste the IDP URL and certificate into Keepit. Leave "Allow IdP-initiated SSO" off (Keepit flags it as a security risk) and only make SSO mandatory once tested.',
      actions: ['Account info > Security > SSO > + Add configuration', 'Enable configuration; IDP URL = Entra Login URL; paste the Base64 certificate', 'Leave IdP-initiated off; test before making SSO mandatory', `Users sign in at https://${host}/desktop/signin with email only`],
      detail: [`Open ${keepitUrl} > account profile > Account info > Security > SSO > + Add configuration.`, 'Turn on Enable configuration. Name "Entra ID SSO". Paste the Entra Login URL into IDP URL.', 'Ask me to paste the certificate text (include both BEGIN/END markers or neither).', 'Leave "Allow IdP-initiated SSO" OFF. Ask me whether to turn on "Make SSO mandatory" — recommend leaving it off until a test user has signed in successfully.', 'After my confirmation, Save.'],
      verify: [`A test user signs in at https://${host}/desktop/signin via Entra`], pauseBefore: ['saving the configuration', 'making SSO mandatory'],
      links: [L('Configure SSO in Keepit', 'platform-category/configure-sso-in-keepit/')],
    }],
  });
  if (has('siem')) phases.push({
    id: 'siem', title: 'SIEM integration (Splunk)', subtitle: '2 steps', note: 'If SIEM integration is not visible in your account, ask us and we will have Keepit enable it.',
    steps: [{
      id: 'siem-hec', title: 'Prepare the Splunk HTTP Event Collector', portal: 'Splunk', startUrl: 'https://www.splunk.com/',
      summary: 'Create an enabled HEC token with source type _json, note the HEC URI, and make sure queueSize is large enough (50 MB recommended).',
      actions: ['Settings > Data inputs > HTTP Event Collector > New token', 'Source type _json; token enabled', 'Copy the token value and your HEC URI', 'Set queueSize to ~50MB'],
      detail: ['Open our Splunk instance (ask me for the URL; I will sign in).', 'Settings > Data inputs > HTTP Event Collector > New Token. Name "Keepit". Source type: _json. Ensure the token is enabled. Ask for approval before Submit.', 'Show me the token value on screen (do not put it in your report) and work out our HEC URI format with me.', 'Remind me to confirm queueSize is ~50MB on the Splunk server.'],
      verify: ['HEC token enabled with _json source type'], pauseBefore: ['creating the token'],
      links: [L('Set up a SIEM integration', 'platform-category/set-up-a-siem-integration/')],
    }, {
      id: 'siem-keepit', title: 'Add the SIEM integration in Keepit', portal: 'Keepit', startUrl: keepitUrl,
      summary: 'Add the HEC token and URI in Keepit and choose audit log and/or job monitor events. Data arrives in Splunk every 5 minutes.',
      actions: ['Account info > Security > SIEM Integration > + Add integration', 'Name, HEC token, HEC URI', 'Choose data sources; Enable configuration; Save'],
      detail: [`Open ${keepitUrl} > account profile > Account info > Security > SIEM Integration > + Add integration.`, 'Name "Splunk". Ask me to paste the HEC token. Enter the HEC URI.', 'Ask me which data sources to include (audit log, job monitor).', 'Turn on Enable configuration and, after my confirmation, Save.'],
      verify: ['First Keepit events visible in Splunk after ~5 minutes'], pauseBefore: ['saving'],
      links: [L('Set up a SIEM integration', 'platform-category/set-up-a-siem-integration/')],
    }],
  });
  if (has('api')) phases.push({
    id: 'api', title: 'Keepit API', subtitle: 'Reference',
    steps: [{
      id: 'api-docs', title: 'Review the Keepit API documentation', portal: 'Keepit Help', startUrl: H + 'api-category/', infoOnly: true,
      summary: 'Use the Keepit API for automation and reporting (e.g. backup status into your own tooling). Scope this with us — it is usually tailored to your environment.',
      actions: ['Read the API category on Keepit Help', 'Decide what you want to automate (reporting, job status, audit)', 'Contact us to scope it'],
      detail: [], verify: [], links: [L('API information', 'api-category/')],
    }],
  });

  // ── Final: verify & go live ────────────────────────────────────
  phases.push({
    id: 'golive', title: 'Verify & go live', subtitle: 'Confirm first backups and hand over',
    steps: [{
      id: 'golive-check', title: 'Confirm every connector completed its first backup', portal: 'Keepit', startUrl: keepitUrl,
      summary: 'Initial backups can take hours or days depending on data volume. Check each connector\'s status and job history and investigate anything skipped or failed.',
      actions: ['Connectors page: every connector shows a successful or in-progress backup', 'Check the job monitor for failures or skipped items', 'Do a small test restore from one connector', 'Record connector names and owners for your runbook'],
      detail: [`Open ${keepitUrl} > Connectors.`, 'For every connector report: name, type, status, last backup time, and any warnings or skipped items.', 'Open the job monitor / activity view and list any failed or incomplete jobs with their error text.', 'Do not start restores or change configuration — report only.'],
      verify: ['All connectors listed with status', 'No unexplained failures'],
      links: [L('Keepit Help Center', 'https://www.keepit.com/help/')],
    }],
  });

  return phases;
}

export function buildCoworkPrompt(step: ImplStep, ctx: { accountName: string; phase: ImplPhase; stepNo: number; total: number; next?: ImplStep; opts: ImplOptions; moduleNames: string[] }): string {
  const host = `${ctx.opts.dc}.keepit.com`;
  const lines: string[] = [];
  lines.push(`You are Claude, operating my Chrome browser (Claude CoWork) to complete ONE step of a Keepit backup implementation for ${ctx.accountName}.`);
  lines.push('');
  lines.push(`## This step (${ctx.stepNo} of ${ctx.total}): ${step.title}`);
  lines.push(`Section: ${ctx.phase.title}`);
  lines.push(`Where: ${step.portal} — start at ${step.startUrl}`);
  lines.push('');
  lines.push('## Context');
  lines.push(`- Keepit data centre / hostname: ${host} (https://${host}/)`);
  lines.push(`- Keepit modules in scope: ${ctx.moduleNames.join(', ')}`);
  lines.push(`- Goal of this step: ${step.summary}`);
  if (step.needs?.length) lines.push(`- Prerequisites: ${step.needs.join('; ')}`);
  lines.push(`- Official Keepit guidance (open it if the screen differs from these instructions): ${step.links.map(l => l.url).join(' , ')}`);
  lines.push('');
  lines.push('## Ground rules');
  lines.push('- I am signed in to the relevant admin portals. If any sign-in, MFA or password prompt appears, STOP and ask me to complete it. Never type, store or repeat passwords, client secrets, tokens or private keys.');
  lines.push('- Only do what this step describes. Do not change any other settings, delete anything, or move on to the next step.');
  if (step.pauseBefore?.length) lines.push(`- Pause and get my explicit confirmation before: ${step.pauseBefore.join('; ')}.`);
  lines.push('- If the UI does not match (renamed menus, missing options), describe what you see and ask me before improvising.');
  lines.push('');
  lines.push('## Instructions');
  step.detail.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
  lines.push('');
  lines.push('## Check before finishing');
  step.verify.forEach(v => lines.push(`- ${v}`));
  lines.push('');
  lines.push('## Summary Report');
  lines.push('When done, give me a structured report I can save:');
  lines.push('- Everything you created or changed (names, IDs, settings — old value → new value). Never include secrets.');
  lines.push('- Anything you could not complete and why.');
  lines.push('- Warnings: permissions granted, admin roles assigned, or settings that may conflict with our policies.');
  lines.push(ctx.next ? `- Confirm I am ready for the next step: "${ctx.next.title}".` : '- Confirm the Keepit implementation is complete and list recommended follow-ups.');
  return lines.join('\n');
}
