# **6. Epic 1: Project Foundation & Core Infrastructure**

**Epic Goal:** To create the foundational structure of the full-stack application, including the repository setup, a deployable placeholder UI, a basic backend endpoint, and the continuous deployment pipeline.

* **Story 1.1: Monorepo and CI/CD Setup**
  * **As a** developer,
  * **I want** to set up a monorepo with a basic CI/CD pipeline,
  * **so that** we have a unified codebase and automated deployments from the start.
  * **Acceptance Criteria:**
    1. A monorepo is initialized with separate packages for the frontend (web) and backend (api).
    2. A basic CI/CD pipeline is configured to deploy both packages on a push to the main branch.
    3. The deployed application shows a simple "Hello World" or placeholder page.
* **Story 1.2: Basic UI Shell**
  * **As a** developer,
  * **I want** to create a non-functional UI shell with a text input and a display area,
  * **so that** we have the basic layout for the query interface in place.
  * **Acceptance Criteria:**
    1. The UI displays a large text input field at the top/center of the page.
    2. A "Submit" button is present next to the input field.
    3. Below the input, there is a designated area where answers will eventually be displayed.
    4. The page is responsive.
* **Story 1.3: Backend Health Check**
  * **As a** developer,
  * **I want** to create a simple /api/health endpoint in the backend,
  * **so that** I can verify that the frontend and backend can communicate and that the backend is deployed correctly.
  * **Acceptance Criteria:**
    1. When a GET request is made to /api/health, the API returns a 200 OK status.
    2. The response body is a JSON object with { "status": "ok" }.
    3. The frontend makes a call to this endpoint on page load to verify connectivity (e.g., logs a success message to the console).
