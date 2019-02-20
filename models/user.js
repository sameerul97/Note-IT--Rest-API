// User.js Defining the TABLE (Fields in Mongo DB)
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var usersSchema = new mongoose.Schema({
	// Username field
	name:{
		type:String,
		required:true
	},
	// username:{
	// 	type:String,
	// 	// unique:true,
	// 	required:true
	// },
	// email field
	email:{
		type:String,
		unique:true,
		required:true	
	},
	// Password field
	password:{
		type:String	
	},

	// By default it will set as false, once the user activates through automatic email it will be true
	active: {
        type: Boolean,
        default: false
    }
});

// Telling passport to use email  as username when signing up.
usersSchema.plugin(passportLocalMongoose, { usernameField : 'email' });

// usersSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User",usersSchema);

