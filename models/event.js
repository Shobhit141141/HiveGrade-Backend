const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    default: 'others',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['active', 'past'],
    default: 'active',
  },
  judges: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ],
  participants: [
    {
      name: {
        type: String,
        required: true,
      },
      teamLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      grades: { type: Map, of: Number },
      totalScore: Number,
    },
  ],
  winners: [
    {
      name: {
        type: String,
        required: true,
      },
      teamLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      grades: { type: Map, of: Number },
      totalScore: Number,
    },
  ],
  params: [{ type: String, required: true }],
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
