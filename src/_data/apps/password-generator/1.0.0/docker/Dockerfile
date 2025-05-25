FROM eclipse-temurin:23-jdk-alpine
WORKDIR /app
COPY passwordGenerator-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
