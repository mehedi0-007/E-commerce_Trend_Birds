import "reflect-metadata";
import cookieParser from "cookie-parser";
import * as express from "express";
import * as path from "path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

function checkEnvironment() {
  const requiredEnvs = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN',
  ];

  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.error(`\x1b[31m[CRITICAL ERROR] Missing required environment variables:\x1b[0m`);
    missingEnvs.forEach((env) => console.error(`  - ${env}`));
    console.error(`\x1b[33mPlease configure these in your .env file before starting the application.\x1b[0m\n`);
    process.exit(1);
  }
}

async function bootstrap() {
  checkEnvironment();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  
  // Use the specific CORS origin from environment variables
  app.enableCors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Trends Bird Admin API")
    .setDescription("E-Commerce Admin System featuring Granular Action-Based RBAC Matrix and Single-In-Flight Token Refresh Strategy.")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addCookieAuth("refresh_token")
    .addApiKey({ type: "apiKey", name: "x-csrf-token", in: "header" }, "x-csrf-token")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
