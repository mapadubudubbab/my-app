const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'QQww75031210!',
    database: 'project_01',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const generateTokens = (email) => {
    const accessToken = jwt.sign({ email }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
    return { accessToken };
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const query = 'SELECT user_password, user_nickname FROM user WHERE user_email = ?';
        const [users] = await pool.query(query, [email]);
        if (users.length > 0) {
            const user = users[0];
            const match = await bcrypt.compare(password, user.user_password);
            if (match) {
                const { accessToken } = generateTokens(email);
                res.json({ message: 'Login successful', accessToken, nickname: user.user_nickname });
            } else {
                res.status(401).send({ message: 'Invalid email or password' });
            }
        } else {
            res.status(401).send({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.post('/signup', async (req, res) => {
    const { email, password, nickname } = req.body;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const query = 'INSERT INTO user (user_email, user_password, user_nickname) VALUES (?, ?, ?)';
        const [result] = await pool.query(query, [email, hashedPassword, nickname]);

        res.send({ message: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});

app.get('/check-duplicate', async (req, res) => {
    const { type, value } = req.query;
    let column = type === 'email' ? 'user_email' : 'user_nickname';

    const query = `SELECT COUNT(*) AS count FROM user WHERE ${column} = ?`;

    try {
        const [results] = await db.promise().query(query, [value]);
        const count = results[0].count;
        const isDuplicate = count > 0;
        res.send({ isDuplicate });
    } catch (error) {
        console.error('Check duplicate error:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});

app.post('/verify', async (req, res) => {
    const { email, nickname } = req.body;
    const query = 'SELECT * FROM user WHERE user_email = ? AND user_nickname = ?';
    try {
        const [results] = await db.promise().execute(query, [email, nickname]);
        if (results.length > 0) {
            res.send({ message: 'Verification successful' });
        } else {
            res.status(401).send({ message: 'Verification failed' })
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});

app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    console.log(email, newPassword);
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const query = 'UPDATE user SET user_password = ? WHERE user_email = ?';
        const [results] = await db.promise().execute(query, [hashedPassword, email]);

        if (results.affectedRows === 0) {
            res.status(404).send({ message: 'User not found or password update failed' });
        } else {
            res.send({ message: 'Password successfully reset' });
        }
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});

app.get('/posts', async (req, res) => {
    const { search, type } = req.query;
    let query = 'SELECT post_id, post_title, user_nickname FROM post';
    const queryParams = [];

    if (search) {
        switch (type) {
            case 'title':
                query += ' WHERE post_title LIKE ?';
                break;
            case 'content':
                query += ' WHERE post_text LIKE ?';
                break;
            case 'nickname':
                query += ' WHERE user_nickname LIKE ?';
                break;
            default:
                return res.status(400).send({ message: 'Invalid search type' });
        }
        queryParams.push(`%${search}%`);
    }

    try {
        const [results] = await pool.query(query, queryParams);
        res.json(results);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});


app.get('/posts/:id', async (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM posts WHERE post_id = ?';

    try {
        const [results] = await db.promise().execute(query, [id]);

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send({ message: 'Post not found' });
        }
    } catch (error) {
        console.error('Error fetching post details:', error);
        res.status(500).send({ message: 'Server error', error });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'No token provided.' });

    jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({ message: 'Failed to authenticate token.' });
        req.userEmail = decoded.email;
        next();
    });
};

app.post('/upload', verifyToken, upload.none(), async (req, res) => {
    const { title, text } = req.body;
    console.log('req.body', req.body);
    const userEmail = req.userEmail;
    try {
        const userQuery = 'SELECT user_nickname FROM user WHERE user_email = ?';
        const [userResult] = await pool.query(userQuery, [userEmail]);
        console.log(userResult);
        if (userResult.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const userNickname = userResult[0].user_nickname;
        console.log(userNickname);
        const postQuery = `INSERT INTO post (post_title, post_text, user_email, user_nickname) VALUES (?, ?, ?, ?)`;
        await pool.query(postQuery, [title, text, userEmail, userNickname]);
        console.log(postQuery, [title, text, userEmail, userNickname])
        res.send({ message: 'Post uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
