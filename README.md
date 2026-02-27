# NoCarry 🚫📦

> **Fair grading for group projects. Finally.**

---

## The Problem Nobody Talks About

Every semester, millions of students survive the same nightmare:

- **One person carries the whole team.** They do 80% of the work and get the same grade as everyone else.
- **Professors are flying blind.** They see the final output — not who actually built it.
- **Peer reviews are a joke.** Friends rate friends. Real contributors go unrecognized.
- **Generic tools don't help.** Notion, Trello, Google Docs — none of them were built for academic accountability.

**NoCarry was.**

---

## What NoCarry Does

NoCarry is a full-stack SaaS platform built specifically for university group projects. It tracks real contributions, surfaces freeloaders, and gives professors the data they need to grade fairly.

```
Students work → NoCarry tracks everything → Professor sees the truth
```

---

## Core Features

### 📊 Contribution Scoring Engine
Every action counts. Task creation, completion, assignments — all logged automatically and converted into a **contribution score (%)** per member. No self-reporting. No bias. Just data.

### 📋 Kanban Task Board
Teams manage work across **To Do → In Progress → Done** columns. Completed tasks stay visible for 24 hours, then archive automatically into a **History tab** — keeping the board clean without losing the record.

### ⭐ Smart Peer Review System
Students rate teammates on:
- Work Quality
- Communication
- Timeliness
- Initiative

The system **cross-references peer scores with actual contribution data** and flags anomalies — like a member who got glowing reviews but barely touched the project.

### 🚩 Freeloader Detection
NoCarry automatically flags:
- Members with contribution below 10%
- High peer rating + low activity (suspicious)
- Low peer rating + high activity (potential unfair treatment)

Professors see flags instantly on their dashboard.

### 🤖 AI Report Generator
One click. Professors get a fully written, professional contribution report powered by Claude AI — including individual analysis per member and **suggested grading adjustments**.

Export as `.txt` and use directly in your grading workflow.

### 🎓 Professor Dashboard
Real-time visibility into every team:
- Member count, task stats, overdue items
- Overall completion progress bar
- Contribution rankings
- Peer review averages
- Anomaly flags

All grouped by course code. Zero manual work.

### 👥 Team Invites
Students invite teammates by email. Roles are preserved — professors stay professors, students stay students.

---

## User Roles

| Role | Capabilities |
|---|---|
| **Student** | Create/join projects, manage tasks, submit peer reviews, view contributions |
| **Team Leader** | All student permissions + invite members |
| **Professor** | Monitor all teams, view analytics, generate AI reports, detect flags |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | Supabase Auth |
| AI | Anthropic Claude API |
| Deployment | Vercel |
| Domain | nocarry.space |

---

## Database Schema

```
User → ProjectMember → Project → Task
                              → ActivityLog
                              → PeerReview
```

Core tables: `User`, `Project`, `ProjectMember`, `Task`, `ActivityLog`, `PeerReview`

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account
- An Anthropic API key

### Installation

```bash
git clone https://github.com/yourusername/nocarry
cd nocarry
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string
ANTHROPIC_API_KEY=your_anthropic_key
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How Contribution Scoring Works

| Action | Points |
|---|---|
| Task completed (assigned to you) | 5 pts |
| Task moved to In Progress | 3 pts |
| Task created | 2 pts |
| Member invited / project created | 1 pt |

Contribution % = `(your points / total team points) × 100`

Scores update in real time as the team works.

---

## Roadmap

- [ ] Google Docs integration
- [ ] GitHub commit tracking
- [ ] LMS integration (Canvas, Moodle, Blackboard)
- [ ] Email notifications for inactive members
- [ ] ELO-style teamwork rating across projects
- [ ] Plagiarism detection
- [ ] Mobile app

---

## Why NoCarry?

Because someone always ends up carrying the team.

NoCarry makes that visible — and makes sure it never goes unrecognized again.

---

## License

MIT

---

*Built with Next.js, Supabase, Prisma, and Claude AI.*  
*Live at [nocarry.space](https://nocarry.space)*