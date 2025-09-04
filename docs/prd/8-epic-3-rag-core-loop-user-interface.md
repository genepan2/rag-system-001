# **8. Epic 3: RAG Core Loop & User Interface**

**Epic Goal:** To implement the full, end-to-end user-facing experience of asking a question and receiving a generated answer with sources.

* **Story 3.1: Backend Query Endpoint**
  * **As a** developer,
  * **I want** a backend endpoint that accepts a user's question,
  * **so that** the RAG process can be initiated from the UI.
  * **Acceptance Criteria:**
    1. A POST /api/query endpoint exists that accepts a JSON payload with a question field.
    2. The endpoint vectorizes the incoming question using the same embedding model as the ingestion pipeline.
    3. It uses the question vector to query the vector database and retrieve the top k (e.g., 5\) most relevant text chunks.
    4. It constructs a prompt containing the user's question and the retrieved text chunks.
* **Story 3.2: LLM Answer Generation**
  * **As a** system,
  * **I want** to send the constructed prompt to an LLM and receive a synthesized answer,
  * **so that** I can provide a direct answer to the user's question.
  * **Acceptance Criteria:**
    1. The system successfully calls the configured LLM API with the prompt.
    2. The LLM's text response is captured.
    3. The source documents associated with the retrieved chunks are identified.
    4. The endpoint returns a JSON response containing the generated answer and a list of the source document names.
* **Story 3.3: Frontend Integration and Display**
  * **As a** user,
  * **I want** to type my question, click "Submit", and see the answer appear on the screen,
  * **so that** I can get information easily.
  * **Acceptance Criteria:**
    1. When the user clicks "Submit", the question from the input field is sent to the POST /api/query endpoint.
    2. While waiting for a response, a loading indicator is displayed.
    3. When the response is received, the generated answer is displayed clearly in the answer area.
    4. The list of source documents is displayed as clickable links below the answer.
    5. If an error occurs, a user-friendly error message is shown.
