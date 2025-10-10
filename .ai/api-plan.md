# REST API Plan

## 1. Resources

-   **Flashcards**: Represents individual flashcards. Corresponds to the `flashcards` table.
-   **Generations**: Represents a single AI-powered flashcard generation job. Corresponds to the `generations` table.

## 2. Endpoints

### 2.1. Generations

#### Create AI Flashcard Generation Job

This endpoint initiates the AI generation process. It takes user-provided text, calls the AI service, and populates the `generations` and `flashcards` tables.

-   **Method**: `POST`
-   **URL**: `/api/generations`
-   **Description**: Creates a new generation job and associated flashcards proposals from a source text.
-   **Request Body**:
    ```json
    {
      "source_text": "The long text to generate flashcards proposals from...",
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
      "generation_id": 1,
      "flashcards_proposals": [
        {
          "front": "What is the capital of Poland?",
          "back": "Warsaw",
          "source": "ai-full"
        }
      ],
      "generated_count": 15
    }
    ```
-   **Success Codes**:
    -   `201 Created`: The generation job was successfully created and queued.
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., text length is outside the 1000-10000 character limit).
    -   `401 Unauthorized`: User is not authenticated.
    -   `500 Internal Server Error`: An unexpected error occurred during the generation process (logs recorded  in `generation_error_logs`).

#### Get a list of generations

-   **Method**: `GET`
-   **URL**: `/api/generations`
-   **Description**: Retrieves a paginated list of the user's generation jobs. Results are always scoped to the authenticated user via RLS.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): The page number for pagination.
    -   `limit` (number, optional, default: 20): The number of items per page.
    -   `sort` (e.g., `created_at`).
    -   `order` (`asc` or `desc`)
-   **Response Body (Success)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "model": "anthropic/claude-3-haiku",
          "generated_count": 15,
          "accepted_unedited_count": 10,
          "accepted_edited_count": 5,
          "source_text_hash": "a1b2c3...",
          "source_text_length": 5432,
          "generation_duration": 12345,
          "created_at": "2025-10-09T10:00:00Z",
          "updated_at": "2025-10-09T10:00:00Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "limit": 20,
        "total": 42
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: A list of generations is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

#### Get a single generation

-   **Method**: `GET`
-   **URL**: `/api/generations/:id`
-   **Description**: Retrieves a single generation job by its ID. The result is always scoped to the authenticated user via RLS.
-   **URL Parameters**:
    -   `id` (number, required): The ID of the generation job.
-   **Response Body (Success)**:
    ```json
    {
      "id": 1,
      "model": "anthropic/claude-3-haiku",
      "generated_count": 15,
      "accepted_unedited_count": 10,
      "accepted_edited_count": 5,
      "source_text_hash": "a1b2c3...",
      "source_text_length": 5432,
      "generation_duration": 12345,
      "created_at": "2025-10-09T10:00:00Z",
      "updated_at": "2025-10-09T10:00:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: The generation is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Generation not found or does not belong to the user.

#### Get a list of generation error logs

-   **Method**: `GET`
-   **URL**: `/api/generation-error-logs`
-   **Description**: Retrieves a paginated list of the user's generation error logs. Results are always scoped to the authenticated user via RLS.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): The page number for pagination.
    -   `limit` (number, optional, default: 20): The number of items per page.
    -   `sort` (e.g., `created_at`).
    -   `order` (`asc` or `desc`)
-   **Response Body (Success)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "model": "anthropic/claude-3-haiku",
          "source_text_hash": "a1b2c3...",
          "source_text_length": 5432,
          "error_message": "AI service timeout",
          "created_at": "2025-10-09T10:05:00Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "limit": 20,
        "total": 3
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: A list of error logs is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

#### Get a single generation error log

-   **Method**: `GET`
-   **URL**: `/api/generation-error-logs/:id`
-   **Description**: Retrieves a single generation error log by its ID. The result is always scoped to the authenticated user via RLS.
-   **URL Parameters**:
    -   `id` (number, required): The ID of the error log.
-   **Response Body (Success)**:
    ```json
    {
      "id": 1,
      "model": "anthropic/claude-3-haiku",
      "source_text_hash": "a1b2c3...",
      "source_text_length": 5432,
      "error_message": "AI service timeout",
      "created_at": "2025-10-09T10:05:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: The error log is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Error log not found or does not belong to the user.




### 2.2. Flashcards

#### Get a list of flashcards

-   **Method**: `GET`
-   **URL**: `/api/flashcards`
-   **Description**: Retrieves a paginated list of the user's flashcards. Can be filtered.
-   **Query Parameters**:
    -   `page` (number, optional, default: 1): The page number for pagination.
    -   `limit` (number, optional, default: 20): The number of items per page.
    -   `sort` (e.g., `created_at`).
    -   `order` (`asc` or `desc`)
    -   Optional filters (e.g., `source`, `generation_id`)
-   **Response Body (Success)**:
    ```json
    {
      "data": [
        {
          "id": 101,
          "generation_id": 1,
          "front": "What is the capital of Poland?",
          "back": "Warsaw",
          "source": "ai-full",
          "created_at": "2025-10-09T10:00:00Z",
          "updated_at": "2025-10-09T10:00:00Z"
        },
        {
          "id": 102,
          "generation_id": null,
          "front": "What is 2 + 2?",
          "back": "4",
          "source": "manual",
          "created_at": "2025-10-08T10:00:00Z",
          "updated_at": "2025-10-08T10:00:00Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "limit": 5,
        "total": 98
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: A list of flashcards is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

#### Get a single flashcard

-   **Method**: `GET`
-   **URL**: `/api/flashcards/{id}`
-   **Description**: Retrieves a single flashcard by its ID.
-   **Response Body (Success)**:
    ```json
    {
      "id": 101,
      "generation_id": 1,
      "front": "What is the capital of Poland?",
      "back": "Warsaw",
      "source": "ai-full",
      "created_at": "2025-10-09T10:00:00Z",
      "updated_at": "2025-10-09T10:00:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: The flashcard is returned.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: The flashcard with the specified ID does not exist or does not belong to the user.

#### Create flashcards (manual or AI, always bulk)

-   **Method**: `POST`
-   **URL**: `/api/flashcards`
-   **Description**: Creates one or more flashcards. Zawsze wysyłamy tablicę fiszek – nawet jeśli chcemy dodać tylko jedną, podajemy ją w tablicy.
-   **Request Body**:
    ```json
    [
      {
        "front": "What is the speed of light?",
        "back": "299,792,458 m/s",
        "source": "manual"
      },
      {
        "front": "What is the capital of France?",
        "back": "Paris",
        "source": "ai-full"
      }
    ]
    ```
    -   Jeśli chcesz dodać tylko jedną fiszkę, podaj ją w jednoelementowej tablicy:
    ```json
    [
      {
        "front": "What is the speed of light?",
        "back": "299,792,458 m/s",
        "source": "manual"
      }
    ]
    ```
    -   `source` może być `"manual"`, `"ai-full"`, lub `"ai-edited"`.

-   **Response Body (Success)**:
    ```json
    [
      {
        "id": 103,
        "generation_id": null,
        "front": "What is the speed of light?",
        "back": "299,792,458 m/s",
        "source": "manual",
        "created_at": "2025-10-09T11:00:00Z",
        "updated_at": "2025-10-09T11:00:00Z"
      },
      {
        "id": 104,
        "generation_id": null,
        "front": "What is the capital of France?",
        "back": "Paris",
        "source": "ai-full",
        "created_at": "2025-10-09T11:00:00Z",
        "updated_at": "2025-10-09T11:00:00Z"
      }
    ]
    ```
    -   Jeśli dodałeś tylko jedną fiszkę, odpowiedź to jednoelementowa tablica.

-   **Success Codes**:
    -   `201 Created`: The flashcard(s) were successfully created.
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (np. brakuje `front` lub `back`, są za długie, lub nieprawidłowy `source`).
    -   `401 Unauthorized`: User is not authenticated.

#### Update a flashcard

-   **Method**: `PUT`
-   **URL**: `/api/flashcards/{id}`
-   **Description**: Updates a flashcard. Used for both manual edits and editing AI-generated cards during review.
-   **Request Body**:
    ```json
    {
      "front": "An updated question?",
      "back": "An updated answer."
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
      "id": 101,
      "generation_id": 1,
      "front": "An updated question?",
      "back": "An updated answer.",
      "source": "ai-edited",
      "created_at": "2025-10-09T10:00:00Z",
      "updated_at": "2025-10-09T11:30:00Z"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: The flashcard was successfully updated.
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed.
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: The flashcard does not exist or does not belong to the user.

#### Delete a flashcard

-   **Method**: `DELETE`
-   **URL**: `/api/flashcards/{id}`
-   **Description**: Permanently deletes a flashcard.
-   **Response Body (Success)**: Empty
-   **Success Codes**:
    -   `204 No Content`: The flashcard was successfully deleted.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: The flashcard does not exist or does not belong to the user.

## 3. Authentication and Authorization

-   **Mechanism**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth.
-   **Implementation**:
    1.  The client application will use the Supabase Auth SDK for user registration, login, and token management.
    2.  The client will include the JWT in the `Authorization` header of every request to the API (e.g., `Authorization: Bearer <SUPABASE_JWT>`).
    3.  The API backend (e.g., Supabase Edge Functions) will verify the JWT.
    4.  All data access will be governed by PostgreSQL's Row Level Security (RLS) policies, which are already defined in the database schema. The policies ensure that queries are automatically scoped to the currently authenticated user (`auth.uid()`), preventing unauthorized data access.

## 4. Validation and Business Logic

-   **Validation**:
    -   **`POST /api/generations`**:
        -   `source_text`: Must be a string between 1000 and 10000 characters.
    -   **`POST /api/flashcards`**:
        -   `front`: Required, string, max 200 characters.
        -   `back`: Required, string, max 500 characters.
    -   **`PUT /api/flashcards/{id}`**:
        -   `front`: Optional, string, max 200 characters.
        -   `back`: Optional, string, max 500 characters.
        -   `source`: Must be one of `ai-edited` or `manual`

-   **Business Logic Implementation**:
    -   **`POST /api/generations`**: This endpoint encapsulates the core AI generation logic. It orchestrates the creation of `generations` and `flashcards` proposals records in a single transaction. If the AI service fails, it logs the error to the `generation_error_logs` table.
    -   **`POST /api/flashcards`**: The API will automatically set the `source` field to `'manual'`.
    -   **`PUT /api/flashcards/{id}`**: If the flashcard being updated has a source of `'ai-full'`, the API will automatically change the source to `'ai-edited'` upon successful update.
