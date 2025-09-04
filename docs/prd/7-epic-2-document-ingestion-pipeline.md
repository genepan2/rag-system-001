# **7. Epic 2: Document Ingestion Pipeline**

**Epic Goal:** To build the automated pipeline that ingests Markdown documents from a source repository and makes them available for querying in a vector database.

* **Story 2.1: Document Source Connector**
  * **As a** system,
  * **I want** to clone a specified public Git repository containing Markdown documents,
  * **so that** I can access the raw content for processing.
  * **Acceptance Criteria:**
    1. An API endpoint (e.g., POST /api/ingest) exists to trigger the process.
    2. The service successfully clones the repository specified in an environment variable to a temporary location.
    3. The service can list all .md files within the cloned repository.
* **Story 2.2: Document Processing and Vectorization**
  * **As a** system,
  * **I want** to read the Markdown files, split them into text chunks, and convert them to vector embeddings,
  * **so that** they can be stored and searched semantically.
  * **Acceptance Criteria:**
    1. Markdown files are read and their text content is extracted.
    2. The text is split into chunks of a predefined size (e.g., 1000 characters).
    3. Each chunk is sent to an embedding model API, and a vector embedding is received.
    4. Each chunk is associated with its source document name.
* **Story 2.3: Vector Database Storage**
  * **As a** system,
  * **I want** to store the vector embeddings and their corresponding text chunks in the vector database,
  * **so that** they are indexed and ready for querying.
  * **Acceptance Criteria:**
    1. The system successfully connects to the vector database.
    2. For each text chunk, its vector embedding and metadata (source document, text content) are successfully saved to the database.
    3. The ingestion endpoint returns a success message with the count of documents processed.
