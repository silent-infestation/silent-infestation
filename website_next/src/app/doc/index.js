import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import { getSpec } from '../../../swagger';

function ApiDocsPage() {
  const spec = getSpec();
  return <SwaggerUI spec={spec} />;
}

export default ApiDocsPage;
