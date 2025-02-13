"use client";

// pages/api-docs.js
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  return (
    <div style={{ margin: '20px' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}
