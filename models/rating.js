'use strict'

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Team     = require('./team');

var ratingSchema = new Schema({
	straight: Number,
	margin_of_vicotry: Number,
	team: {type: Schema.Types.ObjectId, ref: 'Team'},
	year: Number
});

var Rating = mongoose.model('Rating', ratingSchema)

module.exports = Rating;