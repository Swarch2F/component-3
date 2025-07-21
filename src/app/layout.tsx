import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./modern.css";
import { updateClientConfig } from './api/graphqlClient';
import { updateAuthClientConfig } from './api/authApi';
import React from 'react';
import { ConfigLoader } from "./components/ConfigLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gradex",
  description: "Gestión de calificaciones moderna y eficiente",
};

// Función para inicializar la configuración
async function initializeConfig() {
  if (typeof window !== 'undefined') {
    try {
      await Promise.all([
        updateClientConfig(),
        updateAuthClientConfig()
      ]);
      console.log('Configuration initialized successfully');
    } catch (error) {
      console.error('Error initializing configuration:', error);
    }
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConfigLoader>
          {children}
        </ConfigLoader>
      </body>
    </html>
  );
}
