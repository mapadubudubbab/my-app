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
    const accessToken = jwt.sign({ email }, process.env.ACCESS_SECRET, { expiresIn: '30m' });
    return { accessToken };
};

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'No token provided.' });

    jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({ message: 'Failed to authenticate token.' });
        req.userEmail = decoded.email;
        next();
    });
};

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
        const [results] = await pool.query(query, [value]);
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
        const [results] = await pool.execute(query, [email, nickname]);
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
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const query = 'UPDATE user SET user_password = ? WHERE user_email = ?';
        const [results] = await pool.execute(query, [hashedPassword, email]);

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

    const query = 'SELECT * FROM post WHERE post_id = ?';

    try {
        const [results] = await pool.execute(query, [id]);

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

app.post('/upload', verifyToken, upload.none(), async (req, res) => {
    const { title, text } = req.body;
    const userEmail = req.userEmail;
    try {
        const userQuery = 'SELECT user_nickname FROM user WHERE user_email = ?';
        const [userResult] = await pool.query(userQuery, [userEmail]);
        if (userResult.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const userNickname = userResult[0].user_nickname;
        const postQuery = `INSERT INTO post (post_title, post_text, user_email, user_nickname) VALUES (?, ?, ?, ?)`;
        await pool.query(postQuery, [title, text, userEmail, userNickname]);
        res.send({ message: 'Post uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.get('/posts/:postId', async (req, res) => {
    const { postId } = req.params;
    console.log(req);
    try {
        const postQuery = 'SELECT * FROM post WHERE post_id = ?';
        const [post] = await pool.query(postQuery, [postId]);

        if (post.length > 0) {
            res.json(post[0]);
        } else {
            res.status(404).send({ message: 'Post not found' });
        }
    } catch (error) {
        console.error('Fetch post error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.get('/posts/:postId/comments', async (req, res) => {
    const { postId } = req.params;

    try {
        const commentsQuery = 'SELECT * FROM review WHERE post_id = ? ORDER BY review_id DESC';
        const [comments] = await pool.query(commentsQuery, [postId]);
        res.json(comments);
    } catch (error) {
        console.error('Fetch comments error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.post('/posts/:postId/comments', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const { review_text } = req.body;
    const userEmail = req.userEmail;

    console.log(postId, review_text, userEmail);

    try {
        const userQuery = 'SELECT user_nickname FROM user WHERE user_email = ?';
        const [userResult] = await pool.query(userQuery, [userEmail]);

        if (userResult.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const userNickname = userResult[0].user_nickname;

        const insertCommentQuery = 'INSERT INTO review (review_text, post_id, user_nickname) VALUES (?, ?, ?)';
        await pool.query(insertCommentQuery, [review_text, postId, userNickname]);

        res.send({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.delete('/comments/:commentId', verifyToken, async (req, res) => {
    const { commentId } = req.params;
    const userEmail = req.userEmail;

    try {
        const commentQuery = 'SELECT * FROM review WHERE review_id = ?';
        const [commentResult] = await pool.query(commentQuery, [commentId]);

        if (commentResult.length === 0) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        const comment = commentResult[0];

        const userQuery = 'SELECT user_nickname FROM user WHERE user_email = ?';
        const [userResult] = await pool.query(userQuery, [userEmail]);

        if (userResult.length === 0) {
            return res.status(404).send({ message: 'User not found' });
        }

        const userNickname = userResult[0].user_nickname;

        if (comment.user_nickname !== userNickname) {
            return res.status(403).send({ message: 'You can only delete your own comments' });
        }

        const deleteCommentQuery = 'DELETE FROM review WHERE review_id = ?';
        await pool.query(deleteCommentQuery, [commentId]);

        res.send({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.put('/posts/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const { title, text } = req.body;
    const userEmail = req.userEmail;
    console.log(postId, title, text, userEmail);
    try {
        const updatePostQuery = 'UPDATE post SET post_title = ?, post_text = ? WHERE post_id = ? AND user_email = ?';
        const [result] = await pool.query(updatePostQuery, [title, text, postId, userEmail]);
        console.log('update result : ', result);
        if (result.affectedRows === 0) {
            res.status(404).send({ message: 'Post not found or user not authorized to edit this post' });
        } else {
            res.send({ message: 'Post updated successfully' });
        }
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.delete('/posts/:postId', verifyToken, async (req, res) => {
    const { postId } = req.params;
    const userEmail = req.userEmail;

    try {
        const deletePostQuery = 'DELETE FROM post WHERE post_id = ? AND user_email = ?';
        const [result] = await pool.query(deletePostQuery, [postId, userEmail]);
        console.log('delete result : ', result);
        if (result.affectedRows === 0) {
            res.status(404).send({ message: 'Post not found or user not authorized to delete this post' });
        } else {
            res.send({ message: 'Post deleted successfully' });
        }
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.get('/my-posts', verifyToken, async (req, res) => {
    const userEmail = req.userEmail;

    try {
        const userPostsQuery = `
            SELECT post_id, post_title
            FROM post
            WHERE user_email = ?
        `;
        const [posts] = await pool.query(userPostsQuery, [userEmail]);
        console.log('posts : ', posts);
        res.json(posts);
    } catch (error) {
        console.error('Fetch user posts error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.get('/my-comments', verifyToken, async (req, res) => {
    const userEmail = req.userEmail;

    try {
        const userCommentsQuery = `
            SELECT review_id, review_text, post_id
            FROM review
            JOIN user ON review.user_nickname = user.user_nickname
            WHERE user.user_email = ?
        `;
        const [comments] = await pool.query(userCommentsQuery, [userEmail]);
        console.log('comments : ', comments);
        res.json(comments);
    } catch (error) {
        console.error('Fetch user comments error:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
