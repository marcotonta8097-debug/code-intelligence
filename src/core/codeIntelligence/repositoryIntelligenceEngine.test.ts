import { describe, expect, it } from "vitest";
import {
  analyzeDemoRepositories,
  analyzeRepositoryIntelligence,
  CODE_INTELLIGENCE_DEMO_TREES,
} from "@/core/codeIntelligence/repositoryIntelligenceEngine";
import {
  auditRegistryAuthority,
  CODE_INTELLIGENCE_REQUIRED_CAPABILITIES,
  CODE_INTELLIGENCE_REQUIRED_FEATURES,
  CODE_INTELLIGENCE_REQUIRED_RELATIONSHIPS,
  RelationshipAuthorityError,
  assertDomainPackMayFreeze,
} from "@/core/domainPack/registryAuthority";
import { CODE_INTELLIGENCE_DOMAIN_PACK } from "@/core/domainPack/codeIntelligenceDomainPack";

describe("Pack 02 — repository intelligence engine", () => {
  it("builds a repository profile, dependency graph, and tech profile from a snapshot", () => {
    const intel = analyzeRepositoryIntelligence(CODE_INTELLIGENCE_DEMO_TREES["payments-api"]!);
    expect(intel.profile.languages).toEqual(expect.arrayContaining(["Go", "YAML"]));
    expect(intel.profile.configs.join(" ")).toMatch(/go\.mod|Dockerfile/i);
    expect(intel.dependencies.nodes.map((node) => node.name)).toEqual(
      expect.arrayContaining(["github.com/gin-gonic/gin", "github.com/golang-jwt/jwt"]),
    );
    expect(intel.dependencies.edges.every((edge) => edge.type === "DependsOn")).toBe(true);
    expect(intel.tech.backend).toEqual(expect.arrayContaining(["Gin"]));
    expect(intel.tech.database).toEqual(expect.arrayContaining(["pgx"]));
    expect(intel.tech.infrastructure.length).toBeGreaterThan(0);
    expect(intel.profile.provenance).toBe("deterministic_scan");
  });

  it("reads package.json for catalog-service", () => {
    const intel = analyzeRepositoryIntelligence(CODE_INTELLIGENCE_DEMO_TREES["catalog-service"]!);
    expect(intel.profile.languages).toContain("TypeScript");
    expect(intel.dependencies.nodes.map((node) => node.name)).toEqual(
      expect.arrayContaining(["express", "ioredis", "react"]),
    );
    expect(intel.tech.frontend).toContain("React");
    expect(intel.tech.backend).toContain("Express");
    expect(intel.tech.database).toEqual(expect.arrayContaining(["redis"]));
  });

  it("demo trees are deterministic", () => {
    expect(Object.keys(analyzeDemoRepositories()).sort()).toEqual(["catalog-service", "payments-api"]);
  });
});

describe("Pack 01 — registry coverage 100%", () => {
  it("features, capabilities, and required relationships are sealed", () => {
    const report = auditRegistryAuthority(CODE_INTELLIGENCE_DOMAIN_PACK);
    expect(report.missingFeatures).toEqual([]);
    expect(report.missingCapabilities).toEqual([]);
    expect(report.missingRequiredRelationships).toEqual([]);
    expect(report.health.features).toBe(100);
    expect(report.health.capabilities).toBe(100);
    expect(report.health.relationships).toBe(100);
    expect(report.health.overall).toBe(100);
    expect(report.ok).toBe(true);
    const labels = CODE_INTELLIGENCE_DOMAIN_PACK.features.map((feature) => feature.label);
    for (const feature of CODE_INTELLIGENCE_REQUIRED_FEATURES) {
      expect(labels).toContain(feature);
    }
    const caps = new Set(CODE_INTELLIGENCE_DOMAIN_PACK.roles.flatMap((role) => role.capabilities));
    for (const cap of CODE_INTELLIGENCE_REQUIRED_CAPABILITIES) {
      expect(caps.has(cap)).toBe(true);
    }
    for (const edge of CODE_INTELLIGENCE_REQUIRED_RELATIONSHIPS) {
      expect(
        CODE_INTELLIGENCE_DOMAIN_PACK.relationships.some(
          (rel) => rel.from === edge.from && rel.to === edge.to,
        ),
      ).toBe(true);
    }
  });

  it("throws RELATIONSHIP_AUTHORITY_ERROR when a required edge is missing", () => {
    expect(() =>
      assertDomainPackMayFreeze({
        userPrompt: "Build a Code Intelligence platform for repositories, findings, investigations, and remediation.",
        fieldRegistryId: "field:code_intelligence",
      }),
    ).not.toThrow();

    const broken = {
      ...CODE_INTELLIGENCE_DOMAIN_PACK,
      relationships: CODE_INTELLIGENCE_DOMAIN_PACK.relationships.filter(
        (edge) => !(edge.from === "Repository" && edge.to === "Finding"),
      ),
    };
    const report = auditRegistryAuthority(broken);
    expect(report.missingRequiredRelationships).toContain("Repository->Finding");
    expect(() => {
      throw new RelationshipAuthorityError(report.missingRequiredRelationships);
    }).toThrow(/RELATIONSHIP_AUTHORITY_ERROR/);
  });
});
