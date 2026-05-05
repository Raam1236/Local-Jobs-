# Security Specification: AI Job Platform

## 1. Data Invariants
- A **Job** must have a valid `employerId` matching the creator's UID.
- An **Application** must have a `workerId` matching the creator's UID and a `jobId` referencing an existing `open` or `urgent_replacement` job.
- **User Roles** are immutable once set during registration, or only modifiable by admins.
- **Ratings** can only be updated via the review system, not direct profile modification by the worker.

## 2. The Dirty Dozen (Payloads to Block)

1. **Identity Spoofing (Job)**: Creating a job with someone else's `employerId`.
2. **Identity Spoofing (Application)**: Applying for a job on behalf of another user.
3. **Privilege Escalation**: A user updating their own profile to `role: 'admin'`.
4. **Rating Manipulation**: A worker directly updating their `averageRating` or `ratingCount`.
5. **Shadow Update (Job)**: Adding a `isVerified: true` flag to a job posting via client SDK.
6. **State Shortcutting (Application)**: A worker updating their own application status to `accepted`.
7. **Resource Poisoning (ID)**: Using a 1MB string as a `jobId`.
8. **Resource Poisoning (Field)**: Sending a 1MB string for the `job.title`.
9. **Orphaned Application**: Applying to a `jobId` that does not exist.
10. **PII Leak**: An unauthorized user reading the `private` subcollection of another user.
11. **Timestamp Manipulation**: Providing a backdated `createdAt` timestamp.
12. **Status Lock Bypass**: Updating a job's details after it has been marked as `closed`.

## 3. Test Invariants
- `get` on a notification must fail if `userId != auth.uid`.
- `update` on `User` must fail if `affectedKeys().hasAny(['role', 'uid', 'email'])`.
- `create` on `Application` must fail if `status != 'pending'`.
