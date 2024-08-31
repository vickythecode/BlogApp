const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

async function DbConnect(){
  try {
    const DbConnect = await mongoose.connect('mongodb+srv://vickyfdyf123:mernblog12@cluster0.tisgzwc.mongodb.net/');
    console.log("Connected to DB")
  } catch (error) {
    console.log("FAILED TO CONNECT DATABASE",error); 
  }
}
DbConnect()

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  const hashedPassword = await bcrypt.hashSync(password, salt);
  try{
    const userDoc = await User.create({
      username,
      password:hashedPassword,
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json(e);
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const userDoc = await User.findOne({ username });

    // Check if the user exists
    if (!userDoc) {
      return res.status(400).json('Wrong credentials');
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
      // Logged in
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token,{ httpOnly: true }).json({
          id: userDoc._id,
          username,
        });
      });
    } else {
      res.status(400).json('Wrong credentials');
    }
  } catch (e) {
    console.log(e);
    res.status(500).json('Internal server error');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  
  if (!token) {
    return res.status(401).json('Token not provided');
  }

  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});


//solved error
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    let newPath = null;

    // Check if a file is uploaded
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath || '',  // Use empty string if no file is uploaded
        author: info.id,
      });
      res.json(postDoc);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json('Internal server error');
  }
});


app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  try {
    let newPath = null;

    // Check if a file is uploaded
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split('.');
      const ext = parts[parts.length - 1];
      newPath = path + '.' + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('You are not the author');
      }

      await postDoc.update({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover, // Keep existing cover if no new file
      });

      res.json(postDoc);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json('Internal server error');
  }
});


app.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})



// DELETE post route
app.delete('/post/:id', async (req, res) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json('Token not provided');
    }

    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;

      const { id } = req.params;
      const postDoc = await Post.findById(id);

      // Check if the post exists
      if (!postDoc) {
        return res.status(404).json('Post not found');
      }

      // Check if the logged-in user is the author of the post
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('You are not the author');
      }

      // Delete the post
      await postDoc.deleteOne();

      res.json('Post deleted successfully');
    });
  } catch (error) {
    console.log(error);
    res.status(500).json('Internal server error');
  }
});


app.listen(4000);