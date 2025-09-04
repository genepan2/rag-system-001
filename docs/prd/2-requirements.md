# **2. Requirements**

## **Functional Requirements**

* **FR1:** The system must ingest and process Markdown documents from a specified public Git repository.
* **FR2:** The system must parse the documents into manageable text chunks suitable for embedding.
* **FR3:** The system must convert text chunks into vector embeddings and store them in a vector database.
* **FR4:** The system must provide a web-based user interface with a text input field for users to submit questions.
* **FR5:** The system must accept a user's natural language question and find the most relevant document chunks from the vector database.
* **FR6:** The system must use a Large Language Model (LLM) to generate a synthesized answer based on the user's question and the retrieved document chunks.
* **FR7:** The system must display the generated answer to the user in the web interface.
* **FR8:** The system must display citations or links to the source documents from which the answer was derived.

## **Non-Functional Requirements**

* **NFR1:** The user interface must be simple, intuitive, and require no user training.
* **NFR2:** The system should return an answer to a typical query in under 10 seconds.
* **NFR3:** The system's cloud and API costs should be monitored and optimized for efficiency.
* **NFR4:** The architecture should be scalable to support a larger volume of documents and user queries post-MVP.
