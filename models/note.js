// note.js Defining the TABLE (Fields in Mongo DB)
var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var notesSchema = new mongoose.Schema({
	
	// Username field: save username ID and make it unique for tht user
	//get the logged in user ID and use tht ID to find the user data
	userId:{
		type:String
	},
	// title of the note
	title:{
		type:String,
		// required:true	
	},
	// content of the note
	content:{
		type:String	
	}
});

// notesSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Note", notesSchema);

