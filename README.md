<div align="center">

# 🚀 Redboost Platform

**A comprehensive entrepreneurship & coaching ecosystem**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.io)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE.md)
[![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)]()

Redboost bridges **entrepreneurs**, **coaches**, and **administrators** through a secure REST API, a modern Angular SPA, and MySQL persistence — managing the full lifecycle of incubation and acceleration programs.

[📡 API Docs](#-api-documentation) · [🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#-architecture) · [⚙️ Configuration](#-configuration)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Security & Roles](#-security--roles)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

Redboost is a production-ready, three-tier enterprise platform designed to manage an entrepreneurship ecosystem end-to-end:

- **Backoffice** — Program lifecycle, KPI tracking, sprint/task management, dashboards
- **Frontoffice** — Public landing, Redstarter candidature portal, role-based user experiences
- **Integrations** — Firebase notifications, Google Drive/Calendar/Gmail, AWS S3, Cloudinary, AI/OCR tools

---

## ✨ Key Features

### 🏢 Backoffice & Management
- **Multi-level Dashboards** — Global, program-specific, and sprint-level dashboards with real-time KPIs
- **Program Management** — Full lifecycle management of incubation and acceleration programs
- **Agile Tools** — Sprint and activity management with detailed task tracking (`Tache`, `Sprint`, `Activite`)
- **KPI System** — Dynamic categories and Key Performance Indicators with historical tracking
- **Coach Management** — Request workflows, binome (pairing) management, coach onboarding
- **Entrepreneur Management** — Progress tracking, task activities, Excel import

### 🌐 Frontoffice & User Experience
- **Interactive Landing** — Market-facing presence with service showcases and contact forms
- **Redstarter Portal** — Integrated application system for new startup candidatures
- **Secure Auth** — JWT sign-in/up, Firebase auth, email verification, password recovery
- **Role-Based Profiles** — Tailored experiences for Admins, Coaches, Entrepreneurs, and Investors

### 🔌 Integrations
- **Document Processing** — PDF/Word generation, OCR (Tesseract), Apache POI Excel
- **Cloud Storage** — AWS S3 and Cloudinary for file management
- **Google Workspace** — Drive upload, Calendar events, Gmail API
- **Real-time** — Firebase push notifications + WebSocket/STOMP live updates
- **AI Writing** — Grammar check, style improvement, rephrasing, content generation

---

## 🛠 Tech Stack

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Java | 17 |
| Framework | Spring Boot | 3.4.2 |
| Build | Maven | 3.8+ |
| Database | MySQL (prod) / H2 (dev) | 8.0 / in-memory |
| ORM | Spring Data JPA (Hibernate) | — |
| Security | Spring Security + JWT + OAuth2 | — |
| Real-time | Spring WebSocket + STOMP | — |
| API Docs | SpringDoc OpenAPI (Swagger UI) | 2.7.0 |

### Backend External Libraries
| Purpose | Library |
|---------|---------|
| Storage | AWS S3 SDK, Cloudinary |
| Google Services | Firebase Admin, Drive API, Calendar API, Gmail API |
| Documents | Apache POI, OpenPDF, Apache Tika, PDFBox |
| AI / OCR | Tess4J (Tesseract), OpenCV |
| Utilities | Lombok, Jackson |

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Angular | 19 |
| UI Library | PrimeNG + PrimeFlex | — |
| Styling | Tailwind CSS + SCSS (Sakai/Argon) | — |
| Icons | FontAwesome | — |
| Reactive | RxJS | — |
| HTTP | HttpClient + Axios | — |
| Real-time | STOMP / SockJS | — |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                            │
│   Angular 19 SPA  ·  PrimeNG  ·  Tailwind  ·  RxJS              │
│   :4200                                                          │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTP/REST + WebSocket (STOMP)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT API  :8087                         │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ Controllers │→ │  Services   │→ │      Repositories (JPA)  │ │
│  │  REST / WS  │  │  Business   │  │  Spring Data + Hibernate │ │
│  └─────────────┘  │   Logic     │  └──────────────────────────┘ │
│                   └──────┬──────┘                                │
│  ┌────────────────┐      │        ┌─────────────────────────┐   │
│  │ Security Layer │      │        │    External Services     │   │
│  │ JWT · OAuth2   │      │        │  AWS S3 · Firebase       │   │
│  │ Spring Sec 6   │      │        │  Google APIs · Cloudinary│   │
│  └────────────────┘      │        └─────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────────┘
                           │ JDBC / JPA
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     MySQL 8  :3306                               │
│  Users · Programmes · Sprints · Tasks · KPIs · Events · Docs     │
└──────────────────────────────────────────────────────────────────┘
```

### Port Reference
| Service | URL |
|---------|-----|
| Angular Frontend | http://localhost:4200 |
| Spring Boot API | http://localhost:8087 |
| Swagger UI | http://localhost:8087/swagger-ui/index.html |
| MySQL | localhost:3306 |

---

## 📁 Project Structure

### Backend — `DreamTeam/`
```
src/main/java/team/project/redboost/
├── config/              # Security, Swagger, WebSocket, CORS, Bean configs
├── controllers/         # REST API endpoints (see API section below)
├── dto/                 # Data Transfer Objects (Request/Response)
├── entities/            # JPA Entities (@Entity — DB models)
├── repositories/        # Spring Data JPA Repositories
├── services/            # Business logic layer
└── exception/           # Global exception handling (@ControllerAdvice)

src/main/resources/
├── application.properties          # Main config
├── application-dev.properties      # Dev overrides
├── application-prod.properties     # Prod overrides
└── firebase-service-account.json   # Google/Firebase credentials
```

### Frontend — `Redboost_front/`
```
src/app/
├── pages/
│   ├── frontoffice/
│   │   ├── gestion_user/auth/   # Sign-in, Sign-up, Password Reset, Email Confirm
│   │   ├── landing/             # Landing page, Market, Contact
│   │   ├── Verification/        # Privacy, legal pages
│   │   └── service/
│   │       ├── AuthService      # JWT auth, Firebase/Google, token lifecycle
│   │       └── UserService      # User data & profile
│   ├── backoffice/
│   │   ├── allUsers/            # Admin user management
│   │   ├── become_coach/        # Coach request workflows, binome management
│   │   ├── programmes/          # Programs, Sprints, Activities, Dashboards
│   │   ├── database_management/ # Dynamic templates & data entry
│   │   ├── candidature_redstarter/ # Startup application management
│   │   └── service/
│   │       ├── kpiActivity.service.ts  # Program performance tracking
│   │       └── node.service.ts         # Hierarchical/tree data helpers
│   └── services/
│       └── NotificationWebsocketService  # Real-time STOMP notifications
├── layout/
│   ├── component/               # AppLayout, AppTopbar, AppSidebar, AppMenu
│   └── service/LayoutService    # UI state, menu, theme config
├── models/                      # TypeScript interfaces & types
│   ├── user.ts                  # Roles, permissions, profile
│   ├── Coach.model.ts           # Coach requests & expertise
│   ├── programme.ts             # Programs, Sprints, Tasks hierarchy
│   ├── entrepreneur.models.ts   # Startup founder metrics & profiles
│   └── BackofficeCategory.ts    # KPI grouping/categorization
└── assets/
    ├── layout/                  # Foundation SCSS (Sakai/Argon)
    ├── images/                  # Brand assets, role placeholders
    └── styles.scss              # Global: Tailwind + PrimeNG + custom
```

---

## ⚡ Quick Start

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Java JDK | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -version` |
| Node.js | 18+ | `node -v` |
| Angular CLI | 17+ | `ng version` |
| MySQL | 8.0+ | `mysql --version` |
| Git | 2.x | `git --version` |

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Redboost_expert-main
```

### 2. Database Setup
```sql
mysql -u root -p

CREATE DATABASE redboost CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'redboost_user'@'localhost' IDENTIFIED BY 'YourSecurePassword!';
GRANT ALL PRIVILEGES ON redboost.* TO 'redboost_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure the Backend
Edit `DreamTeam/src/main/resources/application.properties`:
```properties
server.port=8087

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/redboost
spring.datasource.username=redboost_user
spring.datasource.password=YourSecurePassword!
spring.jpa.hibernate.ddl-auto=update

# JWT
jwt.secret=your-very-secure-secret-key-minimum-256-bits
jwt.expiration=86400000

# Cloudinary
cloudinary.cloud_name=your_cloud_name
cloudinary.api_key=your_api_key
cloudinary.api_secret=your_api_secret

# AWS S3
cloud.aws.credentials.access-key=YOUR_ACCESS_KEY
cloud.aws.credentials.secret-key=YOUR_SECRET_KEY
cloud.aws.region.static=eu-west-1
cloud.aws.s3.bucket=your-bucket-name

# Mail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

> ⚠️ **Security:** Never commit real credentials to version control. Use environment variables in production.

### 4. Add Google / Firebase Credentials
Place `firebase-service-account.json` in:
```
DreamTeam/src/main/resources/firebase-service-account.json
```

### 5. Run the Backend
```bash
cd DreamTeam
mvn clean install
mvn spring-boot:run
```
✅ Verify: `http://localhost:8087/swagger-ui/index.html`

### 6. Run the Frontend
```bash
cd Redboost_front
npm install
npm start
```
✅ App opens at: `http://localhost:4200`

---

## ⚙️ Configuration

### Full Properties Reference

| Property | Description | Example |
|----------|-------------|---------|
| `server.port` | Backend listening port | `8087` |
| `spring.datasource.url` | JDBC connection string | `jdbc:mysql://localhost:3306/redboost` |
| `spring.datasource.username` | DB username | `redboost_user` |
| `spring.datasource.password` | DB password | `[ENV VARIABLE]` |
| `spring.jpa.hibernate.ddl-auto` | Schema strategy | `update` (dev) / `validate` (prod) |
| `jwt.secret` | JWT signing key (256-bit min) | `[ENV VARIABLE]` |
| `jwt.expiration` | Token TTL in milliseconds | `86400000` (24h) |
| `cloud.aws.s3.bucket` | AWS S3 bucket name | `redboost-files` |
| `cloudinary.cloud_name` | Cloudinary account name | `your_cloud` |
| `spring.mail.host` | SMTP server | `smtp.gmail.com` |
| `springdoc.swagger-ui.enabled` | Enable Swagger UI | `true` (dev) / `false` (prod) |

### Frontend Environment (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8087',
  wsUrl: 'ws://localhost:8087/ws',
};
```

---

## 📡 API Documentation

### Interactive Docs
Once the backend is running, visit:
```
http://localhost:8087/swagger-ui/index.html
```
Swagger UI is auto-generated from your code — every endpoint, request body, and response schema is documented interactively.

> 💡 Swagger is powered by `springdoc-openapi 2.7.0`. Use this version with Spring Boot 3.4.x (earlier versions cause a `NoSuchMethodError` crash).


### Public Endpoints (no auth required)
```
/api/Auth/**
/api/candidatures/**
/api/coach/submit
/api/coach/binome
/api/projets/GetAllPublic
/api/contact
/api/files/**
/v3/api-docs/**
/swagger-ui/**
/ws/**
```

---

## 🚢 Deployment

### Build for Production

**Backend:**
```bash
cd DreamTeam
mvn clean package -DskipTests
# Output: target/redboost-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
cd Redboost_front
ng build --configuration production
# Output: dist/redboost/
```

### Run JAR in Production
```bash
java -jar target/redboost-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --spring.datasource.password=$DB_PASSWORD \
  --jwt.secret=$JWT_SECRET \
  --cloud.aws.credentials.access-key=$AWS_KEY \
  --cloud.aws.credentials.secret-key=$AWS_SECRET
```

### Production Checklist
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate`
- [ ] Set `springdoc.swagger-ui.enabled=false`
- [ ] Enable HTTPS with a valid SSL certificate
- [ ] Restrict CORS origins to your production domain
- [ ] Set `environment.production = true` in Angular
- [ ] Set up automated MySQL backups
- [ ] Configure log rotation and centralized logging
- [ ] Enable Spring Boot Actuator health monitoring

### Nginx Reverse Proxy (Sample)
```nginx
server {
    listen 80;
    server_name redboost.tn;

    location / {
        root /var/www/redboost;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8087;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8087;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Swagger 500 on `/v3/api-docs` | springdoc version mismatch | Use `springdoc 2.7.0` with Spring Boot 3.4.x |
| `NoSuchMethodError: ControllerAdviceBean` | Same as above | Downgrade to `2.7.0` |
| CORS error in browser | Origin not whitelisted | Add your origin to `corsConfigurationSource()` in `SecurityConfig` |
| 401 on every request | Token not sent or expired | Check `JwtRequestFilter` and Angular JWT interceptor |
| Cannot connect to MySQL | Wrong credentials / DB stopped | Run `sudo systemctl status mysql` and check properties |
| `ng serve` fails | Node/Angular version mismatch | Delete `node_modules`, run `npm install` |
| Port 8087 already in use | Another process | `lsof -i:8087`, kill it or change `server.port` |
| Firebase auth fails | Missing credentials file | Place `firebase-service-account.json` in `src/main/resources/` |
| WebSocket disconnects | STOMP endpoint not whitelisted | Ensure `/ws/**` is in `permitAll()` in SecurityConfig |

---

## 👥 Contributing

1. Create a branch: `git checkout -b feature/TICKET-short-description`
2. Follow coding standards: zero business logic in controllers, always use DTOs, unit test services
3. Commit format: `type(scope): description`
   ```
   feat(auth): add Firebase token refresh
   fix(kpi): correct entrepreneur value calculation
   docs(api): update programme endpoint reference
   ```
4. Open a Pull Request to `develop`

---

## 📝 License

This project is licensed under the terms specified in the [`LICENSE.md`](LICENSE.md) file.

---

<div align="center">

**Built with Spring Boot · Angular · MySQL · JWT · Firebase · AWS**

*Redboost Platform — Empowering entrepreneurship ecosystems*

</div>
