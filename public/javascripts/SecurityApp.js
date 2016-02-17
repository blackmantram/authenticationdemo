var login = angular.module('LoginCheck',[]);

login.factory('$logincheck', ["authenticationSvc", function(authenticationSvc) {
    return function(userid){
        if (authenticationSvc.getUserInfo())
            return true
        else
            return false;
    };
}]);

login.factory("authenticationSvc", ["$http","$q","$window",function ($http, $q, $window) {
    var userInfo;

    function login(userName, password) {
        var deferred = $q.defer();

        $http.post("http://127.0.0.1:8000/rest-auth/login", { username: userName, email: userName, password: password })
            .then(function (result) {
                userInfo = {
                    accessToken: result.data.key,
                    userName: userName
                };
                $window.sessionStorage["userInfo"] = JSON.stringify(userInfo);
                deferred.resolve(userInfo);
            }, function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function logout() {
        var deferred = $q.defer();

        $http({
            method: "POST",
            url: "http://127.0.0.1:8000/rest-auth/logout",
            headers: {
                "Authorization": userInfo.accessToken
            }
        }).then(function (result) {
            userInfo = null;
            $window.sessionStorage["userInfo"] = null;
            deferred.resolve(result);
        }, function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    function getUserInfo() {
        return userInfo;
    }

    function init() {
        if ($window.sessionStorage["userInfo"]) {
            userInfo = JSON.parse($window.sessionStorage["userInfo"]);
        }
    }
    init();

    return {
        login: login,
        logout: logout,
        getUserInfo: getUserInfo
    };
}]);

var app = angular.module("securityApp", ["ngRoute", "LoginCheck"]);

app.config(["$routeProvider",function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "templates/home.html",
        controller: "HomeController"
    }).when("/profile", {
        templateUrl: "templates/profile.html",
        controller: "ProfileController"
    }).when("/login", {
        templateUrl: "templates/login.html",
        controller: "LoginController"
    });
}]);

app.run(["$rootScope", "$logincheck", "$location", function ($rootScope, $logincheck, $location) {

    var performLoginCheck = function () 
    {
        var check = $logincheck();
        console.log("is user logged in? ", check);
        if( check)
        {
            $location.path('/profile');
        }
        else
        {
            $location.path('/login');
        }
    }

    $rootScope.$on("$routeChangeSuccess", function (userInfo) {
        performLoginCheck();
    });
    
}]);

app.controller("HomeController", ["$scope", "$location", function ($scope, $location) {
    $scope.start = function () {
        $location.path("/login");
    };
}]);

app.controller("ProfileController", ["$scope", "$location", "authenticationSvc", function ($scope, $location, authenticationSvc ) {
    $scope.userInfo = authenticationSvc.getUserInfo();

    $scope.logout = function () {

        authenticationSvc.logout()
            .then(function (result) {
                $scope.userInfo = null;
                $location.path("/login");
            }, function (error) {
                console.log(error);
            });
    };
}]);

app.controller("LoginController", ["$scope", "$location", "$window", "authenticationSvc",function ($scope, $location, $window, authenticationSvc) {
    $scope.userInfo = null;
    $scope.login = function () {
        authenticationSvc.login($scope.userName, $scope.password)
            .then(function (result) {
                $scope.userInfo = result;
                $location.path("/profile");
            }, function (error) {
                $window.alert("Invalid credentials");
                console.log(error);
            });
    };

    $scope.cancel = function () {
        $scope.userName = "";
        $scope.password = "";
    };
}]);