#  🏏Cricriser – Local Cricket Scoring Backend

Cricriser is the backend service for a local cricket tournament scoring web app. It provides APIs to manage leagues, teams, players, matches, scores, and real-time commentary.

---

## 🚧 Status
Backend is under active development. Core features like authentication, match management, and score updates are implemented.  

---

## 📌 MVP Scope
- User signup/login with JWT-based authentication
- Email verification via OTP
- CRUD operations for leagues, teams, players, and matches
- Real-time score updates
- Ball-by-ball commentary
- Admin controls for managing tournaments, teams, and players

---

## 🧰 Tech Stack
- **Backend:** Java, Spring Boot  
- **Database:** MongoDB Atlas  
- **Security:** Spring Security, JWT  
- **Email Verification:** SMTP-based OTP  

---

## 📂 Setup Instructions

### Clone the repository
```bash
https://github.com/anujyadav2244/Cricriser-Local-Cricket-Scoring-Web-App.git
cd cricriser/server
````

### Configure environment

* Update `src/main/resources/application.properties` with:

  * MongoDB URI
  * JWT secret
  * SMTP mail config (for OTP)

### Run the backend

```bash
./mvnw spring-boot:run
```

Backend will be available at `http://localhost:8080`.

