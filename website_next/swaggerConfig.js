// swaggerConfig.js

const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Mon API Next.js',
      version: '1.0.0',
      description: 'Silent Infestion Api Doc',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur local',
      },
    ],
    paths: {
      '/api/hello': {
        get: {
          summary: 'Un exemple d\'endpoint',
          responses: {
            '200': {
              description: 'Réponse OK',
            },
          },
        },
      },
      // Ajoutez ici toutes les routes de votre API que vous souhaitez documenter
    },
  };
  
  export default swaggerDocument;
  