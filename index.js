const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//MongoDB connection
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.once('open', () => {
  console.log(' Succesfully connected to MongoDB Cluster');
});

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
const User = mongoose.Model('User', userSchema);
const Exercise = mongoose.Model('Exercise', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function(req, res) {
  const {username} = req.body;
  try {
    const newUser = new User({username});
    newUser.save();
    res.json({ username: newUser.username, _id: newUser._id});
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to create User"});
  }
});

app.get('/api/users', function(req,res) {

});

app.post('/api/users/:_id/exercises', function(req, res) {
  const {description, duration, date} = req.body;
  const id = req.params._id
  try {
    const user = User.findById(id);
    if (!user) {
      return res.json({error: "User with id: " + id + " not found."});
    }
    const newExercise = new Exercise({
      userId: user._id,
      description: description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });
    newExercise.save();
    res.json({
      username: user.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: newExercise.date.toDateString(),
      _id: newExercise._id
    });
  } catch (err) {
    console.error(err);
    res.json({error: "Failed to create Exercise"});
  }
});

app.get('/api/users/:_id/logs', function(req, res) {

});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
