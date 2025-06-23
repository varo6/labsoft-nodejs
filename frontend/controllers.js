'use strict';

angular.module('AMail', ['ngRoute'])
    .factory('emailService', ($http) =>{
        var emailAPI = {};

        emailAPI.login = function(username, password) {
            return $http({
                method : "POST",
                url : '/login',
                data : {
                    user : username,
                    passwd : password
                }
            });
        };

        emailAPI.logout = function() {
            return $http.get('/logout');
        };

        emailAPI.list = function() {
            return $http.get('/list');
        };

        emailAPI.email = function(id) {
            return $http.get('/email/' + id);
        };

        return emailAPI;
    })
    .config(function($routeProvider) {
        $routeProvider.when('/', {
            controller: 'LoginController',
            templateUrl: 'login.html'
        }).when('/list', {
            controller: 'ListController',
            templateUrl: 'list.html'
        }).when('/view/:id', {
            controller: 'DetailController',
            templateUrl: 'detail.html'
        }).otherwise({
            redirectTo: '/'
        });
    }).controller('LoginController', function($scope, $location, emailService) {
        $scope.registered = false;
        $scope.user = "";
        $scope.passwd = "";

        $scope.register = () => {
            emailService.login($scope.user, $scope.passwd)
                .then(function(response) {
                    $scope.registered = response.data.id != undefined;
                    if ($scope.registered) {
                        $scope.userdata = response.data;
                        $location.path('/list');
                    }
                });
        };

        $scope.unregister = () => {
            $scope.registered = false;
            emailService.logout();
        };

    }).controller('ListController', function ($scope, emailService) {
        $scope.messages = [];

        // Al entrar al controlador de la vista
        // Solicitamos los datos al servidor
        emailService.list().then(function(response) {
            $scope.messages = response.data;
        });

    }).controller('DetailController', function ($scope, $routeParams, emailService) {
        $scope.params = $routeParams;

        $scope.message = {};

        // Al entrar al controlador de esta vista
        // Solicitamos los datos al servidor
        emailService.email(parseInt($routeParams.id)).then(function(response) {
            $scope.message = response.data;
        });
    });
