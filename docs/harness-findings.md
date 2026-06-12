# TeachZenith — Data Source Findings (Harness Results)

_Recorded after running the full 22-market harness across all 8 regions._

## The core answer
The API layer (Adzuna + JSearch) returns real teaching jobs across every priority
region. The API layer CAN carry the MVP. JSearch (global, via Google for Jobs)
is the workhorse; Adzuna adds fresh, well-dated coverage for its fixed country list.

## Real teaching roles found, by region (both APIs)
- Europe ...... 32 (Spain, Germany strongest — Runnymede, ISP, ISR, Swiss Intl)
- Gulf ........ 14 (Qatar/Saudi/Kuwait — Edvectus, GEMS, ASQ, ISP)
- Africa ...... 10 (Kenya, South Africa — Nova Pioneer, Crawford, Greensteds)
- N. America .. 10 (high noise; many dupes/spam)
- SE Asia ..... 7  (Malaysia strongest — ISP, Australian Intl School)
- Aus/NZ ...... 2

## Coverage by source
- Adzuna: fixed country list (UK, US, CA, AU, DE, ES, NL, etc.). Always well-dated.
  EMPTY for Gulf and most of Asia (no endpoint).
- JSearch: global. Carries Gulf + Asia. Field schema confirmed: jobs under
  data.jobs; date under job_posted_at_datetime_utc (often NULL for recruiter
  cycle-based roles).

## Four lessons that shape ingestion (Step 2) and matching (Step 3)
1. KEYWORD FILTERING IS INSUFFICIENT. The harness's keyword heuristic both
   over-rejected (USA real teaching jobs marked 0%) and over-accepted (a nanny).
   => The real product MUST use AI to judge "is this a genuine teaching role."
2. DEDUPLICATION REQUIRED. Same job appeared up to 4x (USA "Relocate to China");
   recruiter spam ("English 1") blasted into every country.
3. DUAL-MODE FRESHNESS REQUIRED.
   - Date-based (UK/US/AU/Adzuna): the 14-day rule works.
   - Verification-based (Gulf/Egypt/recruiter roles): NO posting date; rely on
     first_seen_at + link re-verification, longer decay window. A "August 2026
     start" role is legitimately live for months.
4. THIN MARKETS. China, Korea, Japan, Thailand, Vietnam, NZ returned ~0 via
   Google for Jobs. Need targeted sources later, or accept thinner coverage.

## Noise patterns to filter
- Recurring recruiter spam (same ad across all countries).
- Duplicates (same listing repeated).
- Miscategorized roles (nanny, custodian, principal) caught by broad queries.

## Strategic note
Volume != priority. Europe returned the most roles but much of continental
Europe is language-gated for Nigerian teachers. The Gulf returned fewer but
higher-conversion (visa-sponsored, passport-blind). Tiering still governs which
markets we LEAD with; the data just confirms we CAN serve all of them.

## Parked for later
- Apify (scraping platform) — revisit for targeted Layer-2 sources (e.g.
  Edvectus, specific school pages) IF the API gap proves material. Paid + fragile;
  only add where it fills a proven gap.
