// Curated registry of known employers → their verified, first-party careers
// pages. When a matched job's employer is recognised here, we prefer this URL
// over the aggregator's apply link (which often points to a generic job-board
// page, not the actual role). Grow this list employer-by-employer as we verify
// real careers URLs by hand.
//
// Matching is LOOSE: we lowercase both sides and check if the job's employer
// name contains the registry key, so "Aldar Education PJSC" still matches
// "aldar". Keys must be distinctive enough that a substring match is safe.

export interface EmployerEntry {
  // distinctive lowercase fragment to look for in the job's employer name
  key: string;
  // display name for the button, e.g. "Aldar Education"
  displayName: string;
  // verified first-party careers URL
  careersUrl: string;
}

export const EMPLOYER_REGISTRY: EmployerEntry[] = [
  {
    key: "aldar",
    displayName: "Aldar Education",
    careersUrl: "https://www.aldar.com/education/careers",
  },
  // Add more verified employers here over time, e.g.:
  // { key: "gems", displayName: "GEMS Education", careersUrl: "https://www.gemseducation.com/careers" },
  // { key: "nord anglia", displayName: "Nord Anglia Education", careersUrl: "https://www.nordangliaeducation.com/careers" },
];

export interface CareersMatch {
  displayName: string;
  careersUrl: string;
}

// Returns the registry entry for a given employer/school name, or null if we
// don't have a verified careers URL for them.
export function findCareersUrl(schoolName: string | null | undefined): CareersMatch | null {
  if (!schoolName) return null;
  const needle = schoolName.toLowerCase();
  for (const e of EMPLOYER_REGISTRY) {
    if (needle.includes(e.key)) {
      return { displayName: e.displayName, careersUrl: e.careersUrl };
    }
  }
  return null;
}
