'use strict'

var fs = require('fs');
var mongoose = require('mongoose');
var Rating = require('./models/rating');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/college-football-rankings');

var sortedMargin = [];
var sortedStraight = [];

function main() {

	Rating.find()
	.populate('team')
	.sort({'straight': -1})
	.then((data) => {
		sortedStraight = data;
	})
	.then(() => {
		return Rating.find()
		.populate('team')
		.sort({'margin_of_vicotry': -1})
	})
	.then((data) => {
		sortedMargin = data;
	})
	.then(writeStraight)
	.then(writeMargin)
	.catch((err) => {
		console.log(err);
		throw err;
	});

}

main();


function writeStraight() {
	var filename = './csv/straight-rankings-2016.csv';
	fs.writeFileSync(filename, 'Rank,Rating,Team\n', 'utf8', errorCallback);
	sortedStraight.forEach((rating, index) => {
		var line = index+1 + ',' + rating.straight + ',' + rating.team.name + '\n';
		// writeFile(filename, line);
		fs.appendFileSync(filename, line, 'utf8');

		if(index === sortedStraight.length-1) {
			straightDone = true;
			checkDone();
		}
	});
}

function writeMargin() {
	var filename = './csv/margin-rankings-2016.csv';
	fs.writeFileSync(filename, 'Rank,Rating,Team\n', 'utf8', errorCallback);
	sortedMargin.forEach((rating, index) => {
		var line = index+1 + ',' + rating.margin_of_vicotry + ',' + rating.team.name + '\n';
		// writeFile(filename, line);
		fs.appendFileSync(filename, line, 'utf8');

		if(index === sortedMargin.length-1) {
			marginDone = true;
			checkDone();
		}
	});
}

function errorCallback(err) {
	if(err) throw err;
}

var straightDone = false;
var marginDone = false;
function checkDone() {
	console.log(marginDone, straightDone)
	if(marginDone && straightDone) {
		process.exit(0);
	}
}