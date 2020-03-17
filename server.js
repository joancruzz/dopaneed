if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')


const initializePassport = require('./views/passport-config')

const users = []

// DEMO ACCOUNTS
users.push({
  id: Date.now().toString(),
  name: "Bob",
  email: "bob@dylan.com",
  password: bcrypt.hashSync("toto123", 10),
  song: "hi"
})


initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id),
)

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

// ROUTE TO HOME IF AUTHORIZED USER
app.get('/home', (req, res) => { 
  if (req.isAuthenticated()) 
    res.render('index.ejs', { name: req.user.name })
  else 
    res.render('index_not_auth.ejs')
})

// ROUTE TO LANDING PAGE
app.get('/', (req, res) => { 
  if (req.isAuthenticated()) 
    res.render('index.ejs', { name: req.user.name }),
    res.render('index_not_auth.ejs')
  else 
    res.render('index_not_auth.ejs')
})

// ROUTE TO FEED PAGE
app.get('/feed', (req,res) => {
  res.render('feed.ejs', { song: req.user.song })
})

// ROUTE TO LOGIN PAGE
app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs') 
})

// CHECK IF AUTHORIZED USER AT LOGIN PAGE
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}))

// ROUTE TO REGISTER PAGE
app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})

// CREATE A NEW USER
app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt. hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  } 
})

// POST A SONG
app.post('/home', (req, res) => {
  users.push({
    song: req.body.song
  })
  res.redirect('/feed')
})


// ROUTE TO LANDING PAGE AT LOGOUT
app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/')
})

// FUNCTION TO CHECK IF USER EXISTS
function checkAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// FUNCTION TO CHECK IF USER DOESN'T EXISTS
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// LISTENING PORT
app.listen(3000)

