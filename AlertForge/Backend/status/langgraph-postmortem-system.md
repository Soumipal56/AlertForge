# AlertForge: LangGraph-Powered Incident Postmortem System

## 🔍 Current System Overview
AlertForge is a production-grade incident response platform designed to eliminate the "fog of war" during production outages. The system leverages a **LangGraph-based reasoning pipeline** to generate strictly grounded, evidence-based postmortems by analyzing three distinct data streams:
1.  **Temporal Data**: System-generated timeline events (status changes, responder assignments).
2.  **Conversational Data**: War room chat history (developer discussions, debugging commands).
3.  **External Intelligence**: Real-world solutions fetched via the Tavily Search API and similar historical incidents retrieved from the Pinecone Vector Database.

The backend is built on a distributed Node.js architecture using **ES Modules**, **Socket.IO** for real-time collaboration, and **Redis** for horizontal scaling and distributed rate limiting.

---

## ⚙️ Architecture Flow

### 1. Incident Lifecycle & Ingestion
*   **API Ingest**: Incidents are created via a secure REST API (API Key authenticated).
*   **Intelligence Injection**: Upon creation, the `TavilyService` is triggered to find real-world solutions for the specific error message.
*   **Vector Indexing**: The incident is immediately embedded using `text-embedding-3-small` and stored in **Pinecone** to enable semantic "similar incident" lookup.

### 2. War Room Collaboration (Real-Time)
*   **Socket.IO + Redis**: Sockets use a Redis adapter to ensure consistency across multiple server nodes.
*   **Presence & Throttling**: A custom Redis-based middleware tracks responder presence and enforces distributed rate limits on chat messages and events.
*   **Continuous Learning**: Every chat message is asynchronously indexed in Pinecone, providing the AI with a searchable "short-term memory" of the debugging process.

### 3. Postmortem Generation (The LangGraph Pipeline)
*   **Trigger**: Triggered once an incident is resolved.
*   **Context Aggregation**: The `PostmortemService` pulls the incident details, the full timeline, the last 50 chat messages, similar incidents from Pinecone, and Tavily insights.
*   **Reasoning**: The data is passed into a directed acyclic graph (DAG) where specialized nodes progressively build the report.

---

## 🧠 AI/Postmortem System Flow (LangGraph)

The system uses a 5-step pipeline implemented via `StateGraph`:

```text
[START] --> [SummaryNode] --> [RootCauseNode] --> [ActionNode] --> [LearningNode] --> [ValidatorNode] --> [END]
```

| Node | Responsibility | Grounding Source |
| :--- | :--- | :--- |
| **Summary** | Executive review of what happened. | Timeline + Incident Status |
| **Root Cause** | Identifying technical failure points. | War Room Chat + Tavily |
| **Action Items** | Technical, grounded preventive tasks. | Chat + Similar Incidents |
| **Learning** | Process and reliability improvements. | Full Context |
| **Validator** | Enforces JSON schema, removes hallucinations. | Strict Zod Parsing |

### Anti-Hallucination Controls
*   **Negative Constraints**: Prompts explicitly forbid "filler" items (e.g., "schedule a meeting").
*   **Evidence Fallback**: If a section lacks data, the AI must return *"Not available in provided data"* instead of speculating.
*   **Confidence Scoring**: The `ValidatorNode` assigns a score based on the density of evidence; reports < 0.75 are flagged for manual review.

---

## 🚨 Issues / Gaps Found in Backend

1.  **Tavily Redundancy**: Insights are fetched during incident creation and again during postmortem generation. While this ensures fresh data, it increases latency and API costs.
2.  **Date Representation**: MongoDB stores native Date objects, but LangGraph/Mistral requires ISO strings. While handled in `formatter.js`, it requires strict vigilance in schema updates.
3.  **Similar Incident Heuristics**: The current token-based regex fallback for finding similar incidents is effective for exact matches but lacks the semantic nuance of the primary Pinecone search.
4.  **Rate Limit Granularity**: Socket rate limits are currently uniform; they should be tiered based on user roles (e.g., Incident Commanders vs. Observers).

---

## 🔌 Socket + Redis Architecture

*   **Distributed State**: Presence counts and room memberships are synchronized via Redis, allowing the system to handle thousands of concurrent responders across a cluster.
*   **Event Throttling**: 
    - `chat:message`: Max 3/sec (Burst).
    - `chat:typing`: Max 1/2sec.
    - `join_room`: Max 5/min.
*   **Read-Only Mode**: The socket server automatically enforces read-only state for "Resolved" incident rooms, preventing post-incident chat noise.

---

## 🧩 Missing Features or Improvements Needed

*   **Semantic RAG for Past Postmortems**: Currently, Pinecone search focuses on *Incidents*. The system should also query previous *Postmortem results* to find how similar problems were definitively solved.
*   **Manual Regeneration Flow**: A mechanism to "re-run" the LangGraph if new evidence (like late-arriving logs) is added after the initial resolution.
*   **Incident Impact Graphing**: Integrating metrics from external monitoring (e.g., Prometheus) into the LangGraph context for more accurate impact assessment.

---

## 🚀 Recommended Fixes / Enhancements

1.  **Context Caching**: Store the initial Tavily insights in the Incident document and pass it directly to the Postmortem graph to reduce API calls.
2.  **Granular Confidence Scoring**: Weight the `aiConfidence` score more heavily toward the `RootCauseNode` findings, as that is where hallucinations are most risky.
3.  **Asynchronous Indexing**: Move the Pinecone upsert logic to a dedicated worker queue (e.g., BullMQ) to ensure incident creation remains lightning-fast even under high vector DB latency.

---

## 📌 Final Production Readiness Checklist

- [x] **ES Module Compliance**: All imports use `.js` extensions.
- [x] **Vector Consistency**: Pinecone upserts use the correct `records` array format (v2 SDK).
- [x] **Authentication**: All API routes and Sockets require valid API Keys.
- [x] **Rate Limiting**: Distributed Redis-based limits active.
- [x] **Hallucination Prevention**: Mandatory grounding rules applied to all prompts.
- [x] **Structured Output**: Final postmortem output validated via Zod.
- [ ] **Worker Scaling**: (Pending) Transitioning Pinecone tasks to background workers.
