---
name: task
description: "Run a task: implement → prompt verification step"
model: claude-course-fast
---

# Skill: /task

Run a task: implement → prompt verification step

## Usage

When user writes `/task <description>`, follow this flow:

1. **Understand** — read the description and ask clarifying questions if needed
2. **Implement** — make the changes
3. **Verify** — after implementation, suggest a verification step:
   - Run `npx tsc --noEmit`
   - Show the diff
   - Ask if they want to test locally or commit

Do NOT commit automatically — wait for the user to type "commit".
