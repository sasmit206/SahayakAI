"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRecommendation = formatRecommendation;
function formatRecommendation(scheme, eligibility) {
    return {
        schemeId: scheme.schemeId,
        schemeName: scheme.schemeName,
        slug: scheme.slug,
        level: scheme.level,
        category: scheme.category,
        tags: scheme.tags,
        benefits: scheme.benefits,
        eligibilityText: scheme.eligibility,
        documents: scheme.documents,
        application: scheme.application,
        score: eligibility.score,
        isEligible: eligibility.isEligible,
        reasons: eligibility.reasons,
    };
}
exports.default = formatRecommendation;
