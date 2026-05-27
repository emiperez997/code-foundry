# Real-World Database Design

## Slug
real-world-database-design

## Summary
A developer needs to design the database for a project management app from scratch. There are users, projects, tasks, and comments — and every structural decision made now will be harder to undo once real data exists. This course simulates the process of modeling a relational database before writing a single query, making trade-offs explicit and showing what breaks when the design is wrong.

## Learning Goals
- How to identify entities and their attributes from informal requirements
- How to model relationships between tables correctly and know which type applies when
- How to choose data types and constraints that prevent invalid data at the source
- How to write queries that combine data from multiple tables
- How to evolve a database schema safely when data already exists

## Target Level
Junior / Mixed

## Published
true

## Prerequisites
- Has written basic SQL queries (SELECT, INSERT, WHERE)
- Knows what a table and a column are

## Real-World Context
A product team describes a project management app in plain language. There are no diagrams, no technical spec — just user stories and a list of features. A developer must translate that into a database schema that works now and won't become a liability in six months.

## Modules
1. Think Before Creating Tables
   - The team described the app verbally; nothing has been modeled yet
   - Student identifies the entities, their attributes, and how they relate before touching any tooling

2. Tables, Columns, and Data Types
   - A price column was created as VARCHAR; sorting by price now returns nonsensical results
   - Student reasons about type correctness, nullability, and the real-world cost of wrong type choices

3. Relationships Between Tables
   - Multiple users need to collaborate on the same project; the current schema only supports one owner per project
   - Student models one-to-many and many-to-many relationships and understands when a join table is needed

4. Primary Keys and Basic Indexes
   - Searching users by email becomes slow as the table grows
   - Student reasons about primary keys, the trade-offs between auto-increment IDs and UUIDs, and when to add an index

5. Data Integrity and Constraints
   - A backend bug allowed orders to be created without an associated user; 2,000 orphaned records now exist
   - Student adds foreign keys and constraints that make invalid data structurally impossible

6. Real Queries: Beyond Basic SELECT
   - The frontend needs a task list that includes the project name and assigned user name in a single response
   - Student writes JOIN-based queries and reasons about when multiple queries make sense vs. a single combined one

7. Evolving the Schema Without Breaking Things
   - A NOT NULL column needs to be added to a table that already has records
   - Student reasons about what schema changes are safe, what requires a migration strategy, and how to track changes across the team

## Outcomes
After finishing this course, the student should be able to:
- Model a relational database from informal requirements, not just from a spec
- Choose correct data types and apply constraints that protect data integrity
- Define and use relationships between tables (one-to-many, many-to-many)
- Write queries with JOINs to retrieve related data efficiently
- Plan and execute schema changes safely when real data is already present
