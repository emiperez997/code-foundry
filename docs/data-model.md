# CodeFoundry – Data Model

## Purpose

This document defines the minimal data model required to support the
CodeFoundry educational platform based on the existing course definitions.

The model prioritizes clarity and scalability over completeness.

---

## Access Model

All registered users have free access to all courses. No enrollment or payment
is required to start a course in the MVP.

This decision is intentional. It eliminates onboarding friction and allows the
platform to collect real usage data before introducing monetization.

**Post-MVP:** A subscription or access model will be introduced. When that
happens, an `Enrollment` or `Subscription` entity will be added without
breaking the existing progress tracking model.

---

## Core Entities

### User

Represents a person using the platform.

### Course

Represents an educational experience that simulates a real-world problem.

### Module

Represents a step or stage within a course.

### Progress

Represents a user's advancement through a course, tracked at the module level.

---

## Entity Details

### User

| Field          | Type      | Notes                              |
|----------------|-----------|------------------------------------|
| id             | uuid      | Primary key                        |
| email          | string    | Unique, required                   |
| name           | string    | Display name                       |
| passwordHash   | string    | Hashed with bcrypt or equivalent   |
| createdAt      | timestamp | Set on insert                      |

### Course

| Field       | Type    | Notes                                        |
|-------------|---------|----------------------------------------------|
| id          | uuid    | Primary key                                  |
| slug        | string  | Unique, URL-safe identifier (e.g. `real-world-auth`) |
| title       | string  | Display title                                |
| summary     | text    | One-paragraph description                    |
| level       | string  | e.g. `junior`, `mixed`                       |
| isPublished | boolean | Controls visibility on the platform          |

### Module

| Field       | Type    | Notes                                  |
|-------------|---------|----------------------------------------|
| id          | uuid    | Primary key                            |
| courseId    | uuid    | Foreign key → Course                   |
| title       | string  | Display title                          |
| order       | integer | Position within the course (1-based)   |
| description | text    | Problem context and what the student reasons about |

### Progress

| Field       | Type      | Notes                              |
|-------------|-----------|------------------------------------|
| id          | uuid      | Primary key                        |
| userId      | uuid      | Foreign key → User                 |
| moduleId    | uuid      | Foreign key → Module               |
| completedAt | timestamp | When the student marked it done    |

---

## Relationships

- A `Course` has many `Modules`
- A `Module` belongs to one `Course`
- A `User` has many `Progress` records
- A `Progress` record belongs to one `User` and one `Module`
- The combination of `(userId, moduleId)` in `Progress` must be unique

---

## Non-Goals (for MVP)

The following concepts are intentionally excluded:

| Concept                   | Reason                                                  |
|---------------------------|---------------------------------------------------------|
| Payments                  | All content is free for registered users in the MVP     |
| Enrollment / subscription | Access is open; this will be added post-MVP             |
| Roles and permissions     | No admin workflows required yet                         |
| Certificates              | Out of scope for this phase                             |
| Comments or reviews       | Out of scope for this phase                             |
| Content authoring         | Courses are defined in markdown files, not the database |
| Course prerequisites      | Defined as text in course files, not enforced by the DB |
