FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY Server/pom.xml Server/mvnw ./Server/
COPY Server/.mvn ./Server/.mvn
RUN chmod +x ./Server/mvnw

COPY Server/src ./Server/src

WORKDIR /workspace/Server
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/Server/target/*.jar /app/app.jar

EXPOSE 8080

ENV PORT=8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]