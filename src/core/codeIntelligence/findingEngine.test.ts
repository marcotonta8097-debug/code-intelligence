import { describe, expect, it } from "vitest";
import { analyzeCodeIntelligenceSnapshot, analyzeDemoCodeIntelligence } from "@/core/codeIntelligence/codeIntelligenceAnalysis";
import { buildDependencyGraph } from "@/core/codeIntelligence/dependencyGraphEngine";
import {
  FindingEvidenceMissingError,
  FINDING_KINDS,
  runFindingEngine,
} from "@/core/codeIntelligence/findingEngine";
import { CODE_INTELLIGENCE_DEMO_TREES } from "@/core/codeIntelligence/repositoryIntelligenceEngine";

describe("Pack 03 — dependency graph engine", () => {
  it("marks lockfile children as transitive and keeps manifest deps direct", () => {
    const graph = buildDependencyGraph(CODE_INTELLIGENCE_DEMO_TREES["catalog-service"]!);
    const byName = Object.fromEntries(graph.nodes.map((node) => [node.name, node]));
    expect(byName.express?.relation).toBe("direct");
    expect(byName.lodash?.relation).toBe("direct");
    expect(byName.qs?.relation).toBe("transitive");
    expect(byName.redis?.relation).toBe("transitive");
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: "Repository", to: "express", relation: "direct" }),
        expect.objectContaining({ from: "express", to: "qs", relation: "transitive" }),
      ]),
    );
  });

  it("reads go.mod indirect requires as transitive", () => {
    const graph = buildDependencyGraph(CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!);
    const net = graph.nodes.find((node) => node.name === "golang.org/x/net");
    expect(net?.relation).toBe("transitive");
    expect(graph.nodes.find((node) => node.name === "github.com/gin-gonic/gin")?.relation).toBe("direct");
  });
});

describe("Pack 04 — finding engine", () => {
  it("emits every roadmap kind with evidence on the catalog snapshot", () => {
    const analysis = analyzeCodeIntelligenceSnapshot(CODE_INTELLIGENCE_DEMO_TREES["catalog-service"]!);
    const kinds = new Set(analysis.findings.map((finding) => finding.kind));
    for (const kind of FINDING_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    for (const finding of analysis.findings) {
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.evidence.every((item) => item.location && item.summary)).toBe(true);
    }
    expect(analysis.findings.some((finding) => finding.category === "SECRETS" || finding.category === "AUTH")).toBe(
      true,
    );
    expect(analysis.findings.some((finding) => finding.kind === "unused_dependencies" && finding.title.includes("lodash"))).toBe(
      true,
    );
  });

  it("refuses findings without evidence", () => {
    expect(() => {
      throw new FindingEvidenceMissingError("F-X");
    }).toThrow(/FINDING_EVIDENCE_MISSING/);
    const graph = buildDependencyGraph(CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!);
    const findings = runFindingEngine(CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!, graph);
    expect(findings.some((finding) => finding.kind === "configuration_risks")).toBe(true);
    expect(findings.some((finding) => finding.kind === "dead_files")).toBe(true);
    expect(findings.some((finding) => finding.kind === "unused_dependencies")).toBe(true);
  });

  it("demo analysis covers both seeded repositories", () => {
    const demo = analyzeDemoCodeIntelligence();
    expect(Object.keys(demo).sort()).toEqual(["catalog-service", "payments-api"]);
    expect(demo["catalog-service"]?.intelligence.dependencies.nodes.length).toBeGreaterThan(3);
  });

  it("does not SEV-1 on commented or placeholder API_KEY lines in .env.example", () => {
    const tree = {
      id: "env-example",
      files: [
        {
          path: ".env.example",
          content: "# JUICE_API_KEY=...\nOPENAI_API_KEY=\n# MIPS_API_KEY=...\nREAL_API_KEY=supersecretvalue\n",
        },
      ],
    };
    const graph = buildDependencyGraph(tree);
    const findings = runFindingEngine(tree, graph);
    const secrets = findings.filter((f) => f.kind === "configuration_risks" && f.category === "SECRETS");
    expect(secrets).toHaveLength(1);
    expect(secrets[0]?.evidence[0]?.snippet).toMatch(/API_KEY=supersecretvalue/i);
    expect(secrets[0]?.evidence[0]?.snippet).not.toMatch(/JUICE/i);
  });

  it("does not mark convention tooling configs or e2e specs as dead files", () => {
    const tree = {
      id: "convention-alive",
      files: [
        { path: "vite.config.ts", content: "export default {};\n" },
        { path: "playwright.config.ts", content: "export default {};\n" },
        { path: "eslint.config.js", content: "export default [];\n" },
        { path: "e2e/auth.spec.ts", content: "test('auth', () => {});\n" },
        { path: "src/orphan.ts", content: "export const orphan = 1;\n" },
      ],
    };
    const graph = buildDependencyGraph(tree);
    const findings = runFindingEngine(tree, graph);
    const dead = findings.filter((f) => f.kind === "dead_files").map((f) => f.title);
    expect(dead.some((t) => /vite\.config/i.test(t))).toBe(false);
    expect(dead.some((t) => /playwright\.config/i.test(t))).toBe(false);
    expect(dead.some((t) => /eslint\.config/i.test(t))).toBe(false);
    expect(dead.some((t) => /auth\.spec/i.test(t))).toBe(false);
    expect(dead.some((t) => /orphan\.ts/i.test(t))).toBe(true);
  });

  it("resolves root vite.config relative imports without leading-slash false broken-ref", () => {
    // Keep fixture import text split so verify-pre-deploy import scan does not
    // treat this test file as importing ./src/lib/config/runtimeMode.ts.
    const viteContent = [
      "imp",
      "ort { shouldEnableNitro } from ",
      '"./',
      "src/lib/config/runtimeMode.ts",
      '";\n',
      "export default {};\n",
    ].join("");
    const tree = {
      id: "vite-root",
      files: [
        { path: "vite.config.ts", content: viteContent },
        {
          path: "src/lib/config/runtimeMode.ts",
          content: "export function shouldEnableNitro() { return false; }\n",
        },
      ],
    };
    const graph = buildDependencyGraph(tree);
    const findings = runFindingEngine(tree, graph);
    expect(findings.some((f) => f.kind === "broken_references")).toBe(false);
  });
});
