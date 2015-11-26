var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'StudentAipi2015$',
    database: 'bookstore'
});

function processLogin(request, response) {
    var username;
    var password;
    if (request.body.username) {
        username = request.body.username;
    }
    if (request.body.password) {
        password = request.body.password;
    }
    if (username && password) {
        connection.query('SELECT u.id, u.type FROM user u WHERE u.username = ? AND u.password = ?', [username, password], function (error, result) {
            if (error) {
                console.log('An error has occurred: %s', error);
            }
            if (result.length === 1) {
                request.session.user_id = result[0].id;
                connection.query('SELECT CONCAT(u.first_name, \' \', u.last_name) AS display FROM user u WHERE u.id = ?', [request.session.user_id], function (error1, result1) {
                    request.session.user_display = result1[0].display;
                    if (result[0].type === 'administrator') {
                        response.redirect('/administrator');
                        return;
                    }
                    if (result[0].type === 'client') {
                        response.redirect('/client');
                        return;
                    }
                });
            } else {
                response.render('login', {
                    error: 'Either username or password are incorrect'
                });
            }
        });
    } else {
        response.render('login', {
            error: ''
        });
    }
}

module.exports = function(app, EventEmitter) {
    app.route('/')
        .get(function(request, response) {
            processLogin(request, response, EventEmitter);
        })
        .post(function(request, response) {
            processLogin(request, response, EventEmitter);
        });
    app.route('/login')
        .get(function(request, response) {
            processLogin(request, response, EventEmitter);
        })
        .post(function(request, response) {
            processLogin(request, response, EventEmitter);
        });
};
