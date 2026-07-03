import { CitizenProfile } from '../profile/profileExtractor';
import { SchemeMetadata } from '../ingestion/normalizer';
import { SCORING_WEIGHTS, EligibilityResult } from './scoringRules';
import { Lang } from '../i18n/botStrings';

// Bilingual reason-line builders. Each function takes whatever values are
// needed to fill in the sentence and returns the sentence in the requested
// language. Keeping English and Hindi side-by-side (rather than a generic
// key/value template file) makes it easy to see exactly what a citizen in
// either language will read for every eligibility branch below.
const R = {
  stateMatch: (lang: Lang, state: string) =>
    lang === 'hi' ? `राज्य मेल खाता है: ${state}` : `State matches scheme restriction: ${state}`,
  stateMismatch: (lang: Lang, allowed: string, state: string) =>
    lang === 'hi'
      ? `अपात्र: यह योजना केवल ${allowed} के निवासियों के लिए है, लेकिन आवेदक ${state} में रहता है`
      : `Ineligible: Scheme is only for residents of ${allowed} but applicant resides in ${state}`,
  statePending: (lang: Lang, allowed: string) =>
    lang === 'hi'
      ? `राज्य जांच लंबित (योजना के लिए आवश्यक: ${allowed})`
      : `State match pending (scheme requires: ${allowed})`,
  stateCentral: (lang: Lang) =>
    lang === 'hi'
      ? 'राज्य पात्र: यह एक केंद्रीय योजना है और पूरे देश में उपलब्ध है।'
      : 'State eligible: Scheme is a Central initiative available nationwide.',

  genderMatch: (lang: Lang, gender: string) =>
    lang === 'hi' ? `लिंग मेल खाता है: ${gender}` : `Gender matches: ${gender}`,
  genderMismatch: (lang: Lang, required: string, gender: string) =>
    lang === 'hi'
      ? `अपात्र: यह योजना केवल ${required} के लिए है, लेकिन आवेदक ${gender} है`
      : `Ineligible: Scheme is restricted to ${required} but applicant is ${gender}`,
  genderPending: (lang: Lang, required: string) =>
    lang === 'hi'
      ? `लिंग जांच लंबित (योजना के लिए आवश्यक: ${required})`
      : `Gender match pending (scheme requires: ${required})`,
  genderAll: (lang: Lang) =>
    lang === 'hi' ? 'लिंग पात्र: यह योजना सभी के लिए खुली है।' : 'Gender eligible: Scheme is open to all genders.',

  incomeMatch: (lang: Lang, income: string, limit: string) =>
    lang === 'hi'
      ? `आय पात्र: पारिवारिक आय ₹${income} सीमा ₹${limit} से कम है`
      : `Income eligible: Family income ₹${income} is below the limit of ₹${limit}`,
  incomeMismatch: (lang: Lang, income: string, limit: string) =>
    lang === 'hi'
      ? `अपात्र: पारिवारिक आय ₹${income}, ₹${limit} की सीमा से अधिक है`
      : `Ineligible: Family income ₹${income} exceeds the limit of ₹${limit}`,
  incomePending: (lang: Lang, limit: string) =>
    lang === 'hi'
      ? `आय जांच लंबित (योजना की आय सीमा: ₹${limit})`
      : `Income check pending (scheme income limit: ₹${limit})`,
  incomeNone: (lang: Lang) =>
    lang === 'hi'
      ? 'आय पात्र: कोई आय सीमा निर्दिष्ट नहीं है।'
      : 'Income eligible: No income restriction specified.',

  ageBelowMin: (lang: Lang, age: number, min: number) =>
    lang === 'hi'
      ? `अपात्र: आवेदक की आयु (${age}) न्यूनतम आयु ${min} से कम है`
      : `Ineligible: Applicant age (${age}) is below the minimum age of ${min}`,
  ageAboveMax: (lang: Lang, age: number, max: number) =>
    lang === 'hi'
      ? `अपात्र: आवेदक की आयु (${age}) अधिकतम आयु ${max} से अधिक है`
      : `Ineligible: Applicant age (${age}) is above the maximum age of ${max}`,
  ageMatch: (lang: Lang, age: number, limitsText: string) =>
    lang === 'hi'
      ? `आयु पात्र: आवेदक की आयु ${age}, सीमा (${limitsText}) के भीतर है`
      : `Age eligible: Applicant age ${age} is within the limit (${limitsText})`,
  agePending: (lang: Lang, reqText: string) =>
    lang === 'hi'
      ? `आयु जांच लंबित (योजना के लिए आवश्यक: ${reqText})`
      : `Age check pending (scheme requires: ${reqText})`,
  ageNone: (lang: Lang) =>
    lang === 'hi'
      ? 'आयु पात्र: कोई आयु सीमा निर्दिष्ट नहीं है।'
      : 'Age eligible: No age restriction specified.',
  ageLimitsBetween: (lang: Lang, min: number, max: number) =>
    lang === 'hi' ? `${min} और ${max} के बीच` : `between ${min} and ${max}`,
  ageLimitsMin: (lang: Lang, min: number) => (lang === 'hi' ? `>= ${min}` : `>= ${min}`),
  ageLimitsMax: (lang: Lang, max: number) => (lang === 'hi' ? `<= ${max}` : `<= ${max}`),
  ageReqRange: (lang: Lang, min: number, max: number) =>
    lang === 'hi' ? `${min}-${max} वर्ष` : `${min}-${max} years`,
  ageReqMin: (lang: Lang, min: number) => (lang === 'hi' ? `कम से कम ${min} वर्ष` : `at least ${min} years`),
  ageReqMax: (lang: Lang, max: number) => (lang === 'hi' ? `अधिकतम ${max} वर्ष` : `maximum ${max} years`),

  occMatch: (lang: Lang, occupation: string) =>
    lang === 'hi' ? `व्यवसाय मेल खाता है: ${occupation}` : `Occupation matches scheme target: ${occupation}`,
  occMismatch: (lang: Lang, allowed: string, occupation: string) =>
    lang === 'hi'
      ? `अपात्र: यह योजना ${allowed} के लिए है, लेकिन आवेदक ${occupation} है`
      : `Ineligible: Scheme targets ${allowed} but applicant is a ${occupation}`,
  occPending: (lang: Lang, allowed: string) =>
    lang === 'hi'
      ? `व्यवसाय जांच लंबित (योजना का लक्ष्य: ${allowed})`
      : `Occupation match pending (scheme targets: ${allowed})`,
  occAll: (lang: Lang) =>
    lang === 'hi' ? 'व्यवसाय पात्र: सभी व्यवसायों के लिए खुला है।' : 'Occupation eligible: Open to all occupations.',

  catMatch: (lang: Lang, category: string) =>
    lang === 'hi' ? `सामाजिक श्रेणी मेल खाती है: ${category}` : `Social Category matches scheme target: ${category}`,
  catMismatch: (lang: Lang, allowed: string, category: string) =>
    lang === 'hi'
      ? `अपात्र: यह योजना ${allowed} के लिए है, लेकिन आवेदक की श्रेणी ${category} है`
      : `Ineligible: Scheme is for ${allowed} but applicant category is ${category}`,
  catPending: (lang: Lang, allowed: string) =>
    lang === 'hi'
      ? `श्रेणी जांच लंबित (योजना का लक्ष्य: ${allowed})`
      : `Category check pending (scheme targets: ${allowed})`,
  catAll: (lang: Lang) =>
    lang === 'hi'
      ? 'श्रेणी पात्र: सभी सामाजिक श्रेणियों के लिए खुला है।'
      : 'Category eligible: Open to all social categories.',

  disMatch: (lang: Lang) =>
    lang === 'hi' ? 'विकलांगता जांच मेल खाती है: आवेदक विकलांग है।' : 'Disability check matches: Applicant has disabled status.',
  disMismatch: (lang: Lang) =>
    lang === 'hi' ? 'अपात्र: यह योजना केवल विकलांग व्यक्तियों के लिए है।' : 'Ineligible: Scheme is exclusively for disabled persons.',
  disPending: (lang: Lang) =>
    lang === 'hi'
      ? 'विकलांगता जांच लंबित (योजना केवल विकलांग व्यक्तियों के लिए है)'
      : 'Disability check pending (scheme is exclusively for disabled persons)',
};

export function evaluateEligibility(
  profile: CitizenProfile,
  scheme: SchemeMetadata,
  lang: Lang = 'en'
): EligibilityResult {
  const reasons: string[] = [];
  let score = 0;
  let isEligible = true;

  // 1. STATE FILTER
  if (scheme.level.toLowerCase() === 'state' && scheme.states.length > 0) {
    if (profile.state) {
      const stateMatch = scheme.states.some(
        s => s.toLowerCase() === profile.state!.toLowerCase()
      );
      if (stateMatch) {
        score += SCORING_WEIGHTS.STATE_MATCH;
        reasons.push(R.stateMatch(lang, profile.state));
      } else {
        isEligible = false;
        reasons.push(R.stateMismatch(lang, scheme.states.join(', '), profile.state));
      }
    } else {
      reasons.push(R.statePending(lang, scheme.states.join(', ')));
    }
  } else {
    score += SCORING_WEIGHTS.STATE_MATCH;
    reasons.push(R.stateCentral(lang));
  }

  // 2. GENDER FILTER
  if (scheme.gender !== 'All') {
    if (profile.gender) {
      if (profile.gender.toLowerCase() === scheme.gender.toLowerCase()) {
        score += SCORING_WEIGHTS.GENDER_MATCH;
        reasons.push(R.genderMatch(lang, profile.gender));
      } else {
        isEligible = false;
        reasons.push(R.genderMismatch(lang, scheme.gender, profile.gender));
      }
    } else {
      reasons.push(R.genderPending(lang, scheme.gender));
    }
  } else {
    score += SCORING_WEIGHTS.GENDER_MATCH;
    reasons.push(R.genderAll(lang));
  }

  // 3. INCOME FILTER
  if (scheme.incomeLimit !== null && scheme.incomeLimit > 0) {
    if (profile.income !== null) {
      if (profile.income <= scheme.incomeLimit) {
        score += SCORING_WEIGHTS.INCOME_MATCH;
        reasons.push(R.incomeMatch(lang, profile.income.toLocaleString('en-IN'), scheme.incomeLimit.toLocaleString('en-IN')));
      } else {
        isEligible = false;
        reasons.push(R.incomeMismatch(lang, profile.income.toLocaleString('en-IN'), scheme.incomeLimit.toLocaleString('en-IN')));
      }
    } else {
      reasons.push(R.incomePending(lang, scheme.incomeLimit.toLocaleString('en-IN')));
    }
  } else {
    score += SCORING_WEIGHTS.INCOME_MATCH;
    reasons.push(R.incomeNone(lang));
  }

  // 4. AGE FILTER
  if (scheme.minAge !== null || scheme.maxAge !== null) {
    if (profile.age !== null) {
      let ageEligible = true;
      if (scheme.minAge !== null && profile.age < scheme.minAge) {
        ageEligible = false;
        reasons.push(R.ageBelowMin(lang, profile.age, scheme.minAge));
      }
      if (scheme.maxAge !== null && profile.age > scheme.maxAge) {
        ageEligible = false;
        reasons.push(R.ageAboveMax(lang, profile.age, scheme.maxAge));
      }

      if (ageEligible) {
        score += SCORING_WEIGHTS.AGE_MATCH;
        const limitsText =
          scheme.minAge !== null && scheme.maxAge !== null
            ? R.ageLimitsBetween(lang, scheme.minAge, scheme.maxAge)
            : scheme.minAge !== null
            ? R.ageLimitsMin(lang, scheme.minAge)
            : R.ageLimitsMax(lang, scheme.maxAge as number);
        reasons.push(R.ageMatch(lang, profile.age, limitsText));
      } else {
        isEligible = false;
      }
    } else {
      const reqText =
        scheme.minAge !== null && scheme.maxAge !== null
          ? R.ageReqRange(lang, scheme.minAge, scheme.maxAge)
          : scheme.minAge !== null
          ? R.ageReqMin(lang, scheme.minAge)
          : R.ageReqMax(lang, scheme.maxAge as number);
      reasons.push(R.agePending(lang, reqText));
    }
  } else {
    score += SCORING_WEIGHTS.AGE_MATCH;
    reasons.push(R.ageNone(lang));
  }

  // 5. OCCUPATION FILTER
  if (scheme.occupations.length > 0 && !scheme.occupations.includes('Other')) {
    if (profile.occupation) {
      const occMatch = scheme.occupations.some(
        o => o.toLowerCase() === profile.occupation!.toLowerCase()
      );
      if (occMatch) {
        score += SCORING_WEIGHTS.OCCUPATION_MATCH;
        reasons.push(R.occMatch(lang, profile.occupation));
      } else {
        isEligible = false;
        reasons.push(R.occMismatch(lang, scheme.occupations.join(', '), profile.occupation));
      }
    } else {
      reasons.push(R.occPending(lang, scheme.occupations.join(', ')));
    }
  } else {
    score += SCORING_WEIGHTS.OCCUPATION_MATCH;
    reasons.push(R.occAll(lang));
  }

  // 6. CATEGORY FILTER
  if (scheme.categories.length > 0) {
    if (profile.category) {
      const catMatch = scheme.categories.some(
        c => c.toLowerCase() === profile.category!.toLowerCase()
      );
      if (catMatch) {
        score += SCORING_WEIGHTS.CATEGORY_MATCH;
        reasons.push(R.catMatch(lang, profile.category));
      } else {
        isEligible = false;
        reasons.push(R.catMismatch(lang, scheme.categories.join(', '), profile.category));
      }
    } else {
      reasons.push(R.catPending(lang, scheme.categories.join(', ')));
    }
  } else {
    score += SCORING_WEIGHTS.CATEGORY_MATCH;
    reasons.push(R.catAll(lang));
  }

  // 7. DISABILITY FILTER
  if (scheme.disabilityOnly) {
    if (profile.disabilityStatus !== null) {
      if (profile.disabilityStatus === true) {
        score += 15;
        reasons.push(R.disMatch(lang));
      } else {
        isEligible = false;
        reasons.push(R.disMismatch(lang));
      }
    } else {
      reasons.push(R.disPending(lang));
    }
  }

  return {
    isEligible,
    score: isEligible ? score : 0,
    reasons,
  };
}
