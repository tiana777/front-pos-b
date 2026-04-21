# syntax=docker/dockerfile:1

# 🔧 Build Vue
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 🔥 Important : URL API (par défaut via proxy nginx)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# 🚀 Serveur Nginx
FROM nginx:1.27-alpine AS runner

# Supprimer config par défaut (important)
RUN rm /etc/nginx/conf.d/default.conf

# Ajouter ta config custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier build Vue
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]