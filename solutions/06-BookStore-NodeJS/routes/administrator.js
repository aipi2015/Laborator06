var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'StudentAipi2015$',
    database: 'bookstore'
});

function processAdministrator(request, response, EventEmitter) {
    var currentTable;
    var databaseStructure = [];
    var attributes = [];
    var identifier;
    var identifierNextValue;
    var tableContent;
    var identifierRecordToBeUpdated;
    
    if (request.body.current_table) {
        currentTable = request.body.current_table;
    } 
    
    // insert operation
    if (request.body['insert.x']) {
        var columns = [];
        var values = [];
        for (var parameter in request.body) {
            if (parameter.endsWith('_insert')) {
                columns.push(parameter.substring(0, parameter.lastIndexOf('_')));
                values.push(request.body[parameter]);
            }
        }
        var query = 'INSERT INTO ' + currentTable + ' (';
        for (var index = 0; index < columns.length; index++) {
            query += columns[index] + ', ';
        }
        query = query.substring(0, query.length - 2);
        query += ') VALUES (';
        for (var index = 0; index < values.length; index++) {
            query += '\'' + values[index] + '\'' + ', ';
        }
        query = query.substring(0, query.length - 2);
        query += ')';
        connection.query(query, function(error, result) {
           if (error) {
               console.log('An error has occcurred: %s', error);
           }
           console.log('The insert operation returned with result ' + result);
        });
    }
    
    // update operation
    var update_id;
    var columns = [];
    var values = [];
    for (var parameter in request.body) {
        if (parameter.startsWith('update1_') && parameter.endsWith('.x')) {
            identifierRecordToBeUpdated = parameter.substring(parameter.indexOf('_') + 1, parameter.indexOf('.x'));
        }
        if (parameter.startsWith('update2_') && parameter.endsWith('.x')) {
            update_id = parameter.substring(parameter.indexOf('_') + 1, parameter.indexOf('.x'));
        }
        if (parameter.endsWith('update')) {
            columns.push(parameter.substring(0, parameter.substring(0, parameter.indexOf('_update')).lastIndexOf('_')));
            values.push(request.body[parameter]);
        }
    }
    if (update_id) {
        var query = 'UPDATE ' + currentTable + ' SET ';
        for (var index = 0; index < columns.length; index++) {
            query += columns[index] + '=\'' + values[index] + "\', ";
        }
        query = query.substring(0, query.length - 2);
        query += 'WHERE id = ?';
        connection.query(query, [update_id], function(error, result) {
           if (error) {
               console.log('An error has occcurred: %s', error);
           }
           console.log('The update operation returned with result ' + result);
        });
    }

    // delete operation
    var delete_id;
    for (var parameter in request.body) {
        if (parameter.startsWith('delete_') && parameter.endsWith('.x')) {
            delete_id = parameter.substring(parameter.indexOf('_') + 1, parameter.indexOf('.x'));
        }
    }
    if (delete_id) {
        var query = 'DELETE FROM ' + currentTable + ' WHERE id = ?';
        connection.query(query, [delete_id], function(error, result) {
           if (error) {
               console.log('An error has occcurred: %s', error);
           }
           console.log('The delete operation returned with result ' + result);
        });
    }
    
    // logout operation
    if (request.body['signout.x']) {
        request.session.destroy(function (error) {
            if (error) {
                console.log('An error has occurred: %s', error);
            }
        });
        response.render('login', {
           error: '' 
        });
        return;
    }
    
    connection.query('SHOW TABLES', function (error, result) {
        if (error) {
            console.log('An error has occcurred: %s', error);
        }
        for (var index = 0; index < result.length; index++) {
            databaseStructure.push(result[index].Tables_in_bookstore);
        }
        if (!currentTable) {
            currentTable = databaseStructure[0];
        }
        connection.query('DESCRIBE ' + currentTable, function (error1, result1) {
            if (error) {
                console.log('An error has occcurred: %s', error1);
            }
            for (var index = 0; index < result1.length; index++) {
                attributes.push(result1[index].Field);
                if (result1[index].Key === 'PRI') {
                    identifier = attributes[index];
                }
            }
            connection.query('SELECT MAX(' + identifier + ') AS identifierNextValue FROM '+ currentTable, function (error2, result2) {
                if (error2) {
                   console.log('An error has occcurred: %s', error1);
               }
                identifierNextValue = result2[0].identifierNextValue;
                renderAdministrator();
            });
        });
        connection.query('SELECT * FROM ' + currentTable, function(error1, result1) {
            if (error1) {
                console.log('An error has occcurred: %s', error1);
            }
            tableContent = result1;
            renderAdministrator();
        });
    });
                
    function renderAdministrator() {
        if (currentTable && databaseStructure.length !== 0 && attributes.length !== 0 && identifier && identifierNextValue && tableContent) {
            response.render('administrator', {
                display: request.session.user_display,
                currentTable: currentTable,
                databaseStructure: databaseStructure,
                attributes: attributes,
                identifier: identifier,
                identifierNextValue: identifierNextValue,
                tableContent: tableContent,
                identifierRecordToBeUpdated: identifierRecordToBeUpdated
            });
        }
    } 
}

module.exports = function(app, EventEmitter) {
    app.route('/administrator')
        .get(function(request, response) {
            processAdministrator(request, response, EventEmitter);
        })
        .post(function(request, response) {
            processAdministrator(request, response, EventEmitter);
        });
};
