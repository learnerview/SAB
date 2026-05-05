FROM eclipse-temurin:17-jdk-alpine

# Install Maven
RUN apk add --no-cache maven

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn dependency:go-offline

EXPOSE 8080

CMD ["mvn", "spring-boot:run"]
