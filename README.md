# lesago

## Tech Stack

-   **Frontend:** Vite (Vanilla JavaScript)
-   **Backend:** Google Cloud Functions (Python)
-   **Database:** Google Firestore
-   **Authentication:** Firebase Authentication
-   **Hosting:** Firebase Hosting

## Prerequisites

Before you begin, you will need to install and configure the command-line tools for Google Cloud and Firebase.

1.  **Google Cloud CLI:** [Install `gcloud`](https://cloud.google.com/sdk/docs/install) and authenticate your account:
    ```bash
    gcloud auth login
    gcloud auth application-default login
    ```
Also configure project and billing. For the Google Authentication to work,
set up a `.env.local` file that has `VITE_FIREBASE_{API_KEY, AUTH_DOMAIN, and PROJECT_ID}`.  

2.  **Firebase CLI:** Install the tools globally via npm:
    ```bash
    npm install -g firebase-tools
    firebase login
    ```

## Local Development

### Frontend

The frontend is a Vite project.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
The site will be available at `http://localhost:5173` (or a similar port). The server supports hot-reloading.

## Deployment

### Backend (you can work on it locally, but the site is currently configured to a cloud backend)

The backend consists of Python Cloud Functions.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a Python virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```
3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **(VS Code Setup)** If you have Pylance import errors, remember to select the correct interpreter:
    -   Open the Command Palette (`Cmd+Shift+P`).
    -   Select `Python: Select Interpreter`.
    -   Choose the interpreter located at `./.venv/bin/python`.

### Backend Deployment

Deploy each function individually from the `backend` directory. Remember to use the correct region.

```bash
# Deploy secure functions (require authentication)
gcloud functions deploy addSubmission --gen2 --runtime=python311 --trigger-http --entry-point=addSubmission --region={REGION}
gcloud functions deploy getMySubmission --gen2 --runtime=python311 --trigger-http --entry-point=getMySubmission --region={REGION}
```

### Frontend Deployment

Run these commands from the `frontend` directory.

#### One-Time Setup

```bash
firebase init hosting
```

#### Regularly Deploying the Site

After the one-time setup, you can deploy the entire frontend with a single command from the `frontend` directory:

```bash
npm run deploy
```

This command builds the site and deploys it. This process prevents broken sites during upload and ensures users get the latest version without caching issues.
