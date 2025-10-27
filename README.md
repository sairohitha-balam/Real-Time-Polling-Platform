# Real-Time Polling Platform Backend

This is the backend for a real-time polling application. It features a scalable, queue-based architecture to handle high-throughput concurrent voting and pushes live results to clients using WebSockets.

Built with: **Node.js, Express, TypeScript, PostgreSQL, Redis, Prisma, BullMQ, and Socket.IO**.

## Features

* **Organizer Authentication:** Organizers can register and log in via JWT.
* **Session Management:** Authenticated organizers can create, start, and stop poll sessions.
* **Public Voting:** Participants can join an `ACTIVE` session via a unique 6-character `joinCode`.
* **Scalable Voting:** Votes are not counted on the main request. They are sent to a **Redis-based queue (BullMQ)** for asynchronous processing. This allows the API to return an immediate `202 Accepted` response, handling high traffic without database bottlenecks.
* **Real-Time Results:** A background worker processes the vote queue, updates the database, and publishes a message to a **Redis Pub/Sub** channel. A **Socket.IO** server listens to this channel and pushes a `results_updated` event to all clients in that specific session's "room."
* **Duplicate Vote Prevention:** IP-based tracking prevents a single participant from voting on the same question multiple times.
* **Full API Documentation:** A live Swagger/OpenAPI spec is available at `/api-docs`.
* **Containerized:** The entire application (App, Worker, DB, Redis) can be booted with a single command using `docker-compose`.

## Architecture & Technology Choices

| Component | Technology | Reasoning |
| :--- | :--- | :--- |
| **Framework** | **Express.js (Node.js)** | A robust, minimalist, and well-supported framework for building APIs. |
| **Language** | **TypeScript** | Adds static typing for better code quality, fewer bugs, and improved developer experience. |
| **Database** | **PostgreSQL** | A powerful, reliable relational database for storing persistent data (users, sessions, questions). |
| **ORM** | **Prisma** | A modern, type-safe ORM that simplifies database interactions and includes a great migration system. |
| **Queuing** | **Redis + BullMQ** | **(Core Scalability)** Redis is an in-memory data store, perfect for a fast message broker. BullMQ is a robust queue system built on Redis that handles job processing, de-duplication, and retries. |
| **Real-Time** | **Socket.IO + Redis Pub/Sub** | **(Core Real-Time)** Socket.IO provides a simple WebSocket abstraction. Using Redis Pub/Sub decouples the app server from the worker, allowing them to communicate and scale independently. |
| **Authentication** | **JWT (JSON Web Tokens)** | A stateless, standard way to handle authentication for API-driven services. |
| **Validation** | **Zod** | A TypeScript-first schema validation library that ensures all incoming data is correct. |

### High-Throughput Voting Flow

1.  A Participant `POST /api/v1/public/vote`.
2.  The **Express Server** validates the input and gets the participant's IP address (`req.ip`).
3.  The server adds a "vote job" to the **BullMQ Queue** (in Redis) with a unique Job ID (`ip-address-question-id`) to prevent spam.
4.  The server immediately returns `202 Accepted`.
5.  A separate **Worker Process** listens to the queue. It picks up the job.
6.  The **Worker** checks the **PostgreSQL DB** to see if this IP has already voted on this question (using the `VoteRecord` table).
7.  If not, it runs a transaction to `INSERT` the `VoteRecord` and `INCREMENT` the `votes` count on the `Option` table.
8.  Upon success, the **Worker** `PUBLISH`es a message (e.g., `{"joinCode": "ABC123"}`) to the `session-updates` channel in **Redis Pub/Sub**.
9.  The **Express Server** (which is also a `SUBSCRIBER`) receives this message.
10. The **Socket.IO** instance on the server emits a `results_updated` event to the "room" named `ABC123`.
11. All connected clients in that room receive the event and know to fetch new results from `GET /api/v1/public/results/ABC123`.

## Database Schema

Schema defined in `prisma/schema.prisma`:

```prisma
// This is your full database schema from Phase 0

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Organizer accounts
model Organizer {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hashed password
  sessions  Session[]
  createdAt DateTime @default(now())
}

// A polling session
model Session {
  id          String     @id @default(cuid())
  title       String
  joinCode    String     @unique // 6-char code for joining
  status      SessionStatus @default(PENDING) // PENDING, ACTIVE, STOPPED
  organizer   Organizer  @relation(fields: [organizerId], references: [id])
  organizerId String
  questions   Question[]
  createdAt   DateTime   @default(now())
  
  @@index([organizerId])
}

// A single question in a session
model Question {
  id        String   @id @default(cuid())
  text      String
  options   Option[]
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sessionId String
  
  @@index([sessionId])
}

// A single answer option for a question
model Option {
  id        String   @id @default(cuid())
  text      String
  votes     Int      @default(0) // Denormalized count for fast reads
  question  Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionId String
  
  @@index([questionId])
}

// To track votes for abuse prevention
model VoteRecord {
  id           String @id @default(cuid())
  identifier   String // IP address or fingerprint
  questionId   String
  
  @@unique([identifier, questionId]) // Prevents a single ID from voting on the same question twice
}

enum SessionStatus {
  PENDING // Created but not yet live
  ACTIVE  // Accepting votes
  STOPPED // Voting closed
}
```
## Duplicate-Vote Prevention Approach

This was a key requirement, and the chosen approach balances effectiveness with the constraints of a public, no-auth system.

* **Mechanism:**
    1.  A `VoteRecord` table is used with a composite unique key: `@@unique([identifier, questionId])`.
    2.  The `identifier` for a public participant is their **IP address** (captured via `req.ip`).
    3.  When a vote job is processed, the worker *first* checks if a `VoteRecord` exists. If it does, the job is discarded. If not, it creates the record and increments the vote count within a database transaction.

* **Trade-Offs:**
    * **Pros:** This is a simple, stateless (from the client's perspective), and effective backend-only solution. It requires no cookies or frontend logic and successfully prevents simple vote-spamming.
    * **Cons:**
        1.  **Shared Networks:** It will incorrectly block multiple, distinct users who share a single public IP (e.g., a university campus, a corporate office, or public WiFi).
        2.  **Bypassable:** A determined user can bypass this by using a VPN or proxy service to change their IP address for each vote.

* **Alternative (Future Improvement):** A more robust solution would involve frontend device fingerprinting (e.g., using FingerprintJS) to create a more unique `identifier`.

## Setup & Installation

You can run this project either with Docker (recommended for one-command setup) or manually.

### 1. With Docker (Recommended)

**Prerequisites:** Docker & Docker Compose

1.  Clone the repository:
    ```bash
    git clone https://github.com/sairohitha-balam/Real-Time-Polling-Platform
    cd Real-Time Polling Platform
    ```
2.  Create your `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
3.  Open the new `.env` file and **add your `JWT_SECRET`**. You can use the default database/redis values.

4.  Build and run all services in detached mode:
    ```bash
    docker-compose up -d --build
    ```
5.  The application is now running:
    * **API Server:** `http://localhost:4000`
    * **API Docs:** `http://localhost:4000/api-docs`

### 2. Manual Setup

**Prerequisites:** Node.js, PostgreSQL, Redis

1.  Clone the repository and install dependencies:
    ```bash
    git clone https://github.com/sairohitha-balam/Real-Time-Polling-Platform
    cd Real-Time Polling Platform
    npm install
    ```
2.  Create and configure your `.env` file:
    ```bash
    cp .env.example .env
    ```
3.  Open the new `.env` file and **set your `JWT_SECRET`**. You also must confirm that your `DATABASE_URL` and `REDIS_URL` match your local setup.

4.  Run the database migrations:
    ```bash
    npx prisma migrate dev
    ```
5.  Run the application in **two separate terminals**:

    * **Terminal 1 (API Server):**
        ```bash
        npm run dev
        ```
    * **Terminal 2 (Vote Worker):**
        ```bash
        npm run start:worker
        ```

## API Documentation

The full, interactive OpenAPI (Swagger) documentation is served by the app itself.

Once the server is running, you can access it at:
**[http://localhost:4000/api-docs](http://localhost:4000/api-docs)**