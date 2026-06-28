"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateEligibility = evaluateEligibility;
const scoringRules_1 = require("./scoringRules");
function evaluateEligibility(profile, scheme) {
    const reasons = [];
    let score = 0;
    let isEligible = true;
    // 1. STATE FILTER
    if (scheme.level.toLowerCase() === 'state' && scheme.states.length > 0) {
        if (profile.state) {
            const stateMatch = scheme.states.some(s => s.toLowerCase() === profile.state.toLowerCase());
            if (stateMatch) {
                score += scoringRules_1.SCORING_WEIGHTS.STATE_MATCH;
                reasons.push(`State matches scheme restriction: ${profile.state}`);
            }
            else {
                isEligible = false;
                reasons.push(`Ineligible: Scheme is only for residents of ${scheme.states.join(', ')} but applicant resides in ${profile.state}`);
            }
        }
        else {
            // Citizen state is missing, cannot confirm eligibility
            // We don't exclude immediately but note that state matches are pending
            reasons.push(`State match pending (scheme requires: ${scheme.states.join(', ')})`);
        }
    }
    else {
        // Central scheme - matches all states
        score += scoringRules_1.SCORING_WEIGHTS.STATE_MATCH;
        reasons.push('State eligible: Scheme is a Central initiative available nationwide.');
    }
    // 2. GENDER FILTER
    if (scheme.gender !== 'All') {
        if (profile.gender) {
            if (profile.gender.toLowerCase() === scheme.gender.toLowerCase()) {
                score += scoringRules_1.SCORING_WEIGHTS.GENDER_MATCH;
                reasons.push(`Gender matches: ${profile.gender}`);
            }
            else {
                isEligible = false;
                reasons.push(`Ineligible: Scheme is restricted to ${scheme.gender} but applicant is ${profile.gender}`);
            }
        }
        else {
            reasons.push(`Gender match pending (scheme requires: ${scheme.gender})`);
        }
    }
    else {
        score += scoringRules_1.SCORING_WEIGHTS.GENDER_MATCH;
        reasons.push('Gender eligible: Scheme is open to all genders.');
    }
    // 3. INCOME FILTER
    if (scheme.incomeLimit !== null && scheme.incomeLimit > 0) {
        if (profile.income !== null) {
            if (profile.income <= scheme.incomeLimit) {
                score += scoringRules_1.SCORING_WEIGHTS.INCOME_MATCH;
                reasons.push(`Income eligible: Family income ₹${profile.income.toLocaleString('en-IN')} is below the limit of ₹${scheme.incomeLimit.toLocaleString('en-IN')}`);
            }
            else {
                isEligible = false;
                reasons.push(`Ineligible: Family income ₹${profile.income.toLocaleString('en-IN')} exceeds the limit of ₹${scheme.incomeLimit.toLocaleString('en-IN')}`);
            }
        }
        else {
            reasons.push(`Income check pending (scheme income limit: ₹${scheme.incomeLimit.toLocaleString('en-IN')})`);
        }
    }
    else {
        score += scoringRules_1.SCORING_WEIGHTS.INCOME_MATCH;
        reasons.push('Income eligible: No income restriction specified.');
    }
    // 4. AGE FILTER
    if (scheme.minAge !== null || scheme.maxAge !== null) {
        if (profile.age !== null) {
            let ageEligible = true;
            if (scheme.minAge !== null && profile.age < scheme.minAge) {
                ageEligible = false;
                reasons.push(`Ineligible: Applicant age (${profile.age}) is below the minimum age of ${scheme.minAge}`);
            }
            if (scheme.maxAge !== null && profile.age > scheme.maxAge) {
                ageEligible = false;
                reasons.push(`Ineligible: Applicant age (${profile.age}) is above the maximum age of ${scheme.maxAge}`);
            }
            if (ageEligible) {
                score += scoringRules_1.SCORING_WEIGHTS.AGE_MATCH;
                const limitsText = scheme.minAge !== null && scheme.maxAge !== null
                    ? `between ${scheme.minAge} and ${scheme.maxAge}`
                    : scheme.minAge !== null
                        ? `>= ${scheme.minAge}`
                        : `<= ${scheme.maxAge}`;
                reasons.push(`Age eligible: Applicant age ${profile.age} is within the limit (${limitsText})`);
            }
            else {
                isEligible = false;
            }
        }
        else {
            const reqText = scheme.minAge !== null && scheme.maxAge !== null
                ? `${scheme.minAge}-${scheme.maxAge} years`
                : scheme.minAge !== null
                    ? `at least ${scheme.minAge} years`
                    : `maximum ${scheme.maxAge} years`;
            reasons.push(`Age check pending (scheme requires: ${reqText})`);
        }
    }
    else {
        score += scoringRules_1.SCORING_WEIGHTS.AGE_MATCH;
        reasons.push('Age eligible: No age restriction specified.');
    }
    // 5. OCCUPATION FILTER
    if (scheme.occupations.length > 0 && !scheme.occupations.includes('Other')) {
        if (profile.occupation) {
            const occMatch = scheme.occupations.some(o => o.toLowerCase() === profile.occupation.toLowerCase());
            if (occMatch) {
                score += scoringRules_1.SCORING_WEIGHTS.OCCUPATION_MATCH;
                reasons.push(`Occupation matches scheme target: ${profile.occupation}`);
            }
            else {
                // If occupation is specified but doesn't match, we reduce score, but only invalidate if it's strict
                // Many schemes aren't strictly exclusive but target specific groups
                // We will treat it as eligible but with 0 occupation score, unless the scheme specifically targets ONLY a different group.
                // Let's inspect the scheme occupations. If it specifies construction worker and applicant is student, it doesn't match.
                // Let's treat occupation mismatch as ineligible if they have a non-matching specific occupation.
                isEligible = false;
                reasons.push(`Ineligible: Scheme targets ${scheme.occupations.join(', ')} but applicant is a ${profile.occupation}`);
            }
        }
        else {
            reasons.push(`Occupation match pending (scheme targets: ${scheme.occupations.join(', ')})`);
        }
    }
    else {
        score += scoringRules_1.SCORING_WEIGHTS.OCCUPATION_MATCH;
        reasons.push('Occupation eligible: Open to all occupations.');
    }
    // 6. CATEGORY FILTER
    if (scheme.categories.length > 0) {
        if (profile.category) {
            const catMatch = scheme.categories.some(c => c.toLowerCase() === profile.category.toLowerCase());
            if (catMatch) {
                score += scoringRules_1.SCORING_WEIGHTS.CATEGORY_MATCH;
                reasons.push(`Social Category matches scheme target: ${profile.category}`);
            }
            else {
                isEligible = false;
                reasons.push(`Ineligible: Scheme is for ${scheme.categories.join(', ')} but applicant category is ${profile.category}`);
            }
        }
        else {
            reasons.push(`Category check pending (scheme targets: ${scheme.categories.join(', ')})`);
        }
    }
    else {
        score += scoringRules_1.SCORING_WEIGHTS.CATEGORY_MATCH;
        reasons.push('Category eligible: Open to all social categories.');
    }
    // 7. DISABILITY FILTER
    if (scheme.disabilityOnly) {
        if (profile.disabilityStatus !== null) {
            if (profile.disabilityStatus === true) {
                score += 15; // bonus score for matching disability requirement
                reasons.push('Disability check matches: Applicant has disabled status.');
            }
            else {
                isEligible = false;
                reasons.push('Ineligible: Scheme is exclusively for disabled persons.');
            }
        }
        else {
            reasons.push('Disability check pending (scheme is exclusively for disabled persons)');
        }
    }
    return {
        isEligible,
        score: isEligible ? score : 0, // only return a positive score if the citizen is actually eligible
        reasons,
    };
}
