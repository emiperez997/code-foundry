# Real-World Frontend Architecture

## Slug
real-world-frontend-architecture

## Summary
A developer built their first React app and it works — but the code is hard to read, logic is tangled with UI, and every new feature risks breaking something else. This course simulates the process of improving that codebase with intention: splitting components, placing state correctly, separating API calls from the UI, and organizing files so the next developer doesn't get lost.

## Learning Goals
- How to recognize when a component is doing too much and how to split it with purpose
- How to decide where state lives based on who needs it and why
- How to separate data-fetching from presentation so each can change independently
- How to organize a project so that adding something new has an obvious place to go
- How to handle form state and server-side validation errors in the UI

## Target Level
Junior / Mixed

## Prerequisites
- Can create React components and use useState
- Has built at least one small React app

## Real-World Context
A developer joins a startup where the frontend was built fast to ship an MVP. Everything works, but all the logic, API calls, and UI live together in a handful of large components. The team is about to grow, and the codebase needs to be navigable by someone new. The student is asked to improve it — without rewriting everything from scratch.

## Modules
1. What Does "Architecture" Mean in the Frontend?
   - A single 400-line component handles data fetching, business logic, and rendering
   - Student identifies what is mixed together and names the specific problems that creates

2. Components with a Single Responsibility
   - The designer delivers a new screen that reuses elements from an existing component
   - Student decides what to extract, what to reuse, and when splitting a component adds complexity instead of reducing it

3. Props, Data, and the Flow of Information
   - The user's name needs to be passed through four nested components that don't use it, just to reach the header
   - Student reasons about data ownership and when passing props becomes a structural problem

4. State: Local, Shared, and Server
   - A new filter feature accidentally breaks the notification counter in a different part of the app
   - Student classifies the different kinds of state and decides where each one should live

5. API Calls Outside of Components
   - The backend changes an endpoint URL and the developer has to update eight different components
   - Student builds a service layer and reasons about what components should and shouldn't know about

6. Folder Structure That Scales
   - A new developer joins and can't figure out where to add a new feature without asking
   - Student designs a folder structure based on the principle that the right place for anything new should be obvious

7. Forms and Client-Side Validation
   - The registration form allows submission with empty fields; the server returns a generic error with no field context
   - Student handles form state, validates before submitting, and maps server errors back to the correct fields

## Outcomes
After finishing this course, the student should be able to:
- Break large components into focused, reusable pieces with clear responsibilities
- Decide where state belongs based on scope and who consumes it
- Isolate API calls in a service layer that components don't depend on directly
- Organize a React project so that new contributors can navigate it without a guide
- Build forms that validate input and surface server-side errors in a useful way
