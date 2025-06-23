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
            return $http({
                method : "PUT",
                url : '/logout',
            })
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
        }).when('/admin', {
            controller: 'AdminController',
            templateUrl: 'admin.html'
        })
        .otherwise({
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
                        // Guardar el token en localStorage
                        if (response.data.token) {
                            localStorage.setItem('token', response.data.token);
                        }
                        if (response.data.isAdmin){
                            $location.path('/admin');
                        }
                        else {
                            $location.path('/list');
                        }
                    }
                });
        };
    }).controller('ListController', function ($scope, $location, emailService) {
        $scope.messages = [];
        emailService.list().then(function(response) {
            $scope.messages = response.data;
        });

        // Función de logout: realiza la petición PUT al backend para cerrar sesión
        $scope.logout = function() {
            emailService.logout().then(function(response) {
                localStorage.removeItem('token');
                $location.path('/');
            });
        };
    }).controller('DetailController', function ($scope, $routeParams, emailService) {
        $scope.params = $routeParams;

        $scope.message = {};

        // Al entrar al controlador de esta vista
        // Solicitamos los datos al servidor
        emailService.email(parseInt($routeParams.id)).then(function(response) {
            $scope.message = response.data;
        });
    }).controller('AdminController', function ($scope, $location, emailService) {
        $scope.users = [];
        emailService.list().then(function(response) {
            $scope.users = response.data;
        });

         // Función de logout: realiza la petición PUT al backend para cerrar sesión
        $scope.logout = function() {
            emailService.logout().then(function(response) {
                localStorage.removeItem('token');
                $location.path('/');
            });
        };    
    });
