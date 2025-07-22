import { NextResponse } from 'next/server';

export async function GET() {
  // Detectar si estamos en desarrollo local o en contenedor
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  let apiBase: string;
  
  if (isDevelopment) {
    // Desarrollo local - usar localhost
    apiBase = 'https://localhost:444/graphql';
  } else {
    // Producción (Docker/Kubernetes) - usar nombre del servicio
    apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://nginx-proxy:443/graphql';
  }
  
  //console.log('Environment detection:', {
 //   NODE_ENV: process.env.NODE_ENV,
  //  isDevelopment,
  //  apiBase
  //});
  
  return NextResponse.json({
    apiBase,
    environment: isDevelopment ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });
} 