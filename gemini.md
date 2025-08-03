Be sure to always update the todo.md tasks.ms gemini_code_log.md

This file provides guidance to Google's Gemini models when working with code in this repository. Following these guidelines will enable you to act as a more effective and autonomous coding partner.

This is a web-based 2D side-scrolling action game called "AI Broforce: Recharged". The project is built with React and TypeScript, using Vite for the development environment. The core gameplay loop, level structure, and basic player mechanics are already in place. Your primary role is to assist in implementing new features, fixing bugs, refactoring code, and writing tests.

Context is King: Your effectiveness is directly proportional to the quality of context you receive. Before acting, review relevant project files. Key files include:

todo.md: For understanding current priorities and tasks.
design_document.md: For high-level architecture and goals.
components/, hooks/, services/: For understanding existing code patterns.
types.ts: For understanding the data structures.
Iterative Development: Make small, incremental, and verifiable changes. A typical workflow should be:

Understand the feature request or bug report.
Create a plan (mental or written in a temporary file).
Write a test case that replicates the bug or validates the new feature (if applicable).
Implement the code to make the test pass.
Verify the changes in the game.
Clean up and refactor if necessary.
Pattern Adherence: The project has an established structure. Follow existing patterns to maintain consistency.

State Management: Game state is managed within React components and custom hooks (e.g., useGameLoop.ts).
Component Structure: UI is broken down into discrete components in src/components/.
Services: Decouple logic like audio, storage, or external API calls into src/services/.
Validation First: Use the provided validation gates to ensure your changes are correct and don't introduce regressions.

To run the game locally, use the following command. The server will automatically reload on file changes.

npm run dev



Run these commands to validate your changes before finalizing them.

# Level 1: Linting & Style (Fixes what it can automatically)
npm run lint

# Level 2: Type Checking (Ensures type safety)
npm run type-check

# Level 3: Unit & Integration Tests (Verify game logic and components)
npm run test



Write Unit Tests: For new logic, especially in hooks and services, add corresponding tests.
Update todo.md: When you start a task, mark it as in-progress. When complete, check it off.
Use TypeScript: Leverage type safety. Add or update types in types.ts as needed.
Follow Existing Patterns: Mimic the style and structure of the surrounding code.
Write Clear Commit Messages: Summarize the change and its purpose.
Refactor for Clarity: If you see an opportunity to improve code readability or performance without changing functionality, propose a refactoring.
Introduce New Libraries: Do not add new dependencies without explicit instruction.
Make Large, Monolithic Changes: Break down features into smaller, testable parts.
Ignore Existing Hooks/Services: Always check if existing code can be reused before writing new logic from scratch.
Leave Failing Tests: Ensure all validation gates pass before considering a task complete.
Hardcode Values: Use constants.ts for values that might change or are used in multiple places (e.g., player speed, gravity).
Use the following templates to structure your requests for well-defined and predictable results.

Use this template when requesting a new game mechanic or feature.

High-Level Objective: Implement a Grappling Hook for the player.

Mid-Level Objectives:

When the user presses the 'G' key, a hook is fired from the player's position in the direction of the mouse cursor.
If the hook collides with a platform tile, it should latch on.
Once latched, the player should be able to swing using the 'A' and 'D' keys.
Pressing the 'G' key again or the spacebar should release the hook.
Implementation Notes:

Update the Player type in types.ts to include grappling hook state (e.g., isGrappling, hookPosition).
The core logic should be integrated into the main useGameLoop.ts hook.
Create a new function handleGrapplingHook() within the game loop.
Use the existing collision detection logic to check for platform hits.
Render the grappling hook rope as a simple line from the player to the hookPosition.
Context Files:

hooks/useGameLoop.ts
types.ts
constants.ts
levels.ts (for platform tile information)
Use this template to provide the necessary information to fix a bug.

Bug Description: When the player dies and the game restarts, the score from the previous game is carried over instead of resetting to 0.

Steps to Reproduce:

Start a new game.
Collect some points by destroying crates.
Let the player get hit by an enemy until all lives are lost.
On the "Game Over" screen, click "Restart".
Observe that the score is not 0.
Expected Behavior: The score should reset to 0 when a new game starts.

Actual Behavior: The score from the previous session persists.

Relevant Files:

components/GameScreen.tsx (where the game state is managed)
services/storageService.ts (if scoring is persisted)
Use this template to request the creation of tests for a specific piece of logic.

High-Level Objective: Write unit tests for the audioService.

Function/File to Test: services/audioService.ts

Scenarios to Cover:

playSfx(sfxName):
Verify that Audio.play() is called when a valid sound effect name is provided.
Verify that the correct audio buffer is selected from the sfxBuffers map.
Verify that no error is thrown and play() is not called if an invalid name is provided.
toggleMusic():
Test that it correctly starts the music if it's paused.
Test that it correctly pauses the music if it's playing.
Test that the isMusicPlaying flag is toggled correctly.
loadAudio():
Mock the fetch and AudioContext.decodeAudioData APIs.
Verify that all audio assets listed in the service are fetched and decoded.
Verify that the sfxBuffers map is populated correctly after loading.