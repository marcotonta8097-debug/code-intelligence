/**
 * cint.landing.brief.v1 — Professional marketing landing brief for Code Intelligence.
 *
 * NOT the auth gateway Landing door (Login/Signup entry).
 * NOT to be generated until architecture phases are accepted + stabilized.
 *
 * Gate: do not paint this brochure into FOC, Replica host chrome, or CI workspace
 * panels. Marketing surface only after Truth Map accept + identity seal + registry/
 * entity/workflow authority (Phases 1–5 minimum).
 */

import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";

export const CINT_LANDING_BRIEF_KEY = "cint.landing.brief.v1" as const;

export const CINT_LANDING_BRIEF_GATE = {
  /** Auth gateway page remains the sealed product door until marketing brief is authorized. */
  authGatewayPage: "Landing",
  marketingSurfaceId: "marketing_landing",
  earliestPhase: 8,
  requires: [
    "phase_1_truth_map_accepted",
    "phase_2_identity_sealed",
    "phase_3_registry_authority",
    "phase_4_entity_authority",
    "phase_5_workflow_authority",
    "workspace_parity_stable",
  ],
  forbiddenUntilGate: [
    "regenerate_application_for_marketing",
    "replace_auth_gateway_with_brochure",
    "invent_Evidence_or_Reports_pages_outside_sealed_manifest",
  ],
} as const;

/**
 * Sealed workspace preview on the marketing page must map to pack pages.
 * Brief copy mentioned Evidence/Reports — those are SECTIONs/features, not new PAGE invent.
 */
export const CINT_LANDING_WORKSPACE_PREVIEW_NAV = [
  "Overview",
  "Repositories",
  "Architecture",
  "Security",
  "Dependencies",
  "Quality",
  "Findings",
  "Documentation",
  "Assistant",
  "Remediation",
  "History",
  "Settings",
] as const;

export type CodeIntelligenceLandingBrief = Readonly<{
  version: "cint.landing.brief.v1";
  /** Operator-authorized after Phases 1–5; Login/Signup remain separate doors. */
  authorized: boolean;
  message: string;
  brand: {
    logoTitle: "CODE INTELLIGENCE";
    logoKicker: "Engineering Intelligence Platform";
  };
  navigation: readonly string[];
  primaryCta: "Request Demo";
  hero: {
    theme: "dark_enterprise";
    backgroundMotifs: readonly string[];
    headline: "Understand More Than Code.";
    headlineAlternates: readonly string[];
    subheadline: string;
    ctas: readonly string[];
    secondaryCta: "Access Workspace";
  };
  trustCards: readonly { title: string; line: string }[];
  problem: {
    headline: string;
    subheadline: string;
    cascade: readonly string[];
  };
  pillars: readonly { title: string; body: string }[];
  howItWorks: readonly string[];
  workspacePreview: {
    nav: readonly string[];
    center: readonly string[];
    right: readonly string[];
    note: string;
  };
  knowledgeCrisis: {
    headline: string;
    subheadline: string;
    preserved: readonly string[];
  };
  securityGovernance: {
    headline: string;
    features: readonly string[];
  };
  audiences: readonly { role: string; line: string }[];
  vision: { headline: string; body: string };
  finalCta: {
    headline: string;
    subheadline: string;
    buttons: readonly string[];
  };
  visual: {
    not: readonly string[];
    use: readonly string[];
    inspiredBy: readonly string[];
    palette: Readonly<Record<string, string>>;
  };
  gate: typeof CINT_LANDING_BRIEF_GATE;
}>;

export const CODE_INTELLIGENCE_LANDING_BRIEF: CodeIntelligenceLandingBrief = {
  version: "cint.landing.brief.v1",
  authorized: true,
  message:
    "Understanding, preserving, governing, and protecting engineering intelligence — not generic productivity SaaS.",
  brand: {
    logoTitle: "CODE INTELLIGENCE",
    logoKicker: "Engineering Intelligence Platform",
  },
  navigation: [
    "Platform",
    "Solutions",
    "Intelligence",
    "Security",
    "Documentation",
    "Pricing",
    "Sign In",
  ],
  primaryCta: "Request Demo",
  hero: {
    theme: "dark_enterprise",
    backgroundMotifs: [
      "Repository Graph",
      "Architecture Map",
      "Dependency Connections",
      "Evidence Flows",
    ],
    headline: "Understand More Than Code.",
    headlineAlternates: [
      "Engineering Intelligence Beyond Repositories.",
      "Preserve Knowledge. Reduce Risk. Understand Systems.",
      "The Operating System For Engineering Intelligence.",
    ],
    subheadline:
      "Analyze repositories, uncover architectural risks, preserve engineering knowledge, and build an authoritative understanding of your software ecosystem.",
    ctas: ["Explore Platform", "Request Demo"],
    secondaryCta: "Access Workspace",
  },
  trustCards: [
    { title: "Repository Intelligence", line: "Understand what exists." },
    { title: "Engineering Intelligence", line: "Understand why it exists." },
    {
      title: "Knowledge Intelligence",
      line: "Ensure critical knowledge never leaves with people.",
    },
  ],
  problem: {
    headline: "Your Code Is Not Your Biggest Asset.",
    subheadline:
      "Your architecture, decisions, ownership, dependencies, processes and engineering knowledge are often more valuable than the code itself.",
    cascade: [
      "Code",
      "Architecture",
      "Knowledge",
      "Ownership",
      "Risk",
      "Organizational Intelligence",
    ],
  },
  pillars: [
    {
      title: "Repository Intelligence",
      body: "Analyze repositories, branches, contributors and code structure.",
    },
    {
      title: "Architecture Intelligence",
      body: "Visualize modules, dependencies, and system relationships.",
    },
    {
      title: "Risk Intelligence",
      body: "Identify technical, architectural, and ownership risks.",
    },
    {
      title: "Security Intelligence",
      body: "Expose vulnerabilities, misconfigurations and weaknesses.",
    },
    {
      title: "Knowledge Intelligence",
      body: "Preserve decisions, context, ownership and institutional knowledge.",
    },
    {
      title: "Remediation Intelligence",
      body: "Convert findings into actionable remediation plans.",
    },
  ],
  howItWorks: [
    "Connect Repository",
    "Analyze Codebase",
    "Map Architecture",
    "Generate Findings",
    "Investigate Risks",
    "Produce Evidence",
    "Recommend Actions",
    "Preserve Knowledge",
  ],
  workspacePreview: {
    nav: [...CINT_LANDING_WORKSPACE_PREVIEW_NAV],
    center: [
      "Repository Health",
      "Architecture Score",
      "Technical Debt",
      "Open Investigations",
      "Critical Findings",
    ],
    right: ["Recent Activity", "Recommendations", "Ownership Risks"],
    note:
      "Preview nav is sealed pack pages only. Evidence/Reports from draft copy map to Findings evidence + History — not new PAGE invent.",
  },
  knowledgeCrisis: {
    headline: "What Happens When Key Engineers Leave?",
    subheadline:
      "Most organizations can back up code. Very few can preserve the knowledge behind it.",
    preserved: [
      "Decisions",
      "Ownership",
      "Architecture",
      "Rationale",
      "Dependencies",
      "Lessons Learned",
    ],
  },
  securityGovernance: {
    headline: "Built For Engineering Trust",
    features: [
      "Role-Based Access",
      "Audit Trails",
      "Evidence Tracking",
      "Governance Controls",
      "Investigation History",
      "Security Reviews",
      "Decision Tracking",
    ],
  },
  audiences: [
    { role: "Software Architects", line: "Understand architecture and dependencies." },
    { role: "Security Teams", line: "Identify vulnerabilities and risks." },
    { role: "Engineering Managers", line: "Track health and technical debt." },
    { role: "Developers", line: "Understand repositories faster." },
    { role: "Project Managers", line: "Gain visibility into delivery risks." },
    { role: "Organizations", line: "Preserve engineering knowledge." },
  ],
  vision: {
    headline: "Beyond Repository Analysis",
    body: "Code Intelligence is evolving toward a complete Engineering Intelligence Platform capable of understanding repositories, architecture, ownership, knowledge, risks, and software systems as a whole.",
  },
  finalCta: {
    headline: "Turn Repositories Into Organizational Intelligence",
    subheadline:
      "Move beyond code scanning and gain a complete understanding of your engineering ecosystem.",
    buttons: ["Request Demo", "Start Evaluation", "Sign In"],
  },
  visual: {
    not: ["Startup", "Colorful", "Playful"],
    use: ["Enterprise", "Professional", "High Trust", "Engineering Focused"],
    inspiredBy: [
      "Datadog",
      "GitHub Enterprise",
      "Linear",
      "Vercel Enterprise",
      "HashiCorp",
      "Cloudflare",
      "Stripe",
    ],
    palette: {
      background: "#0B1020",
      panels: "#111827",
      accent: "#3B82F6",
      success: "#10B981",
      warning: "#F59E0B",
      critical: "#EF4444",
    },
  },
  gate: CINT_LANDING_BRIEF_GATE,
};

/** Hard refuse marketing landing generation until architecture phases pass. */
export function mayGenerateCodeIntelligenceMarketingLanding(input: {
  truthMapAccepted?: boolean;
  identitySealed?: boolean;
  registryAuthorityOk?: boolean;
  entityAuthorityOk?: boolean;
  workflowAuthorityOk?: boolean;
  workspaceParityStable?: boolean;
  explicitAuthorizeMarketingLanding?: boolean;
}): { ok: boolean; reason: string } {
  if (!input.explicitAuthorizeMarketingLanding) {
    return {
      ok: false,
      reason: "Marketing landing requires explicit authorization after Phases 1–5 stabilize.",
    };
  }
  if (!input.truthMapAccepted) {
    return { ok: false, reason: "Phase 1 Truth Map not accepted." };
  }
  if (!input.identitySealed) {
    return { ok: false, reason: "Phase 2 identity not sealed (cint.identity.v1)." };
  }
  if (!input.registryAuthorityOk || !input.entityAuthorityOk || !input.workflowAuthorityOk) {
    return {
      ok: false,
      reason: "Phases 3–5 registry/entity/workflow authority incomplete.",
    };
  }
  if (!input.workspaceParityStable) {
    return { ok: false, reason: "Workspace nav/route/panel parity not stable." };
  }
  // Keep pack title aligned — do not drift into generic SaaS.
  if (CODE_INTELLIGENCE_DOMAIN_PACK.title !== "Code Intelligence") {
    return { ok: false, reason: "Domain pack title drift." };
  }
  return { ok: true, reason: "Marketing landing authorized." };
}
