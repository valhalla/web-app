FROM node:24-alpine AS builder
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH
COPY . /app
RUN npm i

ENV NODE_ENV=production
RUN npm run build

# production environment
FROM nginx:1.29-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
