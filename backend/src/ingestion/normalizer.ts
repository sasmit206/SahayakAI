export interface SchemeMetadata {
  schemeId: string;
  schemeName: string;
  slug: string;
  level: string;
  category: string[];
  tags: string[];
  states: string[];
  gender: 'Male' | 'Female' | 'All';
  incomeLimit: number | null;
  minAge: number | null;
  maxAge: number | null;
  categories: string[];
  occupations: string[];
  disabilityOnly: boolean;
}

export interface SchemeDocument extends SchemeMetadata {
  details: string;
  benefits: string;
  eligibility: string;
  application: string;
  documents: string;
  searchText: string;
}

// List of Indian States & Union Territories to extract
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Puducherry', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Daman and Diu',
  'Dadra and Nagar Haveli', 'Lakshadweep', 'Andaman and Nicobar'
];

export function normalizeRow(row: any, index: number): SchemeDocument {
  const schemeName = (row.scheme_name || '').trim();
  const slug = (row.slug || `scheme-${index}`).trim();
  const details = (row.details || '').trim();
  const benefits = (row.benefits || '').trim();
  const eligibility = (row.eligibility || '').trim();
  const application = (row.application || '').trim();
  const documents = (row.documents || '').trim();
  const level = (row.level || 'Central').trim();
  
  // Parse category (comma separated)
  const categoryRaw = row.schemeCategory || '';
  const category = categoryRaw
    .split(',')
    .map((c: string) => c.trim())
    .filter((c: string) => c.length > 0);

  // Parse tags (comma separated)
  const tagsRaw = row.tags || '';
  const tags = tagsRaw
    .split(',')
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 0);

  const schemeId = slug || `scheme-${index}`;

  // Deterministic metadata extraction from text fields
  const fullTextForMatching = `${schemeName} ${details} ${eligibility} ${benefits}`.toLowerCase();

  // Extract States
  const states: string[] = [];
  if (level.toLowerCase() === 'state') {
    for (const state of INDIAN_STATES) {
      if (fullTextForMatching.includes(state.toLowerCase())) {
        states.push(state);
      }
    }
  }

  // Extract Gender
  let gender: 'Male' | 'Female' | 'All' = 'All';
  const hasFemaleKeywords = 
    fullTextForMatching.includes('women') ||
    fullTextForMatching.includes('female') ||
    fullTextForMatching.includes('girl') ||
    fullTextForMatching.includes('widow') ||
    fullTextForMatching.includes('daughter') ||
    fullTextForMatching.includes('mother');

  const hasMaleKeywords = 
    fullTextForMatching.includes('boys') ||
    fullTextForMatching.includes('male') ||
    fullTextForMatching.includes('son') ||
    fullTextForMatching.includes('husband') ||
    fullTextForMatching.includes('brother') ||
    fullTextForMatching.includes('father') ||
    fullTextForMatching.includes('grandson');

  if (hasFemaleKeywords && !hasMaleKeywords) {
    gender = 'Female';
  } else if (hasMaleKeywords && !hasFemaleKeywords) {
    gender = 'Male';
  }

  // Extract Income Limit
  let incomeLimit: number | null = null;
  // Look for patterns like:
  // "income should not exceed 75,000"
  // "income less than 2,00,000"
  // "income limit of Rs. 1,00,000"
  // "income is below 1,00,000"
  // "income up to Rs. 1,00,000"
  // We remove commas from numbers during check
  const incomeRegexes = [
    /(?:income|salary)\s+(?:should\s+)?not\s+exceed\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /(?:income|salary)\s+(?:is\s+)?less\s+than\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /(?:income|salary)\s+limit\s+of\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /(?:income|salary)\s+(?:must\s+)?be\s+below\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /(?:income|salary)\s+up\s+to\s*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /annual\s+family\s+income\s*(?:is\s+)?(?:rs\.?|₹)?\s*([\d,]+)/i
  ];

  for (const regex of incomeRegexes) {
    const match = eligibility.match(regex);
    if (match && match[1]) {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(val) && val > 0) {
        incomeLimit = val;
        break;
      }
    }
  }

  // Extract Age Range
  let minAge: number | null = null;
  let maxAge: number | null = null;

  // Patterns like "18-60 years", "between 18 and 60", "age of 18 to 60"
  const rangeAgeRegex = /(?:age\s+of|between|in\s+the\s+age\s+group\s+of)?\s*(\d+)\s*(?:-|to|and)\s*(\d+)\s*(?:years)/i;
  const rangeMatch = eligibility.match(rangeAgeRegex);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    minAge = parseInt(rangeMatch[1], 10);
    maxAge = parseInt(rangeMatch[2], 10);
  } else {
    // Check separate min age, e.g. "age should be 18 years or more", "above 18 years", "at least 18 years"
    const minAgeRegexes = [
      /(?:age\s+should\s+be|age\s+is|above|at\s+least|minimum\s+age\s+of)\s*(\d+)\s*(?:years\s+or\s+more|years|years\s+of\s+age)?/i
    ];
    for (const regex of minAgeRegexes) {
      const match = eligibility.match(regex);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val >= 0 && val < 100) {
          minAge = val;
          break;
        }
      }
    }

    // Check separate max age, e.g. "not exceed 60 years", "less than 60 years"
    const maxAgeRegexes = [
      /(?:not\s+exceed|less\s+than|maximum\s+age\s+of)\s*(\d+)\s*(?:years)/i
    ];
    for (const regex of maxAgeRegexes) {
      const match = eligibility.match(regex);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > 0 && val < 120) {
          maxAge = val;
          break;
        }
      }
    }
  }

  // Extract Category
  const categories: string[] = [];
  const lowercaseName = schemeName.toLowerCase();
  const lowercaseElig = eligibility.toLowerCase();
  
  const isExclusiveCategory = 
    lowercaseName.includes('scheduled caste') ||
    lowercaseName.includes('scheduled tribe') ||
    lowercaseName.includes('sc/st') ||
    lowercaseName.includes('brahmin') ||
    lowercaseName.includes('minority') ||
    lowercaseElig.includes('only for sc') ||
    lowercaseElig.includes('only for st') ||
    lowercaseElig.includes('belong to the brahmin') ||
    lowercaseElig.includes('must belong to sc') ||
    lowercaseElig.includes('must belong to st');

  if (fullTextForMatching.includes('obc') || fullTextForMatching.includes('other backward')) categories.push('OBC');
  if (fullTextForMatching.includes('sc') || fullTextForMatching.includes('scheduled caste') || fullTextForMatching.includes('scheduled castes')) categories.push('SC');
  if (fullTextForMatching.includes('st') || fullTextForMatching.includes('scheduled tribe') || fullTextForMatching.includes('scheduled tribes')) categories.push('ST');
  if (fullTextForMatching.includes('brahmin')) categories.push('Brahmin');
  if (fullTextForMatching.includes('general') || fullTextForMatching.includes('open category')) categories.push('General');

  if (!isExclusiveCategory) {
    if (!categories.includes('General')) categories.push('General');
    if (!categories.includes('OBC')) categories.push('OBC');
  }

  if (categories.length === 0) {
    categories.push('General', 'OBC', 'SC', 'ST');
  }

  // Extract Occupations
  const occupations: string[] = [];
  if (fullTextForMatching.includes('farmer') || fullTextForMatching.includes('cultivator') || fullTextForMatching.includes('agriculture')) occupations.push('Farmer');
  if (fullTextForMatching.includes('fisherman') || fullTextForMatching.includes('fishermen') || fullTextForMatching.includes('fisherwoman') || fullTextForMatching.includes('fishery')) occupations.push('Fisherman');
  if (fullTextForMatching.includes('construction') || fullTextForMatching.includes('building worker') || fullTextForMatching.includes('unregistered laborer') || fullTextForMatching.includes('shramik')) occupations.push('Construction Worker');
  if (fullTextForMatching.includes('safai') || fullTextForMatching.includes('sanitation') || fullTextForMatching.includes('sweeper')) occupations.push('Sanitation Worker');
  if (fullTextForMatching.includes('student') || fullTextForMatching.includes('scholarship') || fullTextForMatching.includes('matric') || fullTextForMatching.includes('school')) occupations.push('Student');
  if (fullTextForMatching.includes('entrepreneur') || fullTextForMatching.includes('msme') || fullTextForMatching.includes('business') || fullTextForMatching.includes('powerloom') || fullTextForMatching.includes('self-employed')) occupations.push('Entrepreneur');
  if (fullTextForMatching.includes('teacher') || fullTextForMatching.includes('faculty') || fullTextForMatching.includes('lecturer') || fullTextForMatching.includes('professor') || fullTextForMatching.includes('educator') || fullTextForMatching.includes('teaching') || fullTextForMatching.includes('aicte') || fullTextForMatching.includes('induction/refresher')) occupations.push('Teacher');
  if (occupations.length === 0) {
    // Default to a broad set if not specified
    occupations.push('Other');
  }

  // Extract Disability
  const disabilityOnly =
    lowercaseName.includes('disability') ||
    lowercaseName.includes('disabled') ||
    lowercaseName.includes('handicapped') ||
    lowercaseName.includes('differently abled') ||
    lowercaseElig.includes('exclusively for disabled') ||
    lowercaseElig.includes('only those persons with disabilities') ||
    lowercaseElig.includes('disability pension');

  // Build search block text
  const searchText = `
Scheme Name: ${schemeName}
Category: ${category.join(', ')}
Tags: ${tags.join(', ')}
Level: ${level}
Details: ${details}
Benefits: ${benefits}
Eligibility Criteria: ${eligibility}
Application Process: ${application}
Documents Required: ${documents}
  `.trim();

  return {
    schemeId,
    schemeName,
    slug,
    level,
    category,
    tags,
    states,
    gender,
    incomeLimit,
    minAge,
    maxAge,
    categories,
    occupations,
    disabilityOnly,
    details,
    benefits,
    eligibility,
    application,
    documents,
    searchText,
  };
}
