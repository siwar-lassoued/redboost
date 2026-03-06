# Redboost Backend

## Overview

Redboost is a comprehensive backend application built with Spring Boot, designed to manage project lifecycles, team collaboration, and performance tracking. It provides a robust API for managing tasks, sprints, events, and programs, integrated with various external services for document management, notifications, and AI-powered features.

## Technologies Stack

*   **Language:** Java 17
*   **Framework:** Spring Boot 3.4.2
*   **Build Tool:** Maven
*   **Database:** MySQL (Production), H2 (Dev/Test)
*   **ORM:** Spring Data JPA
*   **Security:** Spring Security, JWT, OAuth2 Client
*   **API Documentation:** SpringDoc OpenAPI (Swagger UI)
*   **Real-time:** Spring WebSocket, STOMP

### External Integrations & Libraries
*   **Storage & Media:** AWS S3, Cloudinary
*   **Google Services:** Firebase Admin (Notifications), Google Drive API, Google Calendar API, Gmail API
*   **Document Processing:** Apache POI (Excel/Word), OpenPDF, Apache Tika, PDFBox
*   **AI & OCR:** Tess4J (Tesseract OCR), OpenCV
*   **Utilities:** Lombok, MapStruct, Jackson

## Key Features

*   **User & Role Management:** Secure authentication and authorization system.
*   **Project Management:**
    *   **Sprints & Tasks:** Manage agile workflows with sprints and detailed task tracking (`Tache`, `Sprint`).
    *   **Activities & Programs:** Organize work into broader activities and programs (`Activite`, `Programme`).
*   **Event Management:** Schedule and manage events with calendar integration.
*   **KPI & Performance:** Track key performance indicators for tasks, activities, and back-office operations (`BackofficeKpi`, `TacheKpi`, `ActiviteKpi`).
*   **Document Management:**
    *   Upload and manage documents linked to tasks and activities.
    *   OCR capabilities for extracting text from images/PDFs.
    *   PDF and Office document generation/processing.
*   **Communication:**
    *   Real-time notifications via WebSockets and Firebase.
    *   Email integration.

## API Documentation & Controllers

The application exposes a RESTful API organized into several controllers, each responsible for a specific domain of the application.

### Authentication & User Management

*   **`AuthController`** (`/api/Auth`)
    *   **Functionality:** Handles user authentication and registration.
    *   **Key Methods:**
        *   `login`: Authenticates users via email/password and issues JWT access and refresh tokens.
        *   `firebaseLogin`: Authenticates users via Firebase ID tokens.
        *   `register`: Registers new users and sends confirmation emails.
        *   `refresh`: Refreshes expired access tokens using a valid refresh token.
        *   `confirm-email`: Verifies user email addresses via confirmation codes.
        *   `forgot-password` / `reset-password`: Handles password recovery flows.

*   **`UserController`** (`/api/users`)
    *   **Functionality:** Manages user profiles and administrative user operations.
    *   **Key Methods:**
        *   `getLoggedInUserProfile`: Retrieves the profile of the currently authenticated user.
        *   `updateUserProfile`: Updates user profile details.
        *   `addUser`: Admin endpoint to create new users (Admins, Employees, etc.).
        *   `addEntrepreneur` / `updateEntrepreneur`: Specialized endpoints for managing Entrepreneur users and their program associations.
        *   `importEntrepreneurs`: Imports entrepreneur data from Excel files.
        *   `uploadImage`: Uploads and updates user profile pictures.

### Project & Program Management

*   **`ProgrammeController`** (`/api/backoffice/programmes`)
    *   **Functionality:** Central controller for managing Programmes and their hierarchy (Sprints, Activities, Tasks).
    *   **Key Methods:**
        *   **Programmes:** CRUD operations for `Programme` entities.
        *   **Sprints:** Manage sprints within a programme (`createSprint`, `getSprints`).
        *   **Activities & Tasks:** Create and manage activities and tasks linked to sprints (`createActivity`, `createTache`).
        *   **KPIs:** Manage KPIs associated with programmes (`ajouterKpiOptionnel`, `retirerKpi`).
        *   **Documents:** Upload and retrieve documents for sprints, activities, and tasks.
        *   **Dashboard:** Provides global dashboard data (`getDashboardGlobal`).

*   **`ProgrammeDashboardController`** (`/api/backoffice/programmes/{programmeId}/dashboard`)
    *   **Functionality:** Provides analytical data for programme dashboards.
    *   **Key Methods:**
        *   `getTaskRealizationByCategory`: Returns task completion stats grouped by KPI category.
        *   `getGlobalKpiPerformance`: Returns performance metrics for global KPIs.
        *   `getKpiDistributionByCategory`: Shows how KPIs are distributed across categories.
        *   `getKpiEvolutionByCategory`: Tracks KPI performance over time.

*   **`ProgrammeKpiController`** (`/api/programmeskpi`)
    *   **Functionality:** Manages specific KPI values and history.
    *   **Key Methods:**
        *   `updateKpiValues`: Updates global KPI values (target, current).
        *   `updateEntrepreneurValue`: Updates KPI values for a specific entrepreneur.
        *   `getKpiHistory`: Retrieves the history of changes for a KPI.

*   **`BackofficeCategoryController`** (`/api/backoffice/categories`)
    *   **Functionality:** Manages categories for organizing Backoffice KPIs.
    *   **Key Methods:** CRUD operations for KPI categories and assigning KPIs to them.

### Event Management

*   **`EventController`** (`/api/events`)
    *   **Functionality:** Manages calendar events.
    *   **Key Methods:**
        *   `createEvent`: Schedules a new event.
        *   `getEventsByMonth`: Retrieves events for a specific month/year.
        *   `getEventsByParticipant`: Finds events where a specific user is a participant.
        *   `cancelEvent`: Cancels an existing event.

### Reporting & Documents

*   **`RapportController`** (`/api/rapports`)
    *   **Functionality:** Manages reports, objectives, and results.
    *   **Key Methods:**
        *   `createRapport` / `updateRapport`: Manages the lifecycle of reports.
        *   `addObjectifGlobal` / `addObjectifSpecifique`: Manages the hierarchy of objectives within a report.
        *   `exportRapportPdf`: Generates a PDF version of the report.
        *   `shareRapportOnDrive`: Generates a DOCX report and uploads it to Google Drive.

*   **`FileController`** (`/api/files`)
    *   **Functionality:** Serves uploaded files.
    *   **Key Methods:** Downloads documents for sprints, activities, and tasks.

*   **`ImportExportController`** (`/api/templates/{templateId}`)
    *   **Functionality:** Handles data import/export for templates.
    *   **Key Methods:**
        *   `importExcel` / `importCSV`: Imports data into a template from files.
        *   `export`: Exports template data to CSV or Excel.

### Templates & AI

*   **`TemplateController`** (`/api/templates`)
    *   **Functionality:** Manages custom templates for data collection.
    *   **Key Methods:** CRUD operations for templates.

*   **`TemplateDataController`** (`/api/templates/{templateId}/data`)
    *   **Functionality:** Manages the actual data rows within a template.
    *   **Key Methods:** Add, update, delete, and retrieve data rows.

*   **`AIWritingController`** (`/api/ai/writing`)
    *   **Functionality:** Provides AI-powered text assistance.
    *   **Key Methods:**
        *   `check`: Grammar and spelling check.
        *   `improve`: Improves text style.
        *   `rephrase`: Rephrases text with a specific tone.
        *   `generate`: Generates content based on context.

### Miscellaneous

*   **`NotificationController`** (`/api/notifications`)
    *   **Functionality:** Manages user notifications.
    *   **Key Methods:** Fetch unread notifications, mark as read, delete notifications.

*   **`CandidatureRedstarterController`** (`/api/candidatures`)
    *   **Functionality:** Manages applications for the Redstarter program.
    *   **Key Methods:**
        *   `submitCandidature`: Handles public submission of candidatures with attachments.
        *   `getAllCandidatures`: Admin view of all applications.
        *   `updateCandidatureStatut`: Updates the status (Accepted, Refused, etc.) of an application.

*   **`TypeFormationController`** (`/api/type-formation`)
    *   **Functionality:** Manages types of training/formations.
    *   **Key Methods:** CRUD operations for formation types.

## Getting Started

### Prerequisites

*   Java Development Kit (JDK) 17
*   Maven 3.8+
*   MySQL Server
*   Google Cloud Service Account credentials (for Firebase/Drive/Calendar)
*   AWS Account (for S3)
*   Cloudinary Account

### Configuration

1.  **Database:**
    Ensure MySQL is running and create a database (e.g., `redboost_db`). Update `src/main/resources/application.properties` (or `.yml`) with your credentials.

2.  **Environment Variables / Properties:**
    Configure the following keys in your application properties:
    *   **Database:** `spring.datasource.url`, `spring.datasource.username`, `spring.datasource.password`
    *   **JWT:** `jwt.secret`, `jwt.expiration`
    *   **AWS S3:** `cloud.aws.credentials.access-key`, `cloud.aws.credentials.secret-key`, `cloud.aws.region.static`, `cloud.aws.s3.bucket`
    *   **Google/Firebase:** Path to your `firebase-service-account.json` and Google credentials.
    *   **Cloudinary:** `cloudinary.cloud_name`, `cloudinary.api_key`, `cloudinary.api_secret`
    *   **Mail:** `spring.mail.host`, `spring.mail.username`, `spring.mail.password`

3.  **Google Credentials:**
    Place your `firebase-service-account.json` in `src/main/resources/` or configure the path accordingly.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Redboost_expert-main/DreamTeam
    ```

2.  **Build the project:**
    ```bash
    mvn clean install
    ```

3.  **Run the application:**
    ```bash
    mvn spring-boot:run
    ```
    Or run the main class: `team.project.redboost.RedboostApplication`

## API Documentation

Once the application is running, you can access the Swagger UI documentation at:

```
http://localhost:8080/swagger-ui.html
```
(Port may vary based on your configuration, default is 8080)

## Project Structure

*   `src/main/java/team/project/redboost`
    *   `config`: Configuration classes (Security, Swagger, WebSocket, etc.)
    *   `controllers`: REST API endpoints
    *   `dto`: Data Transfer Objects
    *   `entities`: JPA Entities (Database models)
    *   `repositories`: Spring Data Repositories
    *   `services`: Business logic
    *   `exception`: Global exception handling

## License

[Add License Information Here]
