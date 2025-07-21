'use client';
import React from "react";
import { updateClientConfig } from '../api/graphqlClient';
import { updateAuthClientConfig } from '../api/authApi';

export function ConfigLoader({ children }: { children: React.ReactNode }) {
  const [configLoaded, setConfigLoaded] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      updateClientConfig(),
      updateAuthClientConfig()
    ]).then(() => setConfigLoaded(true));
  }, []);

  if (!configLoaded) {
    return <div style={{padding: 40, textAlign: 'center'}}>Cargando configuración...</div>;
  }

  return <>{children}</>;
} 