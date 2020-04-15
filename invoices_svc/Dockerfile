FROM node:carbon

# Specify the directory inside the image in which all commands will run
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all of the app files into the image
COPY . .

EXPOSE 8080

# The default command to run when starting the container
CMD [ "npm", "start" ]