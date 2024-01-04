const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
const ejs = require('ejs');

dotEnv.config();
const app = express();
const port = process.env.PORT || 3000;
const username = process.env.USER;
const password = process.env.PASS;
let url = `mongodb+srv://${username}:${password}@cluster0.w8vauus.mongodb.net/testTask-2`;

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

const authenticateUser = (req, res, next) => {
    if (req.session && req.session.email) {
        next();
    } else {
        res.redirect('/login');
    }
};
mongoose.connect(url, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
});

let dbSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true, 
        required: true,
    },
    password: String,
    blogs: [
        {
            title: String,
            content: String,
            name: String,
        }
    ]
});


let userModel = mongoose.model("user", dbSchema);

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let existingUser = await userModel.findOne({ email : email });
        if (!existingUser){
            let dataObj = new userModel({
                name,
                email,
                password
            });
            await dataObj.save();
            res.redirect('/login');
        }
        else {
            console.log('user already exists');
            res.redirect('/error');
        }
    }
    catch (error) {
        console.log(error);
        res.redirect('/error');
    }
});
app.get('/login', (req, res) => {
    if (req.session.email) {
        res.redirect('/home');
    }
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/home', authenticateUser, (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email, password });
        if (user) {
            req.session.email = email;
            req.session.password = password;
            res.redirect('/home');
        } else {
            console.log('Invalid credentials');
            res.redirect('/error');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error');
    }
});
app.get('/createBlog', authenticateUser,(req, res)=> {
    res.sendFile(__dirname + '/public/createblog.html');
});

app.post('/createBlog', async (req, res) => {
    try {
        const { blogTitle, blogContent, authorName } = req.body;
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User not found');
            res.redirect('/error');
            return;
        }
        if (!user.blogs) {
            user.blogs = [];
        }
        user.blogs.push({ title: blogTitle, content: blogContent, name: authorName });
        await user.save();
        res.redirect('/success');
    } catch (error) {
        console.log(error);
        res.redirect('/error');
    }
});
app.get('/viewBlogs', authenticateUser,async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.session.email });
        if (!user) {
            console.log('User not found');
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.render('viewBlogs', { blogs: user.blogs || [] });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/allBlogs', authenticateUser ,async (req, res) => {
    try {
        const allUsers = await userModel.find();
        
        if (!allUsers) {
            console.log('No Users found');
            res.status(404).json({ error: 'No users found' });
            return;
        }
        const allBlogs = allUsers.reduce((blogs, user) => {
            return blogs.concat(user.blogs || []);
        }, []);

        res.render('allBlogs', { blogs: allBlogs });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});
app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/public/success.html');
})
app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/public/error.html');
})
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
