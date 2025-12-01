# Live Streaming SaaS - Frontend

This is the frontend for the Live Streaming SaaS platform, built with uni-app, Vue 3, TypeScript, and Vite.

## Project Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd frontend_live
    ```
3.  Install dependencies:
    ```bash
    pnpm install
    ```

## Development

### Running the development server

-   **H5:**
    ```bash
    pnpm dev:h5
    ```
-   **WeChat Mini Program:**
    ```bash
    pnpm dev:mp-weixin
    ```

Open [HBuilderX](https://www.dcloud.io/hbuilderx.html) to run the application on a real device or simulator.

## Building for Production

-   **H5:**
    ```bash
    pnpm build:h5
    ```
-   **WeChat Mini Program:**
    ```bash
    pnpm build:mp-weixin
    ```

The production-ready files will be located in the `dist/` directory.

## Linting and Formatting

-   **Lint files:**
    ```bash
    pnpm lint
    ```
-   **Format files:**
    ```bash
    pnpm format
    ```

## Testing

-   **Run unit tests:**
    ```bash
    pnpm test
    ```

## Project Structure

```
frontend_live/
├── src/
│   ├── api/          # API request modules
│   ├── assets/       # Static assets (images, fonts, etc.)
│   ├── components/   # Reusable Vue components
│   ├── pages/        # Application pages
│   ├── store/        # Pinia state management
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── tests/            # Test files
└── ...               # Configuration files
```

## Contributing

Please follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. 