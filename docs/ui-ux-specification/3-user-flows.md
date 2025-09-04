# **3. User Flows**

## **Core User Flow: Asking a Question**

* **User Goal:** To get a direct, accurate answer to a question about internal documentation.
* **Entry Points:** The user lands directly on the Query Interface.
* **Success Criteria:** The user receives a helpful answer and knows which document(s) it came from.
* **Flow Diagram:**
  sequenceDiagram
      participant User
      participant UI
      participant System
      User-\>\>+UI: Lands on the page
      User-\>\>UI: Types question into input field
      User-\>\>UI: Clicks "Submit" button
      UI-\>\>+System: Sends question to backend
      UI--\>\>User: Shows loading indicator
      System--\>\>-UI: Returns answer and sources
      UI--\>\>User: Displays formatted answer
      UI--\>\>User: Displays clickable source links

* **Edge Cases & Error Handling:**
  * If the system returns an error, the UI displays a user-friendly message like "Sorry, I couldn't process that question. Please try rephrasing it."
  * If no relevant documents are found, the UI displays "I couldn't find an answer in the current documents for that question."
  * The submit button should be disabled while a request is in progress.
