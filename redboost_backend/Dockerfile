# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies first (layer cache optimization)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -q

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy built jar
COPY --from=builder /app/target/redboost-*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads /app/tokens && \
    chown -R spring:spring /app

USER spring

EXPOSE 8082

# JVM tuning for containers
ENTRYPOINT ["java", \
  "-Xmx512m", \
  "-Xms256m", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-jar", "app.jar"]
