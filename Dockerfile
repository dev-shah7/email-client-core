FROM node:slim
WORKDIR /email-client-core

COPY . .

RUN npm install

CMD [ "npm", "start" ]

EXPOSE 5000
