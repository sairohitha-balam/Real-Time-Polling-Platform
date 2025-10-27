// src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-Time Polling Platform API',
      version: '1.0.0',
      description:
        'API documentation for the real-time polling backend assignment.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API docs (route files)
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);