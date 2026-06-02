import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Progress from './models/Progress.js';
import Chat from './models/Chat.js';
import User from './models/User.js';
import Review from './models/Review.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 54321;

// Root Route (so you don't see Cannot GET /)
app.get('/', (req, res) => {
  res.send('🦷 Dr. Smiles Backend API is running successfully!');
});

// MongoDB Connection
const MONGO_URI = "mongodb://kaveens555_db_user:dental@ac-zep0sdb-shard-00-00.prqmrhr.mongodb.net:27017,ac-zep0sdb-shard-00-01.prqmrhr.mongodb.net:27017,ac-zep0sdb-shard-00-02.prqmrhr.mongodb.net:27017/?ssl=true&replicaSet=atlas-kkm6qm-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log('Connected to MongoDB Cloud'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Helper to get default progress
const getDefaultProgress = (userId) => ({
  userId,
  coins: 0,
  level: 1,
  xp: 0,
  badges: [],
  gamesCompleted: [],
  anxietyScore: 50,
  readinessScore: 50,
  avatar: '🐻',
  displayName: userId,
  age: null,
  birthday: null,
  purchasedItems: [],
  gameLevels: {}
});

// In-memory OTP store (simple, fast)
const otpStore = new Map();

// Nodemailer transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendOtpEmail(email, otpCode) {
  try {
    await transporter.sendMail({
      from: `"Happy Dental 🦷" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Happy Dental OTP Code',
      html: `
        <div style="font-family:sans-serif;text-align:center;max-width:500px;margin:0 auto;padding:30px">
          <h2 style="color:#0d9488">🦷 Happy Dental</h2>
          <p style="font-size:16px;color:#374151">Your one-time login code is:</p>
          <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#0f766e;background:#f0fdfa;padding:24px;border-radius:12px;margin:24px 0;border:2px dashed #99f6e4">${otpCode}</div>
          <p style="color:#9ca3af;font-size:13px">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>`
    });
    console.log(`\x1b[32m[OTP] Email sent to ${email}\x1b[0m`);
  } catch (err) {
    console.error('[OTP] Email send failed:', err.message);
  }
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { parentName, email, password } = req.body;
    if (!parentName || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email is already registered. Please login.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ parentName, email, password: hashedPassword });
    await newUser.save();

    // Create default progress
    const defaultProgress = new Progress(getDefaultProgress(email));
    await defaultProgress.save();

    // Generate & store OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp: otpCode, expires: Date.now() + 5 * 60 * 1000, isNewUser: true });
    console.log(`\x1b[32m[OTP] ${email} => ${otpCode}\x1b[0m`);
    sendOtpEmail(email, otpCode); // async, don't await

    res.json({ success: true, message: 'Account created! Check your email for OTP.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'No account found with this email. Please sign up.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Wrong password. Please try again.' });

    // Generate & store OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp: otpCode, expires: Date.now() + 5 * 60 * 1000, isNewUser: false });
    console.log(`\x1b[32m[OTP] ${email} => ${otpCode}\x1b[0m`);
    sendOtpEmail(email, otpCode); // async, don't await

    res.json({ success: true, message: 'Password correct! Check your email for OTP.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record) return res.status(401).json({ message: 'OTP expired or not found. Please try again.' });
    if (Date.now() > record.expires) {
      otpStore.delete(email);
      return res.status(401).json({ message: 'OTP has expired. Please login again.' });
    }
    if (record.otp !== otp) return res.status(401).json({ message: 'Wrong OTP. Please check your email.' });

    otpStore.delete(email);
    const user = await User.findOne({ email });
    res.json({ success: true, userId: email, isNewUser: record.isNewUser, parentName: user?.parentName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET user progress
app.get('/api/progress/:userId', async (req, res) => {
  try {
    console.log(`[GET] /api/progress/${req.params.userId}`);
    const userId = req.params.userId;
    let progress = await Progress.findOne({ userId });
    
    if (!progress) {
      // Create default if not found
      progress = new Progress(getDefaultProgress(userId));
      await progress.save();
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all patients
app.get('/api/patients', async (req, res) => {
  try {
    console.log(`[GET] /api/patients`);
    const patients = await Progress.find({});
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to update progress after completing a game
app.post('/api/progress/:userId/complete-game', async (req, res) => {
  try {
    console.log(`[POST] complete-game for ${req.params.userId}`, req.body);
    const { gameId, scoreEarned, anxietyReduction } = req.body;
    const userId = req.params.userId;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress(getDefaultProgress(userId));
    }

    const isNewCompletion = !progress.gamesCompleted.includes(gameId);
    if (isNewCompletion) {
      progress.gamesCompleted.push(gameId);
    }
    
    progress.coins += scoreEarned;
    progress.anxietyScore = Math.max(0, progress.anxietyScore - anxietyReduction);
    progress.readinessScore = Math.min(100, progress.readinessScore + anxietyReduction);
    
    const xpEarned = isNewCompletion ? 50 : 10;
    progress.xp += xpEarned;
    progress.level = Math.floor(progress.xp / 100) + 1;

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// PUT to update avatar
app.put('/api/progress/:userId/avatar', async (req, res) => {
  try {
    console.log(`[PUT] avatar for ${req.params.userId}`, req.body);
    const { avatar } = req.body;
    const userId = req.params.userId;
    
    const progress = await Progress.findOneAndUpdate(
      { userId },
      { avatar },
      { new: true, upsert: true } // Upsert in case it doesn't exist
    );
    
    res.json({ success: true, avatar: progress.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/progress/:userId/profile', async (req, res) => {
  try {
    console.log(`[PUT] profile for ${req.params.userId}`, req.body);
    const { displayName, age, birthday } = req.body;
    const userId = req.params.userId;
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (age !== undefined) updateData.age = age;
    if (birthday !== undefined) updateData.birthday = birthday;

    const progress = await Progress.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true } // Upsert in case it doesn't exist
    );
    
    res.json({ success: true, displayName: progress.displayName, age: progress.age, birthday: progress.birthday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to buy an item
app.post('/api/progress/:userId/buy', async (req, res) => {
  try {
    console.log(`[POST] buy for ${req.params.userId}`, req.body);
    const { itemId, cost } = req.body;
    const userId = req.params.userId;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress(getDefaultProgress(userId));
    }
    
    if (progress.purchasedItems.includes(itemId)) {
      return res.status(400).json({ message: 'Item already purchased' });
    }
    
    if (progress.coins < cost) {
      return res.status(400).json({ message: 'Not enough coins' });
    }
    
    progress.coins -= cost;
    progress.purchasedItems.push(itemId);
    
    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// POST to complete a game level
app.post('/api/progress/:userId/complete-level', async (req, res) => {
  try {
    console.log(`[POST] complete-level for ${req.params.userId}`, req.body);
    const { gameId } = req.body;
    const userId = req.params.userId;
    
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress(getDefaultProgress(userId));
    }
    
    // Initialize map if missing
    if (!progress.gameLevels) {
      progress.gameLevels = new Map();
    }
    
    const currentLevel = progress.gameLevels.get(String(gameId)) || 0;
    
    if (currentLevel < 10) {
      progress.gameLevels.set(String(gameId), currentLevel + 1);
      progress.coins += 50; // Give 50 coins per level
      progress.xp += 20;    // Give 20 XP per level
      progress.level = Math.floor(progress.xp / 100) + 1;

      // Award Graduation badge if completing Graduation Day game
      if (String(gameId) === '20') {
        if (!progress.badges.includes('Super Smile Graduate')) {
          progress.badges.push('Super Smile Graduate');
        }
      }
    }
    
    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// GET user chat history
app.get('/api/chat/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let chat = await Chat.findOne({ userId });
    
    if (!chat) {
      chat = new Chat({ 
        userId, 
        messages: [{ 
          id: 1, 
          text: "Hi! I'm Dr. Smiles 🐻. I'm here to answer any questions you have about visiting the dentist. What's on your mind?", 
          sender: 'bot', 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }] 
      });
      await chat.save();
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST append message to chat
app.post('/api/chat/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { message } = req.body; // Expects { id, text, sender, time }
    
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }
    
    chat.messages.push(message);
    await chat.save();
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Save a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { doctorName, reviewerUserId, rating, comment } = req.body;
    if (!doctorName || !reviewerUserId || !rating) {
      return res.status(400).json({ message: 'doctorName, reviewerUserId, and rating are required.' });
    }
    const review = new Review({ doctorName, reviewerUserId, rating, comment });
    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET - Fetch all reviews for a specific doctor
app.get('/api/reviews/:doctorName', async (req, res) => {
  try {
    const reviews = await Review.find({ doctorName: req.params.doctorName }).sort({ createdAt: -1 });
    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    res.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
