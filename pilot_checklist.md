# Pilot Checklist — Baseline Cognitive & Spatial Battery

Complete this checklist before collecting real participant data.
Run the full battery at least once in pilot mode (PILOT_MODE = true) and once in production mode (PILOT_MODE = false).

---

## 1. Setup

- [ ] Repository cloned/downloaded to local machine
- [ ] index.html opens in Chrome without errors
- [ ] All scripts load (check browser console for 404 errors)
- [ ] PILOT_MODE is set correctly in js/utils.js
  - [ ] `true` for development runs
  - [ ] `false` before real data collection

---

## 2. Welcome & Participant ID

- [ ] Welcome screen displays correctly
- [ ] Baseline description is shown ("not a stimulation outcome measure")
- [ ] Participant ID field accepts input
- [ ] Participant ID is NOT a real name, email, or identifying number
- [ ] Participant ID is saved and appears on the task menu screen
- [ ] "Do not enter identifying information" warning is visible

---

## 3. Device / Browser Check

- [ ] Device check screen lists requirements
- [ ] Window dimensions display correctly
- [ ] Warning appears if browser window is too small (< 900 × 600 px)
- [ ] Fullscreen request works in Chrome
- [ ] Battery runs correctly after exiting and re-entering fullscreen

---

## 4. Task Menu

- [ ] Task menu displays participant ID
- [ ] "Run Full Battery" button works
- [ ] "Visual Sequencing only" button works
- [ ] "Object-Location Memory only" button works
- [ ] "Spatial Pointing only" button works
- [ ] Each single-task option runs to completion without errors

---

## 5. Task 1 — Visual Sequencing and Set-Shifting

### Sequencing Practice
- [ ] Practice instruction screen appears
- [ ] 8 targets (1–8) displayed in random non-overlapping positions
- [ ] Clicking correct target marks it as complete (green)
- [ ] Clicking wrong target shows error feedback (red flash + message)
- [ ] Trial completes after clicking 8 in order

### Sequencing Main
- [ ] 25 targets displayed in random non-overlapping positions
- [ ] Main trial runs without feedback
- [ ] Completion time is recorded (check console or summary)
- [ ] Error count is recorded

### Set-Shifting Practice
- [ ] Targets 1, A, 2, B, 3, C, 4, D displayed
- [ ] Correct alternating click order works
- [ ] Error feedback shown on wrong clicks

### Set-Shifting Main
- [ ] 26 targets (13 numbers + 13 letters) displayed
- [ ] Alternating sequence works correctly
- [ ] Completion time and errors recorded

### Summary check
- [ ] set_shifting_cost_ms = set-shifting time minus sequencing time (should be positive)
- [ ] set_shifting_ratio = set-shifting time / sequencing time (should be > 1 for most people)
- [ ] Both condition times are plausible (sequencing: 30–120 s; set-shifting: 60–180 s for healthy adults)

---

## 6. Task 2 — Object-Location Memory

### Practice block
- [ ] 3 objects shown at distinct non-overlapping positions
- [ ] Encoding timer counts down correctly
- [ ] Delay fixation cross appears
- [ ] Retrieval: object cue is shown
- [ ] Click on arena is registered
- [ ] Feedback shows correct (green) and response (blue) dots
- [ ] Euclidean error is computed and plausible

### Main blocks (repeat for blocks 1, 2, 3)
- [ ] 8 objects shown at distinct positions
- [ ] Encoding phase lasts correct duration (25 s in production)
- [ ] Delay phase lasts correct duration (15 s in production)
- [ ] All 8 objects tested in retrieval (randomized order)
- [ ] No feedback shown during main blocks
- [ ] Euclidean errors are plausible (< arena diagonal = ~1000–1400 px at most)

### Summary check
- [ ] olm_mean_euclidean_error_px is not 0 and not enormous
- [ ] olm_missing_responses = 0 (all responses captured)
- [ ] Block-wise errors are computed

---

## 7. Task 3 — Spatial Pointing

### Study phase
- [ ] 6 landmarks shown in arena circle at evenly spaced positions
- [ ] Study countdown works
- [ ] Landmark labels visible

### Practice trials (2)
- [ ] Start position marker (S) shown correctly
- [ ] Target landmark named but NOT shown
- [ ] Click registers on arena
- [ ] Arrow direction preview shows on mouseover
- [ ] Confirm button becomes active after click
- [ ] Feedback shows correct direction in green

### Main trials (18)
- [ ] 18 trials complete without error
- [ ] Each of 6 landmarks tested 3 times
- [ ] Different start positions used
- [ ] No feedback shown
- [ ] Angular errors are plausible (mean < 90° expected for healthy adults)

### Summary check
- [ ] sp_mean_absolute_angular_error_deg is between 0 and 180
- [ ] sp_signed_bias_deg is near 0 (no systematic bias expected)

---

## 8. Data Export

- [ ] Completion screen appears after full battery
- [ ] Summary table values are plausible (not all NULL / N/A)
- [ ] "Download Trials CSV" downloads a file
- [ ] CSV file opens in Excel/LibreOffice without errors
- [ ] CSV has stable header row with all expected columns
- [ ] CSV participant_id column matches the entered ID
- [ ] "Download Full JSON" downloads a file
- [ ] JSON is valid (check with jsonlint.com or browser console)
- [ ] "Download Summary JSON" downloads a file
- [ ] All three download files are named with participant ID and date

---

## 9. Data Privacy Verification

- [ ] No names, emails, or identifying information appear in CSV/JSON
- [ ] No data is sent to any external server (check Network tab in DevTools)
- [ ] Netlify deployment does NOT store participant data
- [ ] Real data is NOT committed to the GitHub repository

---

## 10. Netlify Deployment

- [ ] Push to main branch triggers Netlify build
- [ ] Netlify deploy succeeds (no build errors)
- [ ] Site loads at Netlify URL
- [ ] All scripts load from CDN on deployed site
- [ ] All tasks run correctly on deployed site
- [ ] Data export works on deployed site

---

## 11. Timing & Duration

- [ ] Sequencing main trial: < 3 minutes expected
- [ ] Set-shifting main trial: < 4 minutes expected
- [ ] OLM full (3 blocks + practice): < 12 minutes expected
- [ ] Spatial pointing full: < 5 minutes expected
- [ ] Full battery: < 25 minutes

---

## 12. Console Errors

- [ ] No JavaScript errors in browser console (F12) during any task
- [ ] No 404 errors for script/CSS files
- [ ] No CSP (Content Security Policy) violations

---

## Sign-off

Tested by: ______________________

Date: ______________________

PILOT_MODE setting during test: ______________________

Notes: ______________________
