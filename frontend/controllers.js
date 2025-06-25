'use strict';

angular.module('gestorMultimedia', ['ngRoute'])
    .factory('gestorService', ($http) =>{
        var gestorAPI = {};

        gestorAPI.login = function(username, password) {
            return $http({
                method : "POST",
                url : '/login',
                data : {
                    user : username,
                    passwd : password
                }
            });
        };

        gestorAPI.logout = function() {
            return $http({
                method : "PUT",
                url : '/logout',
            })
        };

        gestorAPI.list = function() {
            return $http.get('/list');
        };

        gestorAPI.email = function(id) {
            return $http.get('/email/' + id);
        };

        return gestorAPI;
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
    }).controller('LoginController', function($scope, $location, gestorService) {
        $scope.registered = false;
        $scope.user = "";
        $scope.passwd = "";

        $scope.register = () => {
            gestorService.login($scope.user, $scope.passwd)
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
    }).controller('ListController', function ($scope, $location, gestorService) {
        $scope.messages = [];
        gestorService.list().then(function(response) {
            $scope.messages = response.data;
        });

        // Función de logout: realiza la petición PUT al backend para cerrar sesión
        $scope.logout = function() {
            gestorService.logout().then(function(response) {
                localStorage.removeItem('token');
                $location.path('/');
            });
        };
    }).controller('DetailController', function ($scope, $routeParams, gestorService) {
        $scope.params = $routeParams;

        $scope.message = {};

        // Al entrar al controlador de esta vista
        // Solicitamos los datos al servidor
        gestorService.email(parseInt($routeParams.id)).then(function(response) {
            $scope.message = response.data;
        });
    }).controller('AdminController', function ($scope, $location, $http, gestorService) {
        $scope.users = [];
        $scope.newUser = {};

        $http.get('/admin/users').then(function(response) {
            $scope.users = response.data;
        });

        // Función para añadir un nuevo usuario
        $scope.addUser = function() {
            $http.post('/admin/users', $scope.newUser).then(function(response) {
            $scope.users.push(response.data);
            $scope.newUser = {}; // Limpiar el formulario
        }, function(error) {
            alert(error.data.errormsg || 'Error al crear usuario');
        });
        };

        // Función para eliminar un usuario
        $scope.deleteUser = function(userId) {
            $http.delete('/admin/users/' + userId).then(function(response) {
                $scope.users = $scope.users.filter(user => user.id !== userId);
            }, function(error) {
                alert(error.data.errormsg || 'Error al eliminar usuario');
            })
        };

        // Función para editar un usuario
        $scope.editUser = function(user) {
            $http.put('/admin/users/' + user.id, {
                username: user.username,
                name: user.name,
                password: user.password
            }).then(function(response) {
                // Actualizar el usuario en la lista
                const index = $scope.users.findIndex(u => u.id === user.id);
                if (index !== -1) {
                    $scope.users[index].login = user.username;
                    $scope.users[index].name = user.name;
                    // No se actualiza la contraseña en la lista por seguridad
                }
                alert('Usuario modificado correctamente');
            }, function(error) {
                alert(error.data.errormsg || 'Error al editar usuario');
            });
        };

         // Función de logout: realiza la petición PUT al backend para cerrar sesión
        $scope.logout = function() {
            gestorService.logout().then(function(response) {
                localStorage.removeItem('token');
                $location.path('/');
            });
        };    
    });
