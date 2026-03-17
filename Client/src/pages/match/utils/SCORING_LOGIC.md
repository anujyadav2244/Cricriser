# Cricket Scoring Logic Documentation

## Extras Handling (Frontend - COMPLETED)

The extras section now supports:
- **Extra Types**: WD (Wide), NB (No Ball), B (Bye), LB (Leg Bye)
- **Run Selection**: 0-4 runs can be selected with each extra type
- **Legal Ball Tracking**: 
  - WD and NB are illegal balls (not counted in over)
  - B and LB are legal balls (counted in over)

### Components Updated:
1. **LiveScoring.jsx** - Quick buttons for common extras with run selection
2. **BallInputPanel.jsx** - Comprehensive form with EXTRAS ball type and run selection

---

## Striker Rotation Logic (Backend Implementation Required)

### On Odd Runs (During Over)
When a batsman scores **1, 3, or 5 runs**, the striker and non-striker positions should be swapped.

**Example:**
```
Striker A at crease
Non-Striker B waiting
↓
A scores 1 run
↓
B becomes Striker (moves to batting end)
A becomes Non-Striker (moves to waiting end)
```

### At End of Over (6 Balls)
After the 6th ball is bowled:
- If **total runs in the over are ODD** → Swap striker and non-striker
- If **total runs in the over are EVEN** → No swap needed (batsmen already at correct ends)

**Example 1 - Odd runs in over:**
```
Over runs: 0 + 1 + 0 + 2 + 0 + 1 = 4 runs (EVEN)
No automatic swap at over end
```

**Example 2 - Odd runs in over:**
```
Over runs: 1 + 0 + 0 + 1 + 1 + 0 = 3 runs (ODD)
Must swap striker and non-striker at over end
```

### Implementation Guidelines for Backend

1. **After each ball is recorded:**
   - Calculate total runs from the ball (runsOffBat + extraRuns)
   - If runs are odd (1, 3, 5):
     - Swap strikerId and nonStrikerId
     - Update current match state
   
2. **After 6 balls (end of over):**
   - Calculate total runs in the completed over
   - If total runs are odd:
     - Swap strikerId and nonStrikerId
   - Increment over count
   - Reset ball count in over
   - Select new bowler (prompt from frontend if needed)

3. **Special Cases:**
   - Wickets: Don't affect striker rotation, only swap when new batter comes
   - Boundary balls (4/6) with extras: Apply normal rotation rules
   - Run-outs: The dismissed batter is replaced; rotation happens per runs

### API Endpoint: `/api/ball/record`

**Expected Payload:**
```javascript
{
  matchId: string,
  innings: number,
  runsOffBat: number,
  extraType: string | null,    // "WD", "NB", "B", "LB", or null
  extraRuns: number,
  legalBall: boolean,
  wicket: boolean,
  wicketType: string | null,
  // ... other fields
}
```

**Expected Response:**
- Updated match score with:
  - New strikerId and nonStrikerId (after rotation if applicable)
  - Updated over/ball count
  - Updated team scores
  - New bowler (if new over started)

---

## Frontend Display Updates

The frontend automatically displays current striker and non-striker from the `/api/match/scoreboard/{matchId}` endpoint:

```jsx
{live.striker?.name} & {live.nonStriker?.name}
```

Once the backend correctly implements striker rotation, this will automatically reflect in the UI.
