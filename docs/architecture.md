# **RAG System Fullstack Architecture Document**

## **1. Introduction**

This document outlines the complete fullstack architecture for the RAG System, including backend services, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

### **Starter Template or Existing Project**

N/A \- Greenfield project.

### **Change Log**

| Date | Version | Description | Author |
| :---- | :---- | :---- | :---- |
| Sep 04, 2025 | 1.0 | Initial architecture draft created | Winston, Arch |

## **2. High-Level Architecture**

### **Technical Summary**

The system will be a modern fullstack serverless application built on the Vercel and Supabase platforms. It will feature a Next.js frontend for the user interface and Next.js API Routes for the backend, all managed within a single monorepo. This Jamstack-style architecture prioritizes performance, scalability, and developer experience. The backend will handle the RAG pipeline, communicating with the Supabase PostgreSQL database (with the pgvector extension) for data storage and retrieval, and a third-party LLM for answer generation.

### **Platform and Infrastructure Choice**

* **Platform:** Vercel for hosting the Next.js application and Supabase for the backend services (Database, Auth, Storage).
* **Key Services:**
  * **Vercel:** Next.js hosting, Serverless Functions, Edge Network/CDN.
  * **Supabase:** PostgreSQL database with pgvector extension, Authentication (post-MVP), Storage (post-MVP).
* **Deployment Host and Regions:** Vercel's global edge network. Supabase region to be selected based on proximity to the primary user base.

### **Repository Structure**

* **Structure:** Monorepo. This simplifies type sharing and local development between the frontend and backend.
* **Monorepo Tool:** npm workspaces will be sufficient for this project's scale.

### **Architecture Diagram**

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

## **3. Tech Stack**

| Category | Technology | Version | Purpose | Rationale |
| :---- | :---- | :---- | :---- | :---- |
| Frontend Language | TypeScript | 5.x | Type safety for UI components | Industry standard, improves maintainability |
| Frontend Framework | Next.js (React) | 14.x | UI framework and serverless backend | Integrated fullstack, Vercel native |
| UI Component Library | Tailwind CSS | 3.x | Utility-first CSS framework for rapid UI dev | Highly customizable and efficient |
| Backend Language | TypeScript | 5.x | Type safety for API logic | Consistent language across the stack |
| API Style | REST / RPC | N/A | API endpoints via Next.js API Routes | Simple, well-understood, native to Next.js |
| Database | Supabase (Postgres) | 15.x | Primary database with vector support | Managed service, includes pgvector |
| Backend Testing | Jest | 29.x | Unit and integration testing for API routes | Widely adopted, good ecosystem |
| IaC Tool | N/A | N/A | Vercel and Supabase provide managed infra | Simplifies setup for MVP |
| CI/CD | Vercel | N/A | Continuous deployment from Git | Zero-config CI/CD for Next.js projects |
| Logging | Vercel Runtime Logs | N/A | Default logging for serverless functions | Built-in, sufficient for MVP |

## **4. Data Models**

### **DocumentChunk**

* **Purpose:** Stores a processed chunk of text from an ingested document, along with its vector embedding.
* **TypeScript Interface:**
  interface DocumentChunk {
    id: string; // UUID
    source\_document: string;
    content: string;
    embedding: number\[\]; // Vector embedding
    created\_at: string; // Timestamp
  }

## **5. API Specification**

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

## **6. Unified Project Structure (Monorepo)**

rag-system/
├── apps/
│   └── web/                  \# The Next.js fullstack application
│       ├── app/
│       │   ├── api/          \# Backend API Routes
│       │   │   ├── health/
│       │   │   ├── ingest/
│       │   │   └── query/
│       │   │       └── route.ts
│       │   ├── (components)/ \# UI Components
│       │   │   └── ui/
│       │   ├── (lib)/        \# Shared library code
│       │   │   ├── db.ts     \# Database client
│       │   │   └── llm.ts    \# LLM client
│       │   ├── layout.tsx    \# Root layout
│       │   └── page.tsx      \# Main page component
│       ├── public/
│       └── package.json
├── packages/
│   └── tsconfig/             \# Shared TypeScript configs
├── .env.local.example        \# Environment variable template
├── package.json              \# Root package.json with workspaces
└── tsconfig.json             \# Root TypeScript config

## **7. Development Workflow**

* **Local Development Setup:**
  1. Install Node.js (v20+).
  2. Run npm install in the root directory.
  3. Set up Supabase account and create a new project.
  4. Copy .env.local.example to .env.local and fill in Supabase and LLM API keys.
* **Development Commands:**
  * npm run dev: Starts the Next.js development server.

## **8. Testing Strategy**

* **Frontend Tests:** Basic component tests using Jest and React Testing Library to ensure UI components render correctly.
* **Backend Tests:** Unit tests for API route handlers, mocking database and LLM clients. Integration tests can be added post-MVP.

## **9. Checklist Results Report**

This section is pending. After the architecture is finalized, I will run the architect-checklist to validate its completeness and readiness for development.

## **10. Next Steps**

This architecture provides a complete plan. The next logical step is for the **Product Owner (PO)** to perform a final validation of all three documents (Brief, PRD, Architecture) to ensure they are consistent and complete before we begin creating development stories.