const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const morgan = require('morgan');

const logging = require('./logs/log');

const app = express();

app.use(morgan('tiny'));
app.use(express.json({extended: true}));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profiles.routes'));
app.use('/api/photo/self', require('./routes/photo.routes'));
app.use('/api/trucks', require('./routes/trucks.routes'));
app.use('/api/loads', require('./routes/loads.routes'));

const PORT = config.get('port') || 5000;

async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    app.listen(PORT, ()=> console.log(`App has been started on port ${PORT}`));
  } catch (error) {
    logging('Error', error.message);
    process.exit(1);
  }
}

start();
