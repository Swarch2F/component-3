FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Permitir pasar la URL de la API GraphQL en build time
ARG NEXT_PUBLIC_API_BASE=https://nginx-proxy:443/graphql
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Copiar el script de entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Exponer el puerto
EXPOSE 3000

# Usar el entrypoint para sobreescribir config.json en runtime
ENTRYPOINT ["/entrypoint.sh"]

# Iniciar la app
CMD ["npm", "start"]