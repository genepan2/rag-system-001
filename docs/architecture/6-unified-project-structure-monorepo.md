# **6. Unified Project Structure (Monorepo)**

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
