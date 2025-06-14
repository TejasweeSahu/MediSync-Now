# MediSync Now - Streamlined Healthcare Management

This is a Next.js application built with Firebase Studio, designed to simulate a healthcare management system. It features a doctor's dashboard for patient and prescription management, and a front-desk system for appointment booking using voice input and AI-powered transcript parsing.

## Technologies Used

- **Frontend:**
  - [Next.js](https://nextjs.org/) (App Router)
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [ShadCN UI](https://ui.shadcn.com/) (Component Library)
  - [Tailwind CSS](https://tailwindcss.com/) (Styling)
- **Backend & AI:**
  - [Firebase](https://firebase.google.com/) (Authentication, Firestore Database)
  - [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) (AI Integration, LLM Flows)
    - Google AI (e.g., Gemini models) for AI tasks.
- **State Management:** React Context API
- **Forms:** React Hook Form with Zod for validation

## Project Setup

1.  **Clone the Repository (if applicable):**
    If you're working outside Firebase Studio, clone the repository.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```
    Or if you use `yarn`:
    ```bash
    yarn install
    ```

3.  **Firebase Project Setup:**
    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Add a Web app to your Firebase project.
    *   Copy the Firebase configuration object (apiKey, authDomain, etc.) from your project settings.
    *   Update `src/lib/firebase.ts` with your actual Firebase project configuration values.
    *   **Enable Firestore:** In your Firebase project, go to Firestore Database and create a database. Start in **test mode** or **production mode**.
    *   **Enable Authentication:** In your Firebase project, go to Authentication, click "Get started", and enable the "Email/Password" sign-in provider.

4.  **Firestore Security Rules (Crucial for Development):**
    For the application to function correctly during development (especially for seeding data and initial operations), you'll need to set permissive Firestore security rules.
    Navigate to **Firestore Database > Rules** in your Firebase console and paste the following:
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow all reads and writes to all documents
        // WARNING: This is for development only. Secure your rules before production.
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```
    **Publish** these rules. Remember to secure these rules before deploying to production!

5.  **Environment Variables (for Genkit/AI):**
    *   Create a `.env` file in the root of your project.
    *   If your Genkit flows use models that require API keys (like Google AI Studio API keys for Gemini), add them here. For example:
        ```
        GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
        ```
    *   Genkit is configured in `src/ai/genkit.ts` and flows are in `src/ai/flows/`.

## Running the Application

1.  **Start the Next.js Development Server:**
    ```bash
    npm run dev
    ```
    This usually starts the app on `http://localhost:9002` (as configured in `package.json`).

2.  **Start the Genkit Development Server (in a separate terminal):**
    For AI functionalities to work, you need to run the Genkit development server.
    ```bash
    npm run genkit:dev
    ```
    Or for auto-reloading on changes to AI files:
    ```bash
    npm run genkit:watch
    ```
    Genkit typically starts on `http://localhost:3400` by default.

## Key Features

*   **User Roles:**
    *   **Doctor Portal:** Authenticated access for doctors.
    *   **Front Desk:** Publicly accessible appointment booking system.
*   **Doctor Dashboard (`/dashboard`):**
    *   View and manage patient records.
    *   AI-powered prescription suggestion and generation.
    *   View upcoming appointments.
    *   Edit patient details.
    *   Sort and search patient list.
*   **Front Desk (`/front-desk`):**
    *   Book appointments using voice input or manual form filling.
    *   AI-powered parsing of voice transcripts to pre-fill appointment details (patient name, age, symptoms, preferred doctor, date/time).
*   **Authentication:**
    *   Email/Password login for doctors using Firebase Auth.
    *   Password reset functionality.
*   **Data Management:**
    *   Patient and appointment data stored in Firestore.
    *   Initial patient data seeding if the database is empty.

## AI-Powered Features (using Genkit)

*   **Prescription Suggestion (`src/ai/flows/suggest-prescription.ts`):**
    Takes patient symptoms, diagnosis, history, and doctor preferences to suggest medications, dosage, general instructions, and follow-up.
*   **Appointment Transcript Parsing (`src/ai/flows/parse-appointment-transcript-flow.ts`):**
    Processes raw voice transcripts from the front desk to extract key appointment details like patient name, age, symptoms, desired doctor, and appointment date/time.
*   **Doctor Shift Summary (`src/ai/flows/doctor-summary.ts`):**
    (Example flow) Analyzes patient records for a doctor's shift to provide a summary including patient count, common ailments, and frequent medications.

## Available Pages & Functionality

*   **`/` (Homepage):** Landing page with options to navigate to the Front Desk or Doctor Login.
*   **`/login`:** Doctor login page.
    *   Default login for demonstration:
        *   Email: `alisha.mehta@medisync.now`
        *   Password: `password1`
*   **`/dashboard`:** (Protected Route) Doctor's main workspace.
    *   Displays upcoming appointments.
    *   Allows generating/editing prescriptions for selected patients.
    *   Lists all patients, with options to edit their records or view prior prescriptions.
*   **`/front-desk`:** Appointment booking system.
    *   Supports voice input for booking.
    *   Manual form filling is also available.

## Important Notes

*   **Firestore Security:** The default Firestore rules provided are for development convenience. **Always secure your database with appropriate rules before deploying to a production environment.**
*   **Mock Data:** The application uses mock doctor data (`src/data/mockData.ts`) and can seed initial patient data into Firestore.
*   **AI Model Configuration:** AI features rely on Genkit and configured models (e.g., Gemini). Ensure your `.env` file is set up if API keys are required for the chosen models. The default Genkit model is specified in `src/ai/genkit.ts`.

This README should provide a good overview for anyone looking to understand, run, or contribute to the project.
