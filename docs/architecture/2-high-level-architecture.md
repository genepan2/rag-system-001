# **2. High-Level Architecture**

## **Technical Summary**

The system will be a modern fullstack serverless application built on the Vercel and Supabase platforms. It will feature a Next.js frontend for the user interface and Next.js API Routes for the backend, all managed within a single monorepo. This Jamstack-style architecture prioritizes performance, scalability, and developer experience. The backend will handle the RAG pipeline, communicating with the Supabase PostgreSQL database (with the pgvector extension) for data storage and retrieval, and a third-party LLM for answer generation.

## **Platform and Infrastructure Choice**

* **Platform:** Vercel for hosting the Next.js application and Supabase for the backend services (Database, Auth, Storage).
* **Key Services:**
  * **Vercel:** Next.js hosting, Serverless Functions, Edge Network/CDN.
  * **Supabase:** PostgreSQL database with pgvector extension, Authentication (post-MVP), Storage (post-MVP).
* **Deployment Host and Regions:** Vercel's global edge network. Supabase region to be selected based on proximity to the primary user base.

## **Repository Structure**

* **Structure:** Monorepo. This simplifies type sharing and local development between the frontend and backend.
* **Monorepo Tool:** npm workspaces will be sufficient for this project's scale.

## **Architecture Diagram**

graph TD
    subgraph User Browser
        A\[React UI on Next.js\]
    end

    subgraph Vercel Platform
        B\[Next.js App/API Routes\]
    end

    subgraph Supabase Platform
        C\[Postgres DB with pgvector\]
    end

    subgraph Third-Party Services
        D\[LLM API e.g., OpenAI\]
        E\[Embedding Model API\]
        F\[Git Repository \- Document Source\]
    end

    A \-- HTTP API Call \--\> B
    B \-- Ingests Docs From \--\> F
    B \-- Creates Embeddings \--\> E
    B \-- Stores/Queries Vectors \--\> C
    B \-- Sends Prompt to \--\> D
    D \-- Returns Answer \--\> B
    E \-- Returns Embeddings \--\> B
    C \-- Returns Relevant Chunks \--\> B
    B \-- Returns Answer/Sources \--\> A
