FROM node:alpine

RUN apk add --no-cache make gcc g++ python

RUN mkdir -p /app
WORKDIR /app

COPY . .
RUN npm install

EXPOSE 80

CMD ["node", "app.js"]
