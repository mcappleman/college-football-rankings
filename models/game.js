'use strict'

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Team     = require('./team');

var gameSchema = new Schema({
	date: Date,
	week: Number,
	winner: {type: Schema.Types.ObjectId, ref: 'Team'},
	loser: {type: Schema.Types.ObjectId, ref: 'Team'},
	winner_points: Number,
	loser_points: Number,
});

var Game = mongoose.model('Game', gameSchema)

module.exports = Game;