# Cricriser

Full-stack local cricket scoring app with:
- `Client`: React + Vite frontend
- `Server`: Spring Boot + MongoDB backend

## Local Setup

### 1. Backend
1. Go to `Server`.
2. Copy `.env.example` values into your deployment/local environment (or map them into `application.properties`).
3. Run:

```bash
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080` by default.

### 2. Frontend
1. Go to `Client`.
2. Create `.env` from `.env.example`.
3. Run:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Deployment

### Backend (Railway)
1. Deploy `Server` folder as a Java service.
2. Set environment variables from [Server/.env.example](Server/.env.example).
3. Set `APP_ALLOWED_ORIGINS` to:
   `https://cricriser.vercel.app,https://*.vercel.app,http://localhost:5173`
4. Build/start can use defaults from Railway Java detection:
   - Build: `./mvnw clean package -DskipTests`
   - Start: `java -jar target/*.jar`

### Frontend (Vercel)
1. Deploy `Client` folder.
2. Set `VITE_API_BASE_URL` to:
   `https://cricriser.up.railway.app`
3. SPA routes are handled by [Client/vercel.json](Client/vercel.json), so direct refresh on routes works.

### Environment Variables

#### Frontend
- See [Client/.env.example](Client/.env.example)
- Required:
  - `VITE_API_BASE_URL`

#### Backend
- See [Server/.env.example](Server/.env.example)
- Core required in production:
  - `SPRING_DATA_MONGODB_URI`
  - `SPRING_DATA_MONGODB_DATABASE`
  - `APP_JWT_SECRET`
  - `APP_ALLOWED_ORIGINS`
- Optional:
  - SMTP vars + `EMAIL_ENABLED=true`
  - Cloudinary vars

## Notes
- CORS is centralized in `Server/src/main/java/com/cricriser/cricriser/config/CorsConfig.java` and reads `APP_ALLOWED_ORIGINS` (comma-separated).
- Do not commit real secrets. Use environment variables on hosting platforms.
