# Redboost - Entrepreneurship & Coaching Ecosystem

Redboost is a comprehensive, production-ready three-tier enterprise application designed to manage an entrepreneurship ecosystem. It bridges entrepreneurs, coaches, and administrators through a secure REST API, a modern Angular SPA, and MySQL persistence.

## 🚀 Key Features

### 🏢 Backoffice & Management
- **Dashboard Ecosystem:** Global, Program-specific, and Sprint-level dashboards providing real-time KPIs and progress tracking.
- **Program Management:** Complete lifecycle management of incubation and acceleration programs.
- **Coach Management:** Workflow for becoming a coach, including request submissions and binome (pairing) management.
- **Entrepreneur Management:** Tracking of entrepreneur progress, engagement, and task activities.
- **Agile Tools:** Sprint and activity management with task tracking for program participants.
- **KPI System:** Dynamic management of categories and Key Performance Indicators.

### 🌐 Frontoffice & User Experience
- **Interactive Landing:** Market-facing presence with service showcases and contact points.
- **Redstarter Portal:** Integrated application system for new project candidatures.
- **Secure Auth:** JWT-based sign-in, sign-up, email verification, and password recovery.
- **Role-Based Profiles:** Tailored experiences for Admins, Coaches, Entrepreneurs, and Investors.

## 🛠 Tech Stack & Architecture

### Frontend (Angular)
- **Framework:** Angular 19 (using Sakai-NG/Argon templates)
- **UI:** PrimeNG, PrimeFlex, Tailwind CSS, and FontAwesome.
- **Data:** RxJS, Axios for API calls, and WebSockets (STOMP/SockJS) for real-time updates.

### Backend (Spring Boot - *Reference from Docs*)
- **Framework:** Spring Boot 3.4
- **Security:** JWT (JSON Web Token) with Stateless Role-Based Access Control.
- **Persistence:** MySQL 8 with Spring Data JPA (Hibernate).
- **API Docs:** Swagger/OpenAPI 3.0.

### Default Port Configuration
- **Frontend:** `http://localhost:4200`
- **Backend API:** `https://redboost.tn`
- **MySQL DB:** `3306`
- **Swagger UI:** `https://redboost.tn/swagger-ui/index.html`

## ⚙️ Getting Started

### Prerequisites
- **Node.js:** v18.x or higher
- **Angular CLI:** `npm install -g @angular/cli`
- **Java:** JDK 17+ (for backend)
- **MySQL:** v8.0+

### Database Setup
```sql
CREATE DATABASE redboost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'redboost_user'@'localhost' IDENTIFIED BY 'YourPassword!';
GRANT ALL PRIVILEGES ON redboost.* TO 'redboost_user'@'localhost';
FLUSH PRIVILEGES;
```

### Installation & Run
1. **Clone & Install Frontend:**
   ```bash
   cd Redboost_front
   npm install
   npm start
   ```

2. **Configure Backend (if applicable):**
   Update `src/main/resources/application.properties` with your MySQL credentials and a secure `jwt.secret`.

3. **Start Services:**
   Ensure your Spring Boot backend is running on port `8087` for full functionality.

## 📁 Project Structure & Architecture

The application is structured following a modular approach, separating concerns between the public-facing **Frontoffice**, the administrative **Backoffice**, and shared **Core** logic.

### 🏗 Component Organization
- **`src/app/pages/frontoffice/`**
  - `gestion_user/auth/`: Authentication workflows (Sign-in, Sign-up, Password Reset, Email Confirmation).
  - `landing/`: Interactive landing page with Market and Contact components.
  - `Verification/`: Privacy policies and legal verification pages.
- **`src/app/pages/backoffice/`**
  - `allUsers/`: Administrative user management and list views.
  - `become_coach/`: Request workflows for aspiring coaches and binome management.
  - `programmes/`: Lifecycle management for incubation programs, including Sprints, Activities, and specialized Dashboards.
  - `database_management/`: Dynamic template creation and data insertion utilities.
  - `candidature_redstarter/`: Management of startup applications.
- **`src/app/layout/`**
  - `component/`: Core application shell including `AppLayout`, `AppTopbar`, `AppSidebar`, and `AppMenu`.

### 📡 Services (Business Logic)
Services are strategically located to match their scope of use:
- **`src/app/pages/frontoffice/service/`**
  - `AuthService`: Manages JWT authentication, Firebase/Google integration, and token lifecycle.
  - `UserService`: Handles user-specific data and profile updates.
- **`src/app/pages/backoffice/service/`**
  - `kpiActivity.service.ts`: Business logic for program performance tracking.
  - `node.service.ts`: Helper service for hierarchical and tree-based data structures.
- **`src/app/layout/service/`**
  - `LayoutService`: Orchestrates UI state, menu visibility, and theme configurations.
- **`src/app/pages/services/`**
  - `NotificationWebsocketService`: Manages real-time notifications via STOMP/WebSockets.

### 📦 Models (Type Definitions)
TypeScript models ensure strict typing across the ecosystem:
- **`src/app/models/`**
  - `user.ts`: Defines user roles, permissions, and profile structure.
  - `Coach.model.ts`: Data structure for coach requests and expertise.
  - `programme.ts`: Hierarchical models for Programs, Sprints, and Tasks.
  - `entrepreneur.models.ts`: Metrics and profiles for startup founders.
  - `BackofficeCategory.ts`: Grouping and categorization logic for KPIs.

### 🎨 Assets & Styles
- **`src/assets/layout/`**: Foundational SCSS for layout architecture (Sakai/Argon based).
- **`src/assets/images/`**: UI assets, including brand assets and role-specific placeholders.
- **`src/styles.scss`**: Global entry for styles, integrating Tailwind CSS, PrimeNG themes, and custom Argon components.

## 🔐 Security Roles
The platform implements strict `RoleGuard` protection:
- **ADMIN:** System-wide configuration and user oversight.
- **COACH:** Mentorship tracking and request management.
- **ENTREPRENEUR:** Program participation and task submission.
- **INVESTOR:** Portfolio monitoring and ecosystem KPIs.

## 🚢 Deployment
- **Frontend:** `ng build --configuration production` (outputs to `dist/`)
- **Backend:** `mvn clean package` (generates executable JAR)

## 📝 License
This project is licensed under the terms specified in the `LICENSE.md` file.
