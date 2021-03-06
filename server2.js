var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var password = require('password-hash-and-salt');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route


app.get('/', function(req, res) {
  //for(var i=0;i<1000000000;i++);
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});


function validateUserName(uName){
  return true;
}

function validatePwd(pwd){
  return true;
}

//for registration..... the post request for it.
var setupRoute = express.Router();

setupRoute.use(function(req,res,next){
  if(!validateUserName(req.body.name)){
    res.json({success: false,message: 'Setup Failed. Enter Valid Username'});
  }
  else if(!validatePwd(req.body.password)){
    res.json({succes:false,message: 'Setup Failed. Enter a password'});
  }
  else
  {
    next();
  }
});

setupRoute.post('/signup', function(req, res) {
            if(validateUserName(req.body.name)){

              if(validatePwd(req.body.password)){
                password(req.body.password).hash(function(error,hash){
                //console.log(req.body.password);
                if(error)
                  throw new Error("Something went wrong");
                else
                {
                  myuser = hash;

                  var nick = new User({ 
                  name: req.body.name, 
                  password: myuser,
                  admin: true 
                });

               // console.log('User ')
                // save the sample user
                nick.save(function(err) {
                  if (err) throw err;

                  console.log('User saved successfully');
                  res.json({ success: true });
                  });
                  //console.log("here"+myuser);
                  }
                });
              //console.log(myuser);
                // create a sample user

              }
              else{
                res.json({ password:"False"});
              }
            }
            else{
              res.json({username:"False"});
            }
 
});
var s;
function fetchHash(uName)
{ 
  User.findOne({name:uName}, function(err, result) {
    s= result.password;
    console.log(s)
  });
  console.log(s)
  return s;
}

app.use('/',setupRoute);
// API ROUTES -------------------
// we'll get to these in a second
var apiRoutes = express.Router(); 

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) { //console.log(req,res);

  // find the user
   User.findOne({
                name: req.body.name
                }, function(err, user) {

                    if (err) throw err;

                    if (!user) {
                        res.json({ success: false, message: 'Authentication failed. User not found.' });
                    } else if (user) {

                      // check if password matches
                      password(req.body.password).verifyAgainst(user.password, function(error, verified) {
                                  if(error)
                                      throw new Error('Something went wrong!');
                                  if(!verified) {
                                       res.json({ success: false, message: 'Authentication failed. Wrong password.' });
                                  } 
                                  else {
                                      // if user is found and password is right
                                      // create a token
                                      var token = jwt.sign(user, app.get('superSecret'), {
                                          expiresInMinutes: 1440 // expires in 24 hours
                                        });

                                      // return the information including token as JSON
                                      res.json({
                                        success: true,
                                        message: 'Enjoy your token!',
                                        user: req.body.name,
                                        token: token
                                      });
                                    }
                      });
       
                  } 

          });
});
// TODO: route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// ro
// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});   

// apply the routes to our application with the prefix /api
app.use('/', apiRoutes);


// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);