var express = require('express');
var app = express();
var passport = require("passport");
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var mongoose = require('mongoose');
var User = require('./models/user');
var Note = require('./models/note');
var cors = require('cors');
var jwt = require('jsonwebtoken');
var ObjectId = require('mongodb').ObjectID;
// Node scheedule to fire delete test user data every midnight
var schedule = require('node-schedule');
 
var fileSystem = require('fs')
let secretData;
fileSystem.readFile('private.key.txt', 'utf8', function(err, data) {
	secretData = data;
});



// use it before all route definitions
var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

// ALLOWING ACCESS TO API

//Sessions 
app.use(require("express-session")({
	secret: "express secret",
	resave: false,
	saveUninitialized: false
}));
/*ITS IMPORTANT express makes uses of express session before we use passport
 MAIN POINT----> passport NEED EXPRESS SESSION FOR Authentication isLoggedIn Function*/
app.use(passport.initialize());
app.use(passport.session());
// Telling passport to use email field as username when checking request from client
passport.use(new LocalStrategy({
	usernameField: 'email'
}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// mongoose.connect('mongodb://127.0.0.1/androidRestApiTest');
mongoose.connect('mongodb://127.0.0.1/androidRestApiTest');
var db = mongoose.connection;
// mongoose.Promise = global.Promise;


// Add domain name of the angular app -> ecomapp.sameerul.com
app.use(cors({
	origin: ['http://localhost:4200']
}));

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.use(cors());
//RESTFUL API HOMEPAGE
app.get("/home", function(req, res) {
	res.json({
		"Message": "RESTFUL API HOMEPAGE"
	});
});

app.get("/register", function(req, res) {
	res.json({
		"Need": "Name, password, email, username"
	});
});
app.post("/register", function(req, res) {
	console.log("ROute called");
	var name = req.body.name;
	var password = req.body.password;
	var email = req.body.email;
	var username = req.body.username;
	console.log(name, password, email);
	/*Using  user model User, which use local mongoose strategy to check if username
	 and email exists already*/
	// 	console.log(User.find({"email":email}));

	User.findOne({
		email: email
	}, function(err, user) {
		if (err) {
			console.log("Error", err);
		}
		if (user) { /*if user found ..means email already used*/
			console.log("email already used")
			return res.json({
				"Message": "email already used"
			});
		} else {
			User.register(new User({
				name: req.body.name,
				// username: req.body.username,
				email: req.body.email
			}), req.body.password, function(err, user) {
				if (err) {
					console.log(err);
					return res.json({
						"Message": err
					});
				}
				passport.authenticate("local")(req, res, function() {
					res.json({
						"Message": "Signed Up"
					});
					console.log("Signed up", user);
					emailUser(email,username);
				});
			});
		}
	});			
});


//-----------------------
// GET LOGIN
app.get("/userLogin", function(req, res) {
	res.json({
		"Message": "Login Page"
	});
});

// -----------------------
// POST LOGIN
app.post("/login", function(req, res, next) {
console.log("req.user");
	// generate the authenticate method and pass the req/res
	passport.authenticate('local', function(err, user, info) {
		if (Object.keys(req.body).length === 0) {
			console.log("EMpty ");
			res.json({
				"Message": "Empty Body "
			})
		}
		if (err) {
			res.json({
				"Message": "user not found"
			})
		}
		if (!user) {
			return res.json({
				"Message": "User Not found Create a account"
			})
		}
		if (user) {
			payload = {
				"user_Id": user._id,
				"name": user.name,
				"email": user.email
			}
			// user.name + user.email;
			console.log(secretData)
			jwt.sign({
				user: payload
			}, "secretkey", {
				subject: payload.name,
				// FOR TESTING purpose set it to 10seconds
				// 1200sec = 20 mins
				expiresIn: '1200s'
			}, function(err, token) {
				res.json({
					"Message": "Okay",
					"name": user.name,
					token: token
				})
			})
			// return res.json({"Message": "YOLO"})
		}
	})(req, res, next);
});


app.get("/profile", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {
			// console.log(typeof(authData));
			User.findOne({
				"email": authData.user.email
			}, function(err, user) {
				// console.log(notes.title);
				if (err) throw err;
				console.log("User Updated");
				console.log(user);
				// body...
				console.log(authData.user.user_Id);
				console.log(authData.user.name);
				res.json({
					"Message": "Success",
					"id": user._id,
					"name": user.name,
					"email": user.email
				});
			});
		}
	})
});

// Update Profile
app.post("/updateProfile", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {
			// console.log(typeof(authData));
			console.log(req.body.name);
			User.update({
				"_id": ObjectId(req.body.userId)
			}, {
				$set: {
					"name": req.body.name
				}
			}, function(err, user) {
				console.log(user);
				console.log(user.name);
				if (err) throw err;
				// body...
			});
			// User.findOne({email: authData.user.email})
			User.findOne({
				"email": authData.user.email
			}, function(err, user) {
				// console.log(notes.title);
				if (err) throw err;
				console.log("User Updated");
				console.log(user);
				// body...
				console.log(authData.user.user_Id);
				console.log(authData.user.name);
				res.json({
					"Message": "Updated successfully",
					"id": user._id,
					"name": user.name,
					"email": user.email
				});
			});


		}
	})
	// console.log("Message:" + req.user.name);
});
// this should retreive all the notes from db list all. 
app.get("/addNote", isLoggedIn, function(req, res) {
	res.json({
		"Message": "USER LOGGED IN PAGE"
	});
	console.log("Message:" + req.user.name);
});

//------------------------
// POST ADDNOTE
app.post("/addNote", verifyToken, function(req, res, next) {
	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {
			console.log("Body Data " + req.body.noteTitle);
			console.log("Body Data " + req.body.noteContent);
			console.log(authData.user.user_Id);
			var noteData = new Note({
				userId: authData.user.user_Id,
				title: req.body.noteTitle,
				content: req.body.noteContent
			});
			noteData.save(function(err, notes) {
				if (err) throw err;
				console.log('Note saved successfully!');
				console.log(notes.id);
				console.log(notes);
				console.log(authData.user.user_Id);
				res.json({
					"Message": "Success",
					"savedNoteId": notes.id
				})
			});
		}
	});
});

// ---------------
// Update a note. using the note ID
app.put("/updateNote", verifyToken, function(req, res, next) {

	// variable used to check required data are sent through request
	// var id = req.body.noteId;
	// var noteTitleContent = req.body.notesTitle;
	// var noteContent = req.body.notesContent;
	// console.log(id, noteTitleContent, noteContent);

	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {

			Note.update({
				"_id": ObjectId(req.body.noteId)
			}, {
				$set: {
					"title": req.body.noteTitle,
					"content": req.body.noteContent
				}
			}, function(err, notes) {
				console.log(notes);
				if (err) throw err;
				// body...
			});
			console.log("Updated successfully");
			res.json({
				"Message": "successfull",
				"savedNoteId": req.body.noteId
			})
		}
	})


});

//---------------
// Delete a note
app.delete("/deleteNote/:noteId", verifyToken, function(req, res, next) {

	// variable used to check required data are sent through request
	// var id = req.body.noteId;
	// var noteTitleContent = req.body.notesTitle;
	// var noteContent = req.body.notesContent;
	// console.log(id, noteTitleContent, noteContent);
	var noteId = req.params.noteId;
	console.log(noteId);
	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {
			// console.log(req.body);
			// console.log(req.body.noteId);

			Note.remove({
				"_id": ObjectId(noteId)
			}, function(err, notes) {
				// console.log(notes.title);
				if (err) throw err;
				console.log("Deleted successfully");
				// body...
			});
			res.json({
				"Message": "Deleted"
			})
		}
	})


});

//  GET NOTE .get all the notes made by the user
app.get("/notes", verifyToken, function(req, res) {
	jwt.verify(req.token, "secretkey", function(err, authData) {
		if (err) {
			// res.sendStatus(403);
			res.json({
				"Message": "Authorisation Failed"
			});
		} else {
			// console.log(typeof(authData));
			Note.find({
				userId: authData.user.user_Id
			}, function(err, notes) {
				if (err) throw err;
				console.log("User ID " + authData.user.user_Id);
				console.log(notes.length);
				if (notes.length <= 0) {
					var firstNoteData = new Note({
						userId: authData.user.user_Id,
						title: "My Awesome Note Title",
						content: "Note IT here ....."
					});
					firstNoteData.save(function(err, savedNotes) {
						if (err) throw err;
						console.log('Note saved successfully!');

						// res.json({"add note page": req.body.title});
					});
				}
				Note.find({
					userId: authData.user.user_Id
				}, function(err, retrievedNotes) {
					if (err) throw err;
					// object of all the users
					res.json({
						"Result": retrievedNotes
					})
					console.log(notes);
				});
			});
		}
	})
});


// ---------------------------------------------------
app.listen(3000, function() {
	console.log('App listening on port ' + 3000);
});

// verifyToken
// TokenFormat 
// Authorisation: Bearer [CRAZYTOKEN]
function verifyToken(req, res, next) {
	// Get auth header value
	var bearerHeader = req.headers["authorization"];
	// Token Validation first
	if (typeof(bearerHeader) !== "undefined") {
		var bearer = bearerHeader.split(" ");
		// Get token from bearer array[1]
		var bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	} else {
		// res.sendStatus(403)
		res.json({
			"Message": "AAuthorisation Failed"
		});
	}
}

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/login")
}

var delete_test_userdata = schedule.scheduleJob('0 0 * * *', function(){
  console.log("I'm running every midnight! Shhhh!");
  //  testUser id = "5bdf083d7732d50256b76868";
  	Note.find({
		userId: "5bdf083d7732d50256b76868"
		}, function(err, notes) {
			if (err) throw err;
			// console.log("User ID " + authData.user.user_Id);
			if (notes.length < 0) {
				var firstNoteData = new Note({
					userId: "5bdf083d7732d50256b76868",
					title: "My Awesome Note title",
					content: "Note IT here ..... Dont save confidential info as test user"
				});
				firstNoteData.save(function(err, savedNotes) {
					if (err) throw err;
					console.log('Note saved successfully!');
					Note.find({userId: "5bdf083d7732d50256b76868" }, function(err, notes) {
					 	console.log("All notes");
					 	console.log(notes.length);
					 	if (err) throw err;

						// object of all the users
						// res.json({
						// 	"Result": notes
						// })
						console.log(notes);
					});					
						// res.json({"add note page": req.body.title});
				});
			}
			for (var i = 0; i < notes.length; i++) {
				tempNoteId = notes[i].userId;
				Note.remove({
					"userId": tempNoteId
				}, function(err, notes) {
					// console.log(notes.title);
					if (err) throw err;
					console.log("Deleted successfully");
					// body...
				});			
			}
		});
	}
);


function emailUser(userEmail,username) {
	// body...
	var nodemailer = require('nodemailer');
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'userName@username.com',
			pass: 'password1232321'
		}
	});

	var mailOptions = {
		from: 'userName@username.com',
		to: userEmail,
		subject: 'Welcome to Note IT',
		text: 'Welcome ' + username + " Note IT"
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}
