FROM openjdk:21-slim

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Build the project
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Copy the jar file
COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
