'use strict'

var linereader = require('readline');
var fs = require('fs');
var mongoose = require('mongoose');
var Team = require('./models/team');
var Game = require('./models/game');
var Rating = require('./models/rating');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/college-football-rankings');

var lr = linereader.createInterface({
	input: fs.createReadStream('data/2016_regular_season.csv')
});

lr.on('line', sortData);
lr.on('close', insertData);

var teams = {};
var games = [];

function sortData(line) {
	var data = line.split(',');

	var winner = getTeamName(data[5]);
	var loser = getTeamName(data[8]);

	var game_data = {
		date: new Date(data[2] + ' ' + data[3]),
		week: Number(data[1]),
		winner: winner,
		loser: loser,
		winner_points: Number(data[6]),
		loser_points: Number(data[9]),
	}
	games.push(game_data);

	if(teams[winner] === undefined) {
		teams[winner] = {
			name: winner
		}
	}
	if(teams[loser] === undefined) {
		teams[loser] = {
			name: loser
		}
	}
}


function insertData() {
	insertTeams()
	.then(() => {
		return insertGames();
	})
	.then(() => {
		return insertRatings();
	})
	.then(() => {
		console.log('scrape complete');
		process.exit(1);
	})
	.catch((err) => {
		console.log(err);
		throw err;
	})
}

function insertTeams() {
	var promises = [];
	for(var name in teams) {
		var promise = new Promise((resolve, reject) => {
			var current_name = name;

			Team.findOne({name: teams[name].name})
			.then((data) => {
				if(data !== null) {
					teams[current_name] = data;
					resolve(data);
				} else {
					return Team.create({name: teams[current_name].name})
				}
			})
			.then((data) => {
				// console.log(data);
				teams[data.name]._id = data._id;
				resolve(data);
			})
			.catch((err) => {
				reject(err);
			});
		});
		promises.push(promise);
	}

	return Promise.all(promises);
}

function insertGames() {
	var promises = [];

	games.forEach((game) => {
		game.winner = teams[game.winner]._id;
		game.loser = teams[game.loser]._id;

		var promise = new Promise((resolve, reject) => {
			Game.findOne({winner: game.winner, loser: game.loser, date: game.date})
			.then((data) => {
				if(data !== null) {
					resolve(data);
				} else if(game.winner_points === 0 && game.loser_points === 0) {
					resolve(null);
				} else {
					return Game.create(game);
				}
			})
			.then((data) => {
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

function insertRatings() {
	var promises = [];

	for(var team_name in teams) {
		var promise = new Promise((resolve, reject) => {
			var current_name = team_name;
			var team_id = teams[team_name]._id

			Rating.findOne({team: team_id, year: 2016})
			.then((data) => {
				if(data !== null) {
					resolve(data);
				} else {
					var rating = {
						straight: 1,
						margin_of_vicotry: 1,
						team: team_id,
						year: 2016
					}
					return Rating.create(rating)
				}
			})
			.then((data) => {
				resolve(data);
			})
			.catch((err) => {
				console.log(err);
				reject(err);
			});
		});

		promises.push(promise);
	}

	return Promise.all(promises);
}


function getTeamName(team) {
	if(team.indexOf(') ') > -1) {
		return team.split(') ')[1];
	} else {
		return team;
	}
}
