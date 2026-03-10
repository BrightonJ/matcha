const express = require('express');
const morgan = require('morgan');
require('dotenv').config();

const PORT = process.env.PORT;
const app = express();

app.use(morgan('short'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to matcha!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});