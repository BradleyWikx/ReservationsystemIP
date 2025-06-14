# ---- Stage 1: Build ----
# Hier bouwen we de React-app tot statische bestanden

# Gebruik een officiële Node.js image als basis
FROM node:18-alpine AS build

# Zet de werkdirectory in de container
WORKDIR /app

# Kopieer package.json en package-lock.json om dependencies te installeren
COPY package*.json ./

# Installeer alle project dependencies
RUN npm install

# Kopieer de rest van de applicatiecode
COPY . .

# Bouw de applicatie voor productie
# Let op: Zorg dat je Firebase API key in .env.production staat of via build-args wordt meegegeven
RUN npm run build


# ---- Stage 2: Serve ----
# Hier gebruiken we een lichtgewicht webserver om de gebouwde bestanden te serveren

# Gebruik een officiële Nginx image als basis
FROM nginx:1.25-alpine

# Kopieer de gebouwde statische bestanden van de 'build' stage naar de webserver directory
COPY --from=build /app/dist /usr/share/nginx/html

# React Router heeft een specifieke Nginx-configuratie nodig om te werken.
# We overschrijven de standaard Nginx-configuratie.
# We maken dit configuratiebestand in de volgende stap.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vertel de container om te luisteren op poort 8080, de standaard voor Cloud Run
EXPOSE 8080

# Start de Nginx webserver wanneer de container opstart
CMD ["nginx", "-g", "daemon off;"]