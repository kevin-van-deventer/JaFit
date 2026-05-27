# Progressive Workout Coach Feature Tracker

This document tracks the current implementation against the original product guide. Use it as the working checklist for finishing, testing, and hardening the app.

## Completed And Visible

- [x] Multi-user signup and login backed by Cloudflare D1.
- [x] Per-user cloud sync through `user_data.data_json`.
- [x] Save-before-logout so data is pushed to D1 before session clear.
- [x] Active workout restore after refresh, tab close, browser close, or device restart.
- [x] Active workout synced to Cloudflare D1.
- [x] PWA manifest and service worker.
- [x] Install Web App button in Settings where supported.
- [x] Mobile-first dark premium UI.
- [x] Sticky bottom navigation.
- [x] Desktop left rail navigation.
- [x] Login/signup screen.
- [x] Onboarding wizard for goal, experience, training days, session length, and units.
- [x] Starter program generation from onboarding choices.
- [x] Today dashboard.
- [x] Today workout card.
- [x] Start Workout button.
- [x] Weekly training calendar preview.
- [x] Current streak.
- [x] Weekly sets.
- [x] Weekly volume summary.
- [x] Latest PRs card.
- [x] Quick actions for body weight, exercises, and empty workout.
- [x] Programs tab.
- [x] Generate routine action.
- [x] Custom program creation.
- [x] Add workout days through duplication/custom program flow.
- [x] Searchable program exercise picker.
- [x] Edit day name.
- [x] Edit sets, reps, and RIR targets.
- [x] Reorder exercises within a program day.
- [x] Duplicate days.
- [x] Delete days.
- [x] Active workout screen.
- [x] Sticky live workout timer.
- [x] Finish Workout flow.
- [x] Cancel Workout flow that does not save to history.
- [x] Exercise cards during workout.
- [x] Last performance display.
- [x] Target sets, rep range, RIR, and rest time display.
- [x] Expandable technique notes.
- [x] Add Set and Remove Set actions.
- [x] Set rows with warm-up, working, and drop-set type selector.
- [x] Weight, reps, RIR, and completed fields per set.
- [x] Rest timer after completed set.
- [x] Rest timer `+30s`, `-30s`, and Skip controls.
- [x] Browser beep/vibration fallback when rest finishes.
- [x] Smart exercise swap by primary muscle.
- [x] Swap prioritizes available equipment internally.
- [x] Smart exercise swap in active workouts.
- [x] Smart exercise swap in program builder.
- [x] Plate calculator modal.
- [x] Progression engine with rule-based targets.
- [x] Reps-first and weight-first progression mode setting.
- [x] Finish workout summary.
- [x] Total duration, sets, working sets, and volume summary.
- [x] Volume by muscle group data.
- [x] PR detection for heaviest weight, estimated 1RM, reps at weight, and session volume.
- [x] Epley estimated 1RM formula.
- [x] Workout history list.
- [x] Past workout editing for set weight, reps, RIR, and deleting sets.
- [x] Add forgotten exercise inside past workout editing.
- [x] Add set inside past workout editing.
- [x] Recalculate summary after history edit.
- [x] Exercise library.
- [x] Exercise search.
- [x] Muscle filter.
- [x] Equipment filter.
- [x] Add custom exercise modal.
- [x] Edit custom exercise entry point.
- [x] Exercise detail modal.
- [x] Exercise technique notes and alternatives.
- [x] Exercise history in exercise detail modal.
- [x] Seeded 60 strength exercises across the requested muscle groups.
- [x] Progress charts for weekly volume, estimated 1RM, frequency, and body weight.
- [x] Body weight logging.
- [x] Body weight calendar view.
- [x] Edit/delete body weight entries.
- [x] Units setting.
- [x] Accent color setting.
- [x] Wake Lock setting.
- [x] Sound alerts setting.
- [x] Export JSON backup.
- [x] Import JSON backup.
- [x] Reset app data.
- [x] Cloudflare Worker static hosting.
- [x] Cloudflare D1 database.
- [x] GitHub Actions workflow for deploy on push to `main`.

## In Code But Not Very Discoverable

- [ ] Add a visible calculator icon beside each workout weight input.
  - Current state: plate calculator opens on weight input focus.
  - Test: tapping calculator icon opens calculator without stealing normal field focus.

- [ ] Make exercise card tap affordance clearer.
  - Current state: tapping an exercise library card opens exercise details.
  - Test: users can discover exercise history and technique notes without guessing.

- [ ] Surface sync state more clearly without visual clutter.
  - Current state: sync icon appears only while syncing or on failure.
  - Test: user can understand whether data is saved after critical actions.

- [ ] Explain reps-first vs weight-first progression in Settings.
  - Current state: setting exists, but no plain-language explanation.
  - Test: user understands when each mode changes next targets.

- [ ] Make PWA install instructions visible for iOS.
  - Current state: install button only works where `beforeinstallprompt` is supported.
  - Test: iPhone users see Safari Share > Add to Home Screen guidance.

- [ ] Make Wake Lock active status visible during workouts.
  - Current state: setting exists and API is requested.
  - Test: user can see whether screen wake lock is active or unsupported.

## Partially Implemented

- [ ] Equipment profile editor.
  - Current state: `equipmentProfiles` exists and swap sorting uses it.
  - Missing: UI to choose available equipment.
  - Test: selected equipment affects exercise swap priority.

- [ ] Weekly routine editor.
  - Current state: `weeklyRoutine` is generated during onboarding.
  - Missing: UI to assign workout days to weekdays.
  - Test: Today tab reflects edited weekday schedule.

- [ ] Default rest time editor.
  - Current state: default rest times exist in settings data.
  - Missing: UI controls for compound/isolation/bodyweight rest defaults.
  - Test: new exercises/program entries use edited defaults.

- [ ] Progress photos.
  - Current state: `progressPhotos` exists as a data placeholder.
  - Missing: upload/capture UI, gallery, delete, and backup behavior.
  - Test: photos persist and sync strategy is defined.

- [ ] Exercise-specific progression targets.
  - Current state: progression notes are calculated after workouts.
  - Missing: next targets are not written back into future program entries.
  - Test: next workout uses the calculated target load/reps.

- [ ] Simultaneous multi-device conflict handling.
  - Current state: last full JSON save wins.
  - Missing: updated-at checks and merge behavior.
  - Test: two devices editing different records do not overwrite each other.

- [ ] Browser notifications.
  - Current state: beep/vibration exists.
  - Missing: Notification API permission and rest-complete notification.
  - Test: locked/backgrounded phone receives rest timer completion signal where supported.

## Missing From Original Guide

- [ ] Full equipment setup screen during onboarding or Settings.
- [ ] Full weekly calendar editor.
- [ ] Detailed exercise history charts per exercise.
- [x] Add forgotten exercise inside history editing.
- [ ] Delete incorrect set inside active workout history with clearer labels.
- [ ] Progress photos UI.
- [ ] Progress photo placeholders and upload flow.
- [ ] Last-synced timestamp in UI.
- [ ] Offline retry queue for failed cloud sync saves.
- [ ] Explicit autosave indicator for active workouts.
- [ ] Better conflict-safe syncing for multi-device usage.
- [ ] Dedicated notifications permission flow.
- [ ] Better import validation and error handling.
- [ ] More complete custom exercise editor for cues, mistakes, secondary muscles, alternatives, and rest.
- [ ] Better generated routine controls before saving.
- [ ] Create workout day from scratch with exercise picker.
- [ ] More complete desktop layout for program builder.
- [ ] More complete body metric types beyond body weight.
- [ ] Account profile page for name/email.
- [ ] Password reset flow.
- [ ] Session management/logout from other devices.

## Testing Checklist

- [ ] New user can sign up and receives isolated blank onboarding state.
- [ ] Existing user can log in and receives their previous D1 data.
- [ ] User A data never appears for User B on the same browser after logout/login.
- [ ] Active workout survives refresh.
- [ ] Active workout survives tab close.
- [ ] Active workout survives browser close.
- [ ] Active workout survives phone restart.
- [ ] Active workout restores after logging in on another device.
- [ ] Cancel Workout does not create workout history.
- [ ] Finish Workout creates workout history.
- [ ] Logout saves data before clearing session.
- [ ] Logout is blocked if save fails.
- [ ] Body weight logs show on chart and calendar.
- [ ] Body weight edit updates chart/calendar.
- [ ] Body weight delete updates chart/calendar.
- [ ] Exercise swap preserves set targets.
- [ ] Rest timer starts after completing a set.
- [ ] Rest timer controls work.
- [ ] PRs are detected after saving workout.
- [ ] Progression note matches success/maintenance/underperformance rules.
- [ ] JSON export downloads complete data.
- [ ] JSON import restores data.
- [ ] PWA installs on Android Chrome.
- [ ] PWA can be added to iOS Home Screen.
- [ ] GitHub push to `main` deploys successfully.
- [ ] D1 migrations run in GitHub Actions.

## Current Deployment

- Worker: `progressive-workout-coach`
- URL: `https://progressive-workout-coach.data-james.workers.dev`
- Database: `progressive-workout-coach-db`
- D1 binding: `DB`
- GitHub repo: `kevin-van-deventer/JaFit`
- Auto-deploy workflow: `.github/workflows/deploy-cloudflare.yml`
