# ApiForge Server



This repository contains the backend server for ApiForge, a comprehensive API testing tool. It's built with Node.js and Express, designed to handle API request proxying, history management, and collection persistence using Supabase.

## Features

*   **CORS Proxy:** Securely proxies API requests from the client to any external endpoint, bypassing browser CORS restrictions. Includes security measures to block requests to internal networks in production.
*   **Request History:** Saves a log of all API requests made by a user, allowing for easy recall and re-use.
*   **Collections:** Enables users to create collections and save structured API requests (including URL, method, headers, and body) for organization and repeated use.
*   **Supabase Integration:** Uses Supabase for persistent data storage of user history and collections.
*   **Graceful Fallback:** If Supabase credentials are not provided, the server gracefully falls back to a "local mode," signaling the client to use its own local storage for data persistence. This allows the application to function without a configured database.

## Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** Supabase (PostgreSQL)
*   **HTTP Client:** Axios
*   **Dependencies:**
    *   `cors` for handling Cross-Origin Resource Sharing.
    *   `dotenv` for managing environment variables.
    *   `nodemon` for development auto-reloading.

## Getting Started

### Prerequisites

*   Node.js (v14 or later)
*   npm
*   A Supabase account (Optional, for database persistence)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sohamkoli29/apiforge-server.git
    cd apiforge-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables.

    ```env
    # The port the server will run on
    PORT=3001
    
    # The URL of the frontend application for CORS
    CORS_ORIGIN=http://localhost:3000
    
    # Optional: Supabase credentials for database persistence
    # If not provided, the server will operate in local mode
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
    ```

4.  **Run the server:**
    *   For production:
        ```bash
        npm start
        ```
    *   For development with auto-reloading:
        ```bash
        npm run dev
        ```

The server will be running on the port specified in your `.env` file (e.g., `http://localhost:3001`).

## API Endpoints

All endpoints are prefixed with `/api`.

### Health Check

*   `GET /api/health`
    *   Checks the server status and database connectivity.
    *   **Response:**
        ```json
        {
          "alive": true,
          "db": "connected"
        }
        ```

### Proxy

*   `POST /api/proxy`
    *   Forwards an API request to the specified URL.
    *   **Request Body:**
        ```json
        {
          "url": "https://api.example.com/data",
          "method": "GET",
          "headers": { "Authorization": "Bearer ..." },
          "body": { "key": "value" },
          "timeout": 30000
        }
        ```
    *   **Response:** The response from the target server, wrapped with metadata like status, duration, and size.

### History

*   `POST /api/history/save`
    *   Saves a request to the user's history.
    *   **Request Body:** Contains details of the API request and its response.

*   `GET /api/history/:userId`
    *   Retrieves the request history for a specific user.
    *   **URL Parameters:**
        *   `userId`: The unique identifier for the user.
    *   **Query Parameters:**
        *   `limit` (optional): The number of history items to retrieve (default: 50).

### Collections

*   `POST /api/collections`
    *   Creates a new collection for a user.
    *   **Request Body:**
        ```json
        {
          "userId": "user_id_123",
          "name": "My API Collection",
          "description": "Endpoints for my project",
          "color": "#FF5733"
        }
        ```
*   `GET /api/collections/:userId`
    *   Retrieves all collections for a specific user.
    *   **URL Parameters:**
        *   `userId`: The unique identifier for the user.

*   `POST /api/collections/:collectionId/items`
    *   Adds a new API request item to a specific collection.
    *   **URL Parameters:**
        *   `collectionId`: The ID of the collection.
    *   **Request Body:** The full details of the API request to be saved.
