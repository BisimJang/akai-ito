# Akai Ito

> AI-powered case management for lawyers and investigators. Upload evidence, map connections, and recall critical facts instantly.

---

## Overview

Akai Ito is an investigation platform designed to help users piece together complex cases. Instead of manually sifting through unstructured documents and disjointed timelines, Akai Ito leverages AI to extract facts, map relationships, and present a clear chronological view of the evidence.

## Features

- **Case Dashboard**: Organize and navigate through active investigations.
- **Evidence Upload**: Ingest documents, capture photos, and record voice notes directly into the platform.
- **AI Processing**: Automatically extract entities, summarize content, and map connections between people, places, and events.
- **Fact Retrieval**: Query the case database instantly to find missing links and build a stronger narrative.

## Architecture

- **Frontend**: React (Vite)
- **Backend**: Node.js / Express
- **Database**: PostgreSQL (via Prisma)
- **AI Integration**: Google Gemini API / Cognee
- **Authentication**: Google OAuth

## Setup

1. Configure `.env` in the `server` directory with your database and API keys.
2. Start the backend: `cd server && npm install && node index.js`
3. Start the frontend: `npm install && npm run dev`