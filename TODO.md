# Things to TODO for my TODO app (I should probably use the app to do these things)

## Prompts backlog (easiest → hardest)

0. Adding file storage using rust and homegrown storage system for files!
  a. This would probably require a local-sync engine which saves the front-end state to history (along with a hidden attribute in case of redos and undos, also this would also
  make it so tath)
1. Add time estimates and tracking to tasks (Est / Done / Overtime)
2. Add satisfying checklist subtasks with smooth animations
3. Notes per task with auto-open external links on start
4. Pomodoro timer (configurable work/break) per task
5. Scheduled tasks (one-time/recurring) with due-now queue and alerts
6. Per-user personalization settings (themes, compact mode, animations)
7. Cross-list scheduling and calendar view

## Bugs to fix

- [ ] Currently, the undo and redo-history is not working properly
  - This includes not being able to undo/redo without the dots changing for lists
  - The toggle state not being included in the history
  - It opening the task-card.editor when undoing/redoing
