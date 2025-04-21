const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");

const app = express();
const port = 3001;

const swaggerPath = path.join(__dirname, "./swagger.yaml");
const swaggerDocument = YAML.load(swaggerPath);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`✨ Swagger docs available at http://localhost:${port}/docs`);
});
