var app = angular.module('app', []);

app.directive('contestant', function(socket) {
	var linker = function(scope, element, attrs) {
			element.hide().fadeIn();
		};

	var controller = function($scope) {
			// Incoming
			socket.on('onContestantUpdated', function(data) {
				// Update if the same contestant
				if(data.id == $scope.contestant.id) {
					$scope.contestant.display_name = data.display_name;
					$scope.contestant.score = data.score;
				}				
			});

			// Outgoing
			$scope.updateContestant = function(contestant) {
				socket.emit('updateContestant', contestant);
			};

			$scope.deleteContestant = function(id) {
				$scope.ondelete({
					id: id
				});
			};
		};

	return {
		restrict: 'A',
		link: linker,
		controller: controller,
		scope: {
			contestant: '=',
			ondelete: '&'
		}
	};
});

app.factory('socket', function($rootScope) {
	var socket = io.connect();
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if(callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});

app.controller('MainCtrl', function($scope, socket) {
	$scope.contestants = [];

  socket.emit('listContestants');

	// Incoming
  socket.on('onContestantsListed', function(data) {
    $scope.contestants.push.apply($scope.contestants, data);
  });

	socket.on('onContestantCreated', function(data) {
		$scope.contestants.push(data);
	});

	socket.on('onContestantDeleted', function(data) {
		$scope.handleDeleteContestant(data.id);
	});

	// Outgoing
	$scope.createContestant = function(display_name, score) {
		var contestant = {
			id: new Date().getTime(),
			display_name: display_name,
			score: score
		};

		$scope.contestants.push(contestant);
		socket.emit('createContestant', contestant);
	};

	$scope.deleteContestant = function(id) {
		$scope.handleDeleteContestant(id);

		socket.emit('deleteContestant', {id: id});
	};

	$scope.handleDeleteContestant = function(id) {
		console.log('HANDLE DELETE CONTESTANT', id);

		var oldContestants = $scope.contestants,
		newContestants = [];

		angular.forEach(oldContestants, function(contestant) {
			if(contestant.id !== id) {
				newContestants.push(contestant);
			}
		});

		$scope.contestants = newContestants;
	}
});