import { createSwaggerSpec } from 'next-swagger-doc';

export const swaggerConfig = {
  definition: {
    openapi: '3.1.1',
    info: {
      title: 'Silent Infestion API',
      version: '1.0.0',
    },
  },
};

export function getSpec() {
  return createSwaggerSpec(swaggerConfig);
}
