const mongoose = require('mongoose');

const connectToMognoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔥 Connected to Mongodb');
  } catch (error) {
    console.log('💩 Unable to connect to Mongodb', error);
  }
};

module.exports = connectToMognoDB;
