<!-- omit in toc -->
# AI Flashcard Generator

<!-- omit in toc -->
## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
  - [Included in MVP](#included-in-mvp)
  - [Excluded from MVP](#excluded-from-mvp)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Flashcard Generator is a web application designed to streamline the learning process by automating the creation of educational flashcards using artificial intelligence. Users can paste any text, and the application will generate a set of flashcards, which can then be reviewed, edited, and used for studying.

The primary goal of this project is to solve the time-consuming and laborious problem of manually creating high-quality flashcards. By automating this process, the application makes effective study methods like spaced repetition more accessible, allowing learners to focus on studying rather than material preparation. The Minimum Viable Product (MVP) is specifically targeted at language learners.

## Tech Stack

The project is built with a modern, scalable, and efficient technology stack:

-   **Frontend**:
    -   **Framework**: [Astro 5](https://astro.build/) for fast, content-focused websites.
    -   **UI Components**: [React 19](https://react.dev/) for interactive elements.
    -   **Language**: [TypeScript 5](https://www.typescriptlang.org/) for static typing.
    -   **Styling**: [Tailwind 4](https://tailwindcss.com/) for utility-first CSS.
    -   **Component Library**: [Shadcn/ui](https://ui.shadcn.com/) for accessible and reusable components.
-   **Backend**:
    -   **Platform**: [Supabase](https://supabase.com/) as a comprehensive Backend-as-a-Service (BaaS) solution, providing:
        -   PostgreSQL Database
        -   Authentication
        -   Storage and APIs
-   **AI Services**:
    -   **Provider**: [OpenRouter.ai](https://openrouter.ai/) for access to a wide variety of AI models (from OpenAI, Anthropic, Google, etc.).
-   **DevOps**:
    -   **CI/CD**: [GitHub Actions](https://github.com/features/actions) for automated build and deployment pipelines.
    -   **Hosting**: [CloudFlare](https://www.cloudflare.com//) via Docker images.

## Getting Started Locally

To run the project on your local machine, follow these steps.

### Prerequisites

-   Node.js version `22.14.0` or higher. We recommend using a version manager like [nvm](https://github.com/nvm-sh/nvm).
    ```sh
    nvm use
    ```
-   A package manager like `npm`.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/r0sari0/10xdevs-project.git
    cd ai-flashcard-generator
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```

    You will need to add your API keys and configuration details for Supabase and OpenRouter to this file.
    
    Required environment variables:
    ```env
    # Supabase Configuration
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    
    # OpenRouter AI Configuration
    OPENROUTER_API_KEY=sk-or-v1-your_api_key_here
    
    # Optional
    ASTRO_SITE_URL=http://localhost:4321
    ```
    
    **Getting API Keys:**
    - **Supabase**: Sign up at [supabase.com](https://supabase.com) and create a new project
    - **OpenRouter**: Sign up at [openrouter.ai](https://openrouter.ai) and generate an API key from your dashboard

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Architecture

### AI Service Integration

The application uses a layered architecture for AI-powered flashcard generation:

```
Client → API Endpoint → Generation Service → OpenRouter Service → OpenRouter API
```

- **OpenRouter Service** (`src/lib/services/openrouter.service.ts`): Low-level service for making structured API calls to OpenRouter with Zod schema validation
- **Generation Service** (`src/lib/services/generation.service.ts`): High-level service that orchestrates flashcard generation, database operations, and error logging
- **API Endpoints** (`src/pages/api/`): Astro API routes that handle HTTP requests and responses

For detailed documentation about the AI services, see [`.ai/openrouter-service-documentation.md`](.ai/openrouter-service-documentation.md).

## Available Scripts

This project includes the following scripts defined in `package.json`:

| Script         | Description                                        |
| -------------- | -------------------------------------------------- |
| `npm run dev`    | Starts the development server with hot-reloading.  |
| `npm run build`  | Builds the application for production.             |
| `npm run preview`| Serves the production build locally for previewing.|
| `npm run lint`   | Lints the codebase for errors and style issues.    |
| `npm run lint:fix`| Lints and automatically fixes fixable issues.    |
| `npm run format` | Formats the code using Prettier.                   |

## Project Scope

### Included in MVP

-   **User Authentication**: Secure user registration and login (email/password), including a password reset feature.
-   **AI-Powered Flashcard Generation**: Users can paste text (1,000-10,000 characters) to automatically generate flashcards.
-   **Flashcard Management**:
    -   Review, accept, edit, or reject AI-generated cards.
    -   Manually create, view, edit, and delete flashcards.
-   **Learning Mode**: A study session interface integrated with a third-party open-source spaced repetition library.

### Excluded from MVP

-   A custom-built, advanced spaced repetition algorithm.
-   Importing content from files (e.g., PDF, DOCX).
-   Social features, such as sharing flashcard decks.
-   Grouping flashcards into thematic decks or sets.
-   Dedicated native mobile applications (iOS/Android).

## Project Status

**In Development**

This project is currently in the Minimum Viable Product (MVP) development phase. Core features are being actively built and refined.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
