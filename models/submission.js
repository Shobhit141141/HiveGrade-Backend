const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teamName: {
    type: String,
    required: true,
    unique: true,
  },
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  projectLink: {
    type: String,
    required: true,
  },
  presentationLink: {
    type: String,
    required: true,
  },
  demoVideoLink: {
    type: String,
    required: true,
  },
});

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
