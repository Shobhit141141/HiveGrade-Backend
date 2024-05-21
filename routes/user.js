const express = require('express');
const User = require('../models/user');
const Event = require('../models/event');
const Submission = require('../models/submission');
const userRouter = express.Router();

userRouter.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(200).send({ ...existingUser._doc, isNewUser: false });
    }
    const newUser = new User({ username });
    const savedUser = await newUser.save();
    return res.status(200).send({ ...savedUser._doc, isNewUser: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/select-role', async (req, res) => {
  try {
    const { username, role } = req.body;
    if (!username | !role)
      return res.status(400).json({ error: 'username and role is required.' });
    const req_user = await User.findOne({ username });
    req_user.role = role;
    const updatedUser = await req_user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/create-event', async (req, res) => {
  try {
    const { name, type, username, params } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist." });
    }
    const existingEvent = await Event.findOne({ name });
    if (existingEvent) {
      return res
        .status(400)
        .json({ error: 'Event with same name already exist.' });
    }
    if (user.role === 'judge') {
      // Only judges can create Event
      const user_id = user._id;
      const judges = [user_id];
      const createdEvent = await Event.create({
        name,
        type,
        creator: user_id,
        judges,
        params,
      });
      return res.status(200).send(createdEvent);
    } else {
      return res
        .status(401)
        .json({ error: 'You are not allowed to create an Event.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/get-event', async (req, res) => {
  try {
    const { event_name, event_id } = req.headers;

    if (!event_name && !event_id)
      return res.json({ error: 'Event name or id is required.' });

    if (event_name) {
      const event = await Event.findOne({ name: event_name })
        .populate('judges')
        .populate('creator');
      return res.status(200).json(event);
    }
    if (event_id) {
      const event = await Event.findById(event_id).populate('creator');
      return res.status(200).json(event);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/get-events', async (req, res) => {
  try {
    const { category, userId } = req.query;
    if (category === 'my_events') {
      if (!userId)
        return res.status(400).json({ error: 'User Id is required.' });
      const myEvents = await Event.find({ creator: userId });
      return res.status(200).json(myEvents);
    }
    const events = await Event.find({ category })
      .populate('creator')
      .populate('judges');
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/grade-participants', async (req, res) => {
  try {
    const { participantName, grades, eventName, username } = req.body;

    if (!eventName || !grades || !username || !participantName) {
      return res.status(400).json({
        error: 'eventName, participantName, username and grades are required.',
      });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const event = await Event.findOne({ name: eventName });
    if (!event) {
      return res.status(404).json({ error: 'Event not found!' });
    }

    if (user.role !== 'judge' || !event.judges.includes(user._id))
      res
        .status(401)
        .json({ error: 'You are not allowed to add participant.' });

    const totalScore = Object.values(grades).reduce(
      (accumulator, currentValue) => {
        return accumulator + currentValue;
      },
      0
    );
    // event.participants.push({ name: participantName, grades, totalScore });
    event.participants.forEach((item) => {
      if (item.name === participantName) {
        item.grades = grades;
        item.totalScore = totalScore;
      }
    });
    const updatedEvent = await event.save();
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/determine-winner', async (req, res) => {
  try {
    const { event_name } = req.headers;
    if (!event_name) {
      return res
        .status(400)
        .json({ error: 'Event name is not provided in headers.' });
    }
    const event = await Event.findOne({ name: event_name });
    if (!event) return res.status(404).json({ error: 'Event not found!' });
    let participants = event.participants;
    participants = participants.sort((a, b) => b.totalScore - a.totalScore);
    const winnersList = [participants[0], participants[1], participants[2]];
    event.winners = winnersList;
    event.category = 'past'; // close the event once winners declared
    const updatedEvent = await event.save();
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/join-as-judge', async (req, res) => {
  try {
    const { username, event_code } = req.body;
    const judge = await User.findOne({ username });
    if (!judge) return res.status(404).json({ error: 'Judge not found!' });
    const event = await Event.findById(event_code);
    if (!event) return res.status(404).json({ error: 'Event not found!' });
    judge.my_events.push(event._id);
    event.judges.push(judge._id);
    await judge.save();
    await event.save();
    res.status(200).send({ message: 'Judge added to the event.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/search', async (req, res) => {
  try {
    let { q } = req.query;
    q = q.toLowerCase();
    if (q.length === 0) return res.status(200).json([]);
    const events = await Event.find({}).populate('creator');
    const results = events.filter((item) =>
      item.name.toLowerCase().startsWith(q)
    );
    return res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.post('/submit-project', async (req, res) => {
  try {
    const {
      event,
      teamName,
      teamLead,
      projectLink,
      presentationLink,
      demoVideoLink,
    } = req.body;
    const submission = await Submission.create(req.body);
    const req_event = await Event.findById(event);
    req_event.participants.push({ name: teamName, teamLead, grades: {}, totalScore: 0 });
    await req_event.save();
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/get-submissions', async (req, res) => {
  try {
    const { event } = req.headers;
    const submissions = await Submission.find({ event }).populate('teamLead');
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = userRouter;
