# AlertForge: LangGraph-Powered Incident Postmortem System

## 🔍 Current System Overview
AlertForge is a production-grade incident response platform designed to eliminate the "fog of war" during production outages. The system leverages a **LangGraph-based reasoning pipeline** to generate strictly grounded, evidence-based postmortems by analyzing three distinct data streams:
1.  **Temporal Data**: System-generated timeline events (status changes, responder assignments) stored in MongoDB.
2.  **Conversational Data**: War room chat history (developer discussions, debugging commands) indexed in both MongoDB and Pinecone.
3.  **External Intelligence**: Real-world solutions fetched via the Tavily Search API and similar historical incidents retrieved from the Pinecone Vector Database.

The backend is built on a distributed Node.js architecture using **ES Modules**, **Socket.IO** for real-time collaboration, and **Redis** for horizontal scaling and distributed rate limiting.

---

## ⚙️ Architecture Flow

### 1. Incident Lifecycle & Ingestion
*   **API Ingest**: Incidents are created via a secure REST API authenticated by per-service API Keys.
*   **Intelligence Injection**: Upon creation, the `TavilyService` is triggered to find real-world solutions for the specific error message.
*   **Vector Indexing**: The incident is immediately embedded using `text-embedding-3-small` and stored in **Pinecone** to enable semantic "similar incident" lookup.

### 2. War Room Collaboration (Real-Time)
*   **Socket.IO + Redis**: Sockets use a Redis adapter to ensure consistency across multiple server nodes.
*   **Presence & Throttling**: A custom Redis-based middleware tracks responder presence and enforces distributed rate limits on chat messages and events (Burst: 3/sec).
*   **Continuous Learning**: Every chat message is asynchronously indexed in Pinecone, providing the AI with a searchable "short-term memory" of the debugging process.

### 3. Postmortem Generation (The LangGraph Pipeline)
*   **Trigger**: Automatically triggered once an incident status is transitioned to `resolved`.
*   **Context Aggregation**: The `PostmortemService` pulls the incident details, the full timeline, the last 50 chat messages, similar incidents from Pinecone, and Tavily insights.
*   **Reasoning**: The data is passed into a directed acyclic graph (DAG) where specialized nodes progressively build the report.

---

## 🧠 AI/Postmortem System Flow (LangGraph)

The system uses a 5-step pipeline implemented via `@langchain/langgraph`:

```text
[START] 
   |
[SummaryNode] -----> [RootCauseNode] -----> [ActionNode] -----> [LearningNode] -----> [ValidatorNode] 
                                                                                          |
                                                                                        [END]
```

| Node | Responsibility | Grounding Source |
| :--- | :--- | :--- |
| **Summary** | Executive review of the incident lifecycle. | Timeline + Incident Status |
| **Root Cause** | Identifying technical failure points & triggers. | War Room Chat + Tavily Insights |
| **Action Items** | Technical, grounded preventive tasks. | Chat + Similar Incident Solutions |
| **Learning** | Process and reliability improvements. | Full Aggregated Context |
| **Validator** | Enforces JSON schema and removes hallucinations. | Strict Zod Parsing (PostmortemOutputSchema) |

### Anti-Hallucination Controls
*   **Negative Constraints**: Prompts explicitly forbid "filler" items (e.g., "schedule a meeting").
*   **Evidence Fallback**: If a section lacks data, the AI must return *"Not available in provided data"* instead of speculating.
*   **Confidence Scoring**: The `ValidatorNode` assigns a score (0-1) based on the density of evidence; reports are flagged for review if confidence is low.

---

## 🔌 Socket + Redis Architecture

*   **Distributed State**: Presence counts and room memberships are synchronized via Redis, allowing the system to handle thousands of concurrent responders across a cluster.
*   **Event Throttling (Redis Multi-Atomic)**: 
    - `chat:message`: Max 3/sec (Burst protection).
    - `chat:typing`: Max 1/2sec (Debounced).
    - `join_room`: Max 5/min (Spam prevention).
*   **Read-Only Mode**: The socket server automatically enforces read-only state for "Resolved" incident rooms, preventing post-incident chat noise.

---

## 🚨 Issues / Gaps Found in Backend

1.  **Chat Context Window**: Currently limited to the last 50 messages for AI context. Long-running outages may lose critical early debugging information.
2.  **Promise-Based Upserts**: Pinecone vector indexing is currently "fire-and-forget" promises. Failure to index does not retry, potentially leading to "blind spots" in similar incident search.
3.  **Tavily Redundancy**: Insights are fetched at creation AND at postmortem generation. This increases latency and uses extra API credits.
4.  **Schema Rigidity**: Date objects in MongoDB must be carefully transformed to ISO strings for AI nodes; current `formatter.js` handles most cases but remains a maintenance point.
5.  **Role-Based Throttling**: Rate limits are global; high-priority users (e.g., Lead SRE) should have higher burst limits than observers.

---

## 🧩 Missing Features or Improvements Needed

*   **Semantic Postmortem RAG**: Currently queries *raw incidents*. The system should query previous *Final Postmortems* to find proven solutions.
*   **Manual Regeneration**: No endpoint exists to "re-trigger" AI generation if the initial output was insufficient or new data was added late.
*   **Incident Impact Graphing**: Integrating metrics from external monitoring (e.g., Prometheus) into the LangGraph context for more accurate impact assessment.
*   **Multi-Modal Analysis**: Analyzing images/screenshots shared in the war room via Vision LLMs.

---

## 🚀 Recommended Fixes / Enhancements

1.  **Implement BullMQ**: Transition all Pinecone and Tavily operations to a Redis-backed worker queue for reliability and retries.
2.  **Context Caching**: Store the initial Tavily insights in the `Incident` document and pass it directly to the Postmortem graph.
3.  **Smart Chat Selection**: Instead of "last 50", use semantic search to fetch the most relevant chat segments for the Root Cause node.
4.  **Post-Generation API**: Implement a `PATCH /api/postmortem/:id` to allow SREs to refine AI-generated findings manually.

---

## 📌 Final Production Readiness Checklist

- [x] **ES Module Compliance**: All imports use `.js` extensions.
- [x] **Vector Consistency**: Pinecone upserts use the correct `records` array format (v2 SDK).
- [x] **Authentication**: All API routes and Sockets require valid API Keys or Auth Cookies.
- [x] **Rate Limiting**: Distributed Redis-based limits active for API and Sockets.
- [x] **Hallucination Prevention**: Mandatory grounding rules applied to all AI nodes.
- [x] **Structured Output**: Final postmortem output validated via Zod.
- [ ] **Worker Scaling**: (Pending) Transitioning AI/Vector tasks to BullMQ.
- [ ] **Manual Override Flow**: (Pending) REST endpoints for postmortem correction.
