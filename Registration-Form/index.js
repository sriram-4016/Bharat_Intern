const express = require('express');
const bodyParser = require('body-parser');
const dotEnv = require('dotenv');
const mongoose = require('mongoose');

const app = express();
dotEnv.config();

const port = 1111 || process.env.PORT;

const username = process.env.uname;
const password = process.env.pswrd;

let url = `mongodb+srv://${username}:${password}@cluster0.w8vauus.mongodb.net/RegistrationFormDB`;

app.use(bodyParser.urlencoded({ extended : true })); 
app.use(bodyParser.json());

mongoose.connect(url, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
});

let dbSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String
});

let userModel = mongoose.model("user", dbSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});
app.post('/signup', async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, password } = req.body;
        let existingUser = await userModel.findOne({ email : email });
        if (!existingUser){
            // create object for the model
            let dataObj = new userModel({
                name,
                email,
                password
            });
            await dataObj.save();
            res.redirect('/success');
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
app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/pages/success.html');
})
app.get('/error', (req, res) => {
    res.sendFile(__dirname + '/pages/error.html');
});
app.listen(port, () => {
    console.log(`server running at port ${port}`);
});


