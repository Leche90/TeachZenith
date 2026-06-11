#!/usr/bin/env bash
# Manual test of the 7-question intake endpoint. Start the backend first
# (npm --workspace backend run dev), then in another terminal run:
#   bash backend/scripts/test-intake.sh
set -euo pipefail
BASE="${BASE:-http://localhost:4000}"

echo "=== 1. Create a teacher (full 7-question profile) ==="
echo "    Physics+Maths, B.Ed, TRCN yes, Nigerian license, 10-14 yrs,"
echo "    willing outside spec, IGCSE+IB, IELTS+native, Gulf/E.Asia/UK"
echo ""
RESP=$(curl -s -X POST "$BASE/api/intake" -H "Content-Type: application/json" -d '{
  "subjectIds":[2,1],
  "qualification":"bed_subject",
  "trcnCertified":true,
  "hasTeachingLicense":true,
  "licenseCountry":"Nigeria",
  "yearsExperienceMin":10,
  "yearsExperienceMax":14,
  "willingOutsideSpecialization":true,
  "curriculums":["british_igcse","ib"],
  "englishStatuses":["ielts","native"],
  "destinations":["gulf","east_asia","europe_uk"],
  "fullName":"Ada Obi"
}')
echo "$RESP"
echo ""

ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$ID" ]; then
  echo "!! No teacher id returned — check the response above for errors."
  exit 1
fi

echo "=== 2. Fetch teacher $ID back (should show all child rows) ==="
curl -s "$BASE/api/teachers/$ID"
echo ""
echo ""

echo "=== 3. Validation check (deliberately bad input -> expect 400 with field errors) ==="
curl -s -X POST "$BASE/api/intake" -H "Content-Type: application/json" -d '{
  "subjectIds":[],
  "qualification":"not_a_real_value",
  "yearsExperienceMin":5,
  "yearsExperienceMax":2,
  "curriculums":[],
  "englishStatuses":[],
  "destinations":[]
}'
echo ""
echo ""
echo "Done. Test 1 should show a created teacher, test 2 the same teacher with"
echo "subjects/curriculums/englishStatuses/destinations, test 3 a clean 400."
