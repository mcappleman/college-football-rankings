'use strict'

var mongoose = require('mongoose');
var Team = require('./models/team');
var Game = require('./models/game');
var Rating = require('./models/rating');

var teams = [];
var baseRatings = {};

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/college-football-rankings');

function main() {

	grabTeams()
	.then(grabRatings)
	.then(computeRatings)
	.then(insertRatings)
	.catch((err) => {
		console.log(err);
		throw err;
	});

}

main();

function grabTeams() {
	return new Promise((resolve, reject) => {
		Team.find()
		.then((data) => {
			teams = data;
			resolve(data);
		})
		.catch((err) => {
			reject(err);
		});
	});
}

function grabRatings() {
	var promises = [];

	teams.forEach(function(team) {
		var promise = new Promise((resolve, reject) => {
			var teamId = team._id
			Rating.findOne({team: teamId, year: 2016})
			.then((data) => {
				baseRatings[teamId] = data;
				resolve(data);
			})
			.catch((err) => {
				reject(err);
			});
		});

		promises.push(promise);
	});

	return Promise.all(promises);
}

function computeRatings() {

	return startIteration(baseRatings)
	.then((data) => {
		console.log('Returned Here');
		return data;
	})

}

var index = 0;
var limit = 5000;

function startIteration(ratings) {
	return new Promise((resolve, reject) => {
		iter(ratings);

		function iter(data) {
			if(index > limit) {
				resolve(data);
			}

			return iterateSchedule(data)
			.then((data) => {
				index++;
				console.log('Iter Again', data['584f7f8d905ed90704427fd4'].straight, data['584f7f8d905ed90704427fd4'].margin_of_vicotry);
				iter(data);
			})
			.catch((err) => {
				reject(err);
			});
		}
	});
}

function insertRatings(updated) {

	var promises = [];

	for(var key in updated) {
		var promise = new Promise((resolve, reject) => {
			var rating = updated[key];
			Rating.update({_id: rating._id}, rating)
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				reject(err);
			});
		});

		promises.push(promise);
	}

	return Promise.all(promises)
	.then(() => {
		process.exit(1);
	})
	.catch((err) => {
		console.log(err);
		throw err;
	})
}

function iterateSchedule(currentRatings) {
	var promises = [];

	teams.forEach((team) => {

		var promise = new Promise((resolve, reject) => {
			var currentTeam = team;
			var teamId = team._id;
			var wins = [];
			var losses = [];
			
			Game.find({winner: teamId})
			.then((data) => {
				wins = data;
			})
			.then(() => {
				return Game.find({loser: teamId})
			})
			.then((data) => {
				losses = data;
			})
			.then(() => {
				currentRatings[teamId].straight = getStraightRating(wins, losses, currentRatings);
				currentRatings[teamId].margin_of_vicotry = getMarginRating(wins, losses, currentRatings);
				resolve(currentRatings[teamId]);
			})
			.catch((err) => {
				reject(err);
			});
		});

		promises.push(promise);
	});

	return Promise.all(promises)
	.then(() => {
		return currentRatings;
	});
}

function getStraightRating(wins, losses, ratingsMap) {
	var numWins = wins.length;
	var denominator = 0;
	denominator += getDenominator(wins, ratingsMap, 'straight');
	denominator += getDenominator(losses, ratingsMap, 'straight');
	return numWins/denominator;
}

function getMarginRating(wins, losses, ratingsMap) {
	var numWins = 0;
	wins.forEach((win) => {
		numWins += win.winner_points/(win.winner_points + win.loser_points);
	});
	losses.forEach((loss) => {
		numWins += loss.loser_points/(loss.winner_points + loss.loser_points);
	});

	var denominator = 0;
	denominator += getDenominator(wins, ratingsMap, 'margin_of_vicotry');
	denominator += getDenominator(losses, ratingsMap, 'margin_of_vicotry');

	return numWins/denominator;
}

function getDenominator(games, ratingsMap, type) {
	var value = 0;
	games.forEach((game) => {
		value += 1/(ratingsMap[game.winner][type] + ratingsMap[game.loser][type]);
	});
	return value;
}
