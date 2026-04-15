# Real-World CI/CD Pipeline

## Slug
real-world-cicd

## Summary
A three-person dev team deploys manually, has no shared process for reviewing code, and regularly breaks production by accident. This course simulates building a CI/CD pipeline from scratch for that team: not as a DevOps exercise, but as a practical response to real pain — bugs caught too late, deploys that go wrong, and environments that behave differently across machines.

## Learning Goals
- How to reason about where in a development workflow errors should be caught
- How to design a branching and review process that prevents broken code from reaching production
- How to configure automated checks that run on every change without slowing the team down
- How to manage environment configuration safely across local, staging, and production
- How to design a deploy process that can be reversed when something goes wrong

## Target Level
Junior / Mixed

## Prerequisites
- Uses Git for version control (commit, push, pull)
- Has deployed an app at least once, even manually

## Real-World Context
A small startup has three developers and no formal process for shipping code. Deploys are done manually by whoever knows the steps that week. Tests are run locally — when someone remembers. Production has broken several times because of changes no one reviewed. The student is asked to put a real process in place.

## Modules
1. What Is CI/CD and What Problem Does It Solve?
   - Someone pushed to main and broke production; no one ran the tests first
   - Student maps the current workflow and identifies at which point the problem should have been caught

2. Using Git as a Team
   - Two developers edited the same file without coordinating; the merge created a conflict no one knows how to resolve
   - Student designs a branching and pull request workflow that prevents code from merging without review

3. The First Pipeline: Automating Basic Checks
   - The pipeline exists but developers merge anyway when it fails
   - Student configures lint and build checks that block merges on failure, and reasons about what makes a pipeline worth trusting

4. Automated Tests in the Pipeline
   - The pipeline passes green but a bug reaches production; the tests didn't cover the broken flow
   - Student reasons about what to test, why coverage numbers can be misleading, and what tests actually protect the team

5. Environments: Local, Staging, and Production
   - The app works locally but fails in production because of an undocumented environment variable
   - Student defines what each environment is for, how configuration is managed safely, and what must be true about staging for it to be useful

6. Automated Deploy: From Code to Production
   - A deploy went wrong at 11pm and rollback took 40 minutes because no one documented the process
   - Student configures a CD pipeline, defines what "success" means after a deploy, and designs a rollback path that doesn't require heroics

## Outcomes
After finishing this course, the student should be able to:
- Design a Git workflow with pull requests and merge rules that protect the main branch
- Configure a CI pipeline that runs automated checks on every pull request
- Write tests that protect the most critical flows in the application
- Manage environment-specific configuration without exposing secrets
- Set up an automated deploy pipeline with a clear rollback strategy
