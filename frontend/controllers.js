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

        // **APARTADO 2**: Función para obtener videos con autenticación por token
        gestorAPI.getVideos = function() {
            const token = localStorage.getItem('token');
            return $http({
                method: 'GET',
                url: '/videos',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
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
                        
                        //APARTADO 1: Guardar el token en localStorage
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
        // Inicializar la pestaña activa
        $scope.activeTab = 'usuarios';
        
        // Función para cambiar pestañas
        $scope.switchTab = function(tab) {
            $scope.activeTab = tab;
        };

        $scope.users = [];
        $scope.newUser = {};
        $scope.categorias = [];
        $scope.videos = [];
        $scope.nuevaCategoria = {};
        $scope.nuevoVideo = {};
        $scope.categoriaSeleccionada = null;

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

        // Función para cargar las categorías al iniciar el controlador
        $scope.loadCategorias = function() {
            $http.get('/admin/categorias').then(res => $scope.categorias = res.data);
        };

        // Funciones para añadir categorías
        $scope.addCategoria = function() {
            console.log("Intentando crear categoría:", $scope.nuevaCategoria);
            $http.post('/admin/categorias', $scope.nuevaCategoria).then(res => {
                $scope.categorias.push(res.data);
                $scope.nuevaCategoria = {};
            }, function(error) {
                alert(error.data.errormsg || 'Error al crear categoría');
            });
        };

        // Función para eliminar una categoría
        $scope.deleteCategoria = function(id) {
            // Si la categoría eliminada es la que está seleccionada, limpia la selección y los vídeos
            if ($scope.categoriaSeleccionada && $scope.categoriaSeleccionada.id === id) {
                $scope.categoriaSeleccionada = null;
                $scope.videos = [];
            }
            $http.delete('/admin/categorias/' + id).then(function() {
                $scope.loadCategorias();
            });
        };

        // Función para seleccionar una categoría y cargar sus videos
        $scope.selectCategoria = function(cat) {
            $scope.categoriaSeleccionada = cat;
            $http.get('/admin/categorias/' + cat.id + '/videos').then(res => $scope.videos = res.data);
        };

        // Función para añadir un nuevo video a la categoría seleccionada
        $scope.addVideo = function() {
            $http.post('/admin/categorias/' + $scope.categoriaSeleccionada.id + '/videos', $scope.nuevoVideo).then(res => {
                $scope.videos.push(res.data);
                $scope.nuevoVideo = {};
            });
        };

        // Función para eliminar un video
        $scope.deleteVideo = function(id) {
            $http.delete('/admin/videos/' + id).then($scope.selectCategoria($scope.categoriaSeleccionada));
        };

        // Cargar las categorías al iniciar el controlador
        $scope.loadCategorias();

         // Función de logout: realiza la petición PUT al backend para cerrar sesión
        $scope.logout = function() {
            gestorService.logout().then(function(response) {
                localStorage.removeItem('token');
                $location.path('/');
            });
        };
    });
