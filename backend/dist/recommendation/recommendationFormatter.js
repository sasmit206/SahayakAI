"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRecommendation = formatRecommendation;
const schemeTranslator_1 = require("../i18n/schemeTranslator");
// `lang` controls whether the citizen-facing scheme text (name, benefits,
// eligibility, documents, application, category, tags) is shown in Hindi.
// `eligibility.reasons` is already localized by the caller (evaluateEligibility
// is invoked with the same lang), so it's passed through unchanged here.
async function formatRecommendation(scheme, eligibility, lang = 'en') {
    if (lang === 'hi') {
        const hi = await (0, schemeTranslator_1.translateSchemeToHindi)(scheme);
        return {
            schemeId: scheme.schemeId,
            schemeName: hi.schemeName,
            slug: scheme.slug,
            level: scheme.level,
            category: hi.category,
            tags: hi.tags,
            benefits: hi.benefits,
            eligibilityText: hi.eligibilityText,
            documents: hi.documents,
            application: hi.application,
            score: eligibility.score,
            isEligible: eligibility.isEligible,
            reasons: eligibility.reasons,
        };
    }
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
