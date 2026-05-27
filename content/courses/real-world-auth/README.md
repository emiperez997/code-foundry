# Real-World Authentication System

## Slug
real-world-auth

## Summary
A junior developer joins a small startup and gets their first real task: add a login system to the app. What seems like a straightforward feature turns into a series of decisions — how to store passwords safely, how to keep users logged in, how to protect certain pages, and how to handle roles. This course simulates that journey from zero, making each decision explicit.

## Learning Goals
- How to reason about security trade-offs without over-engineering
- How to design a login flow that handles both happy and failure paths
- How to decide where validation lives (client vs. server)
- How to protect routes and resources based on identity and role
- How to communicate clearly when authentication fails, without leaking information

## Target Level
Junior / Mixed

## Published
true

## Prerequisites
- Basic understanding of how HTTP requests and responses work
- Has built at least a simple app with a backend, even if small

## Real-World Context
A small startup has a working app but no real login system — users are identified by an ID stored in localStorage. The CTO asks a junior dev to build authentication from scratch. The team is small, the timeline is tight, and every decision will have consequences they'll live with.

## Modules
1. What Is Authentication and Why Is It Hard?
   - The app currently trusts whatever the client sends
   - Student reasons about what "being logged in" means from the server's perspective

2. User Registration
   - Building the signup form and the endpoint behind it
   - Student decides what to validate, what to store, and what to tell the user when something fails

3. Passwords: How Not to Get It Wrong
   - Plaintext passwords were found in the database
   - Student reasons about why hashing exists and what makes a hashing strategy safe

4. Login and Identity Verification
   - Matching a submitted password against a stored hash
   - Student decides what error messages are safe to show and what information they reveal

5. Sessions: Keeping the User Logged In
   - The server can't remember state between requests
   - Student reasons about how tokens work, what they should contain, and how long they should last

6. Route Protection
   - A QA tester accessed the admin panel just by knowing the URL
   - Student decides what must be enforced on the server vs. the client, and why client-only protection isn't enough

7. Basic Roles: Admin vs. User
   - The team needs two types of users with different permissions
   - Student reasons about where to store roles, how to enforce them per endpoint, and what happens when a role changes mid-session

## Outcomes
After finishing this course, the student should be able to:
- Build a complete login and registration flow with secure password handling
- Issue and verify session tokens with appropriate expiration
- Protect routes on both the frontend and the backend
- Implement a simple role system that restricts access per endpoint
- Make informed decisions about what to expose (and what not to expose) in error messages
