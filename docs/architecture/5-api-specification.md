# **5. API Specification**

(Using simple REST-like endpoints via Next.js API Routes)

* **POST /api/ingest**
  * **Purpose:** Triggers the document ingestion pipeline.
  * **Request Body:** { "repositoryUrl": "string" }
  * **Response:** { "message": "Ingestion started.", "documentCount": number }
* **POST /api/query**
  * **Purpose:** Receives a user question and returns a generated answer.
  * **Request Body:** { "question": "string" }
  * **Response:** { "answer": "string", "sources": \["string"\] }
* **GET /api/health**
  * **Purpose:** Verifies backend health.
  * **Response:** { "status": "ok" }
