const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//MongoDB connection
const mongoose = require('mongoose');
const e = require('express');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.once('open', () => {
  console.log(' Succesfully connected to MongoDB Cluster');
});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Mongoose schemas
const userSchema = new mongoose.Schema({
  username: {type: String, required: true}
});
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
});

//Mongoose Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async function(req, res) {
  const {username} = req.body;

  try {
    const newUser = new User({username});
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id});
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to create User"});
  }
});

app.get('/api/users', async function(req,res) {
  try {
    const users = await User.find({});
    res.json(users.map(user => ({username: user.username, _id: user._id})));
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to retrieve users."});
  };
});

app.post('/api/users/:_id/exercises', async function(req, res) {
  const {description, duration, date} = req.body;
  const id = req.params._id

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.json({error: "User with id: " + id + " not found."});
    }

    const newExercise = new Exercise({
      userId: user._id,
      description: description,
      duration: parseInt(duration, 10),
      date: date ? new Date(date) : new Date()
    });

    await newExercise.save();

    res.json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to create Exercise"});
  }
});

app.get('/api/users/:_id/logs', async function(req, res) {
  const id = req.params._id;
  const {from, to, limit} = req.query;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.json({error: "User with id: " + id + " not found."});
    }

    let query = {userId: id};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercises = await Exercise.find(query).limit(parseInt(limit, 10) || 0);

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString(),
      }))
    });
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to retrieve logs."});
  }
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
