# Real-World REST API Design

## Slug
real-world-api-design

## Summary
A developer is tasked with building the backend API for a team task management app. The frontend team is waiting, the requirements are informal, and every decision about how to structure endpoints, handle errors, and respond to clients will be felt immediately. This course simulates designing a REST API from the ground up — not as an exercise, but as a real deliverable with a real consumer.

## Learning Goals
- How to identify resources and translate them into consistent endpoint structures
- How to reason about HTTP verbs, status codes, and response shapes
- How to design error responses that are useful without being dangerous
- How to validate incoming data on the server and communicate failures clearly
- How to document an API so others can use it without asking questions

## Target Level
Junior / Mixed

## Published
true

## Prerequisites
- Knows what an HTTP request and response look like
- Has consumed an API from the client side at least once

## Real-World Context
A small product team is building a task management tool. The frontend dev and the backend dev are working in parallel. The backend dev must design the API contract before the frontend can proceed — if the contract is vague or inconsistent, both sides waste time. The student plays the backend role.

## Modules
1. What Is a REST API and Why Does Consistency Matter?
   - The existing codebase has endpoints named `/getUser`, `/doLogin`, and `/fetchAllTasks`
   - Student identifies what makes an API hard to use and proposes a consistent naming approach

2. Designing Resources and Endpoints
   - The team needs to manage tasks, projects, and users
   - Student maps each resource to its endpoints using HTTP verbs correctly, and defends those choices

3. Consistent Response Shapes
   - The frontend sometimes receives `{ task: {...} }` and sometimes just the object directly
   - Student designs a response structure that is predictable across all endpoints

4. Error Handling
   - The server returns 500 when a required field is missing in the request
   - Student reasons about the right status codes, what information to include, and what to withhold

5. Server-Side Validation
   - Someone is calling the API directly (not through the frontend) with malformed data
   - Student designs a validation layer that catches bad input and communicates exactly what's wrong

6. Authentication in the API
   - The `GET /tasks` endpoint returns all tasks to anyone, logged in or not
   - Student adds token-based authentication and reasons about what each endpoint requires

7. Basic Documentation
   - A new developer joins the team and spends three days figuring out how the API works
   - Student documents endpoints in a format that answers the most common questions without a meeting

## Outcomes
After finishing this course, the student should be able to:
- Design a REST API with consistent, predictable endpoint naming and structure
- Choose appropriate HTTP status codes for success and failure scenarios
- Validate incoming requests on the server and return structured error responses
- Protect endpoints with token-based authentication
- Produce basic API documentation that another developer can act on immediately
