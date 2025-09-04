# **4. Data Models**

## **DocumentChunk**

* **Purpose:** Stores a processed chunk of text from an ingested document, along with its vector embedding.
* **TypeScript Interface:**
  interface DocumentChunk {
    id: string; // UUID
    source\_document: string;
    content: string;
    embedding: number\[\]; // Vector embedding
    created\_at: string; // Timestamp
  }
