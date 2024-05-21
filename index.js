const express = require('express');
const connectToMognoDB = require('./config/db');
const userRouter = require('./routes/user');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = 4000 | process.env.PORT;

connectToMognoDB();
app.use(cors());
app.use(express.json());

app.get('/server', (req, res) => {
  res.send('Server is running');
});

app.use('/api', userRouter);

app.listen(PORT, () => {
  console.log('🚀 Server is listening at %s', PORT);
});
