# fifa.tournament

## Setup

### Requirements 
- Latest MongoDb.
- Latest npm version
- Latest nodejs version

### Configuration
Configure the [env.config](env.config) file properly

### Set up the database
```Shell
tar -xf backup/prod.backup_<latest>.tar.gz 
mongorestore --drop -d fifa prod.backup_<latest>/heroku_<hash>/
```
Replace the <latest> tag by the actual latest backup filename

## Running
```Shell
> mongod
> npm install
> node server.js
```

Developer information: ezequielbergamaschi@gmail.com
