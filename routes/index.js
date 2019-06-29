const express = require('express');
const router = express.Router();
const passport = require('passport');
const fetch=require('node-fetch');
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
  // import the module

let User = require('../models/user');
// home page

router.get('/', isLoggedIn,(req, res, next) => {
     res.render('index')});

router.post('/index', isLoggedIn,(req, res, next) => {
  const description = req.body.description;
  const location = req.body.location;
  const url='https://jobs.github.com/positions.json?description=' +description+ '&location=' +location;

fetch(url)
  .then( response => response.json())
  .then( data => res.render('index',{show_data : data}))
  .catch(function(error) {console.log(error)});
})

router.get('/index', isLoggedIn,(req, res, next) => {
  const url='https://jobs.github.com/positions.json?description='+req.query.description+'&location='+req.query.location;
fetch(url)
  .then( response => response.json())
  .then(data => res.render('index',{show_data : data}))
  .catch(function(error) {console.log(error)});
});
router.get('/index/:id', isLoggedIn,(req, res, next) => {
  const url='https://jobs.github.com/positions/'+req.params.id+'.json';
fetch(url)
  .then( response => response.json())
  .then(body => res.render('index',{show_IDdata : body}))
  .catch(function(error) {console.log(error)});
});




// client side
router.get('/homepage', (req, res, next) => {
  res.render('homepage');
});

router.get('/register', (req, res, next) => {
  res.render('register');
});

// login page
router.get('/login', (req, res, next) => {
  res.render('login');
});
// logout -
router.get('/logout', (req, res, next) => {
  req.logout();
  req.flash('success_msg', 'you are logged out');
  res.redirect('/login');
});


// regist - post method
router.post('/register', (req, res, next) => {
  const name = req.body.name ;
  const username = req.body.username ;
  const email = req.body.email ;
  const password = req.body.password ;
  const password2 = req.body.password2 ;

  req.checkBody('name', 'First Name field is required').notEmpty();
  req.checkBody('email', 'Email field is required').notEmpty();
  req.checkBody('email', 'Email is not valide').isEmail();
  req.checkBody('username', 'Username field is required').notEmpty();
  req.checkBody('password', 'Password field is required').notEmpty();
  req.checkBody('password2', 'Password does not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors: errors
    });
  } else {
    const newUser = new User({
      name: name,
      username: username,
      email: email,
      password: password
    });

    User.registerUser(newUser, (err, user) => {
      if(err) throw err;
      req.flash('success_msg', 'You are registered and you can login');
      res.redirect('/login');
      console.log('succed');
    });
  }
});

// local Strategy

passport.use(new LocalStrategy((username, password, done) => {
  User.getUserByUsername(username, (err, user) => {
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'User Not Found'});
    }
    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, {message: 'wrong Password'});
      }
    });
  });
}));


//serialise

passport.serializeUser((user, done) => {
  done(null, user.id);
});
// deserialise

passport.deserializeUser((id, done) => {
  User.getUserById(id, (err, user) => {
    done(err, user);
  });
});

// login process - post method
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
  })(req, res, next);
  console.log('you r logged in');
});

// acces controle
function isLoggedIn(req, res, next) {
  console.log(req.isAuthenticated());
  if(req.isAuthenticated()){
    return next();
  } else{
    res.redirect('/homepage');
  }
  req.flash('error_msg', 'you are not autorized');
}

// nodemailer - post -
router.post('/send',function(req,res,next){
  var transporter  = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "zakaria1997aourir@gmail.com",
      pass: "zakaria1234567"
    },
    secure: false
  });

  var mailOptions = {
    from: '"Zakaria Aourir ?" <zakaria1997aourir@gmail.com>',
    to: 'zaourir97@gmail.com',
    subject: "Intership Online",
    text: 'you have a submission from... Name: '+req.body.name+' Email: '+req.body.email+'Message: '+req.body.message+'',
    html: '<p>you have a submission from...</p> <ul><li>Name: '+req.body.name+'</li><li>Email: '+req.body.email+'</li><li>Message: '+req.body.message+'</li></ul>'
  }
  transporter.sendMail(mailOptions,function(error,info){
    if(error){
      return console.log(error);
    }
    console.log('message sent'+info.response);
    res.redirect('/homepage');
  });

});


module.exports = router;
