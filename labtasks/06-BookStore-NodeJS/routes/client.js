var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'StudentAipi2015$',
    database: 'bookstore'
});

function processClient(request, response, EventEmitter) {

    var recordsPerPageValue = 1;
    var previousRecordsPerPageValue = 1;
    var pageValue = 1;
    var formatsList = [];
    var formatsFilter = [];
    var languagesList = [];
    var languagesFilter = [];
    var categoriesList = [];
    var categoriesFilter = [];
    var books = [];
    var errorMessage = '';
    var shoppingCart = [];
    var filterChange = false;

    if (request.body['recordsperpage']) {
        recordsPerPageValue = request.body['recordsperpage'];
    }
    if (request.body['previousrecordsperpage']) {
        previousRecordsPerPageValue = request.body['previousrecordsperpage'];
    }
    if (request.body['page']) {
        pageValue = request.body['page'];
    }
    if (previousRecordsPerPageValue !== recordsPerPageValue) {
        pageValue = 1;
    }
    previousRecordsPerPageValue = recordsPerPageValue;
    if (request.session.formatsFilter) {
        formatsFilter = request.session.formatsFilter;
    }
    if (request.session.languagesFilter) {
        languagesFilter = request.session.languagesFilter;
    }
    if (request.session.categoriesFilter) {
        categoriesFilter = request.session.categoriesFilter;
    }
    if (request.session.shoppingCart) {
        shoppingCart = request.session.shoppingCart;
    }

    if (request.body['insert_format.x']) {
        var format = request.body['currentFormat'];
        if (formatsFilter.indexOf(format) === -1) {
            formatsFilter.push(format);
            filterChange = true;
        }
    }
    var delete_format;
    for (var parameter in request.body) {
        if (parameter.startsWith('delete_format_') && parameter.endsWith('.x')) {
            delete_format = parameter.substring(parameter.lastIndexOf('_') + 1, parameter.indexOf('.x'));
        }
    }
    if (delete_format) {
        var position = formatsFilter.indexOf(delete_format);
        if (position !== -1) {
            formatsFilter.splice(position, 1);
            filterChange = true;
        }
    }

    // TODO: exercise 7

    if (request.body['insert_category.x']) {
        var category = request.body['currentCategory'];
        if (categoriesFilter.indexOf(category) === -1) {
            categoriesFilter.push(category);
            filterChange = true;
        }
    }
    var delete_category;
    for (var parameter in request.body) {
        if (parameter.startsWith('delete_category_') && parameter.endsWith('.x')) {
            delete_category = parameter.substring(parameter.lastIndexOf('_') + 1, parameter.indexOf('.x'));
        }
    }
    if (delete_category) {
        var position = categoriesFilter.indexOf(delete_category);
        if (position !== -1) {
            categoriesFilter.splice(position, 1);
            filterChange = true;
        }
    }
    
    var bookPresentationId;
    var quantity;
    var shoppingCartProcessing = false;
    
    // TODO: exercise 8
    
    function generateIdentificationNumber(numberOfLetters, numberOfDigits) {
        var result = '';
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var digits = '0123456789';
        for (var index = 0; index < numberOfLetters; index++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (var index = 0; index < numberOfDigits; index++) {
            result += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return result;
    }
    
    var commandProcessing = false;
    
    // TODO: exercise 11

    // TODO: exercise 12

    connection.query('SELECT value FROM format', function (error, result) {
        if (error) {
            console.log('An error has occcurred: %s', error);
        }
        for (var index = 0; index < result.length; index++) {
            formatsList.push(result[index].value);
        }
        renderClient();
    });

    connection.query('SELECT name FROM language', function (error, result) {
        if (error) {
            console.log('An error has occcurred: %s', error);
        }
        for (var index = 0; index < result.length; index++) {
            languagesList.push(result[index].name);
        }
        renderClient();
    });

    connection.query('SELECT name FROM category', function (error, result) {
        if (error) {
            console.log('An error has occcurred: %s', error);
        }
        for (var index = 0; index < result.length; index++) {
            categoriesList.push(result[index].name);
        }
        renderClient();
    });

    var categories = '';
    if (categoriesFilter.length !== 0 ) {
       for (var index = 0; index < categoriesFilter.length; index++) {
           categories += '\'' + categoriesFilter[index] + '\', ';
       }
       categories = categories.substring(0, categories.length - 2);
    }
    var bookProcessing = false;
    if (filterChange === true || !request.session.books) {
        var query = 'SELECT b.id AS id,\n\
                            b.title AS title,\n\
                            b.subtitle AS subtitle,\n\
                            (SELECT COALESCE(GROUP_CONCAT(DISTINCT CONCAT(w.first_name, \' \', w.last_name) SEPARATOR \', \'), \'* * *\')\n\
                             FROM author a, writer w\n\
                             WHERE a.book_id = b.id AND w.id = a.writer_id) AS writers,\n\
                            b.description AS description,\n\
                            cl.name AS collection,\n\
                            ph.name AS publishing_house,\n\
                            c.name AS country,\n\
                            b.edition AS edition,\n\
                            b.printing_year AS printing_year,\n\
                            (SELECT COALESCE(GROUP_CONCAT(DISTINCT c.name SEPARATOR \', \'), \'-\') \n\
                             FROM category_content cc, category c\n\
                             WHERE cc.book_id = b.id AND c.id = cc.category_id) AS categories\n\
                     FROM book b, collection cl, publishing_house ph, country c\n\
                     WHERE cl.id = b.collection_id AND ph.id = cl.publishing_house_id AND c.id = ph.country_id'
                     + ((categories.length !== 0) ? ' AND EXISTS(SELECT cc.id FROM category_content cc WHERE cc.book_id = b.id AND cc.category_id IN (SELECT id FROM category WHERE name IN (' + categories + ')))' : '')
                     + ' ORDER BY b.id ASC';
        connection.query(query, function (error, result) {
            if (error) {
                console.log('An error has occcurred: %s', error);
            }
            var formats = '';
            if (formatsFilter.length !== 0 ) {
               for (var index = 0; index < formatsFilter.length; index++) {
                   formats += '\'' + formatsFilter[index] + '\', ';
               }
               formats = formats.substring(0, formats.length - 2);
            }
            var languages = '';
            if (languagesFilter.length !== 0 ) {
               for (var index = 0; index < languagesFilter.length; index++) {
                   languages += '\'' + languagesFilter[index] + '\', ';
               }
               languages = languages.substring(0, languages.length - 2);
            }
            var bookPresentationEvent = function(index) {
                if (index >= result.length) {
                   EventEmitter.emit('bookPresentationEnd');
                   return;
                }
                var query1 = 'SELECT bp.id AS id,\n\
                                     bp.isbn AS isbn,\n\
                                     f.value AS format,\n\
                                     l.name AS language,\n\
                                     bp.price AS price,\n\
                                     bp.stockpile AS stockpile\n\
                              FROM book_presentation bp, format f, language l\n\
                              WHERE bp.book_id = ? \n\
                                    AND f.id = bp.format_id\n\
                                    AND l.id = bp.language_id'
                              + ((formats.length !== 0) ? ' AND f.value IN (' + formats + ')' : '')
                              + ((languages.length !== 0) ? ' AND l.name IN (' + languages + ')' : '')
                              + ' ORDER BY bp.id ASC';
                var book_id = result[index].id;
                connection.query(query1, [book_id], function (error1, result1) {
                    if (error1) {
                        console.log('An error has occcurred: %s', error1);
                    }
                    if (result1.length !== 0) {
                        var book = {
                            id: result[index].id,
                            title: result[index].title,
                            subtitle: result[index].subtitle,
                            writers: result[index].writers,
                            description: result[index].description,
                            collection: result[index].collection,
                            publishing_house: result[index].publishing_house,
                            country: result[index].country,
                            edition: result[index].edition,
                            printing_year: result[index].printing_year,
                            categories: result[index].categories,
                            presentations: result1
                        };
                        books.push(book);
                    }
                    EventEmitter.emit('bookPresentationStart', (index + 1));
                });
            };
            EventEmitter.addListener('bookPresentationStart', bookPresentationEvent);
            EventEmitter.addListener('bookPresentationEnd', function() {
                bookProcessing = true;
                renderClient();
            });
            EventEmitter.emit('bookPresentationStart', 0);
        });
    } else {
        books = request.session.books;
    }

    function renderClient() {
        if ((formatsList.length !== 0) && (languagesList.length !== 0) && (categoriesList.length !== 0) 
                && ((bookProcessing === true && (filterChange === true || !request.session.books)) || (bookProcessing === false && (filterChange === false && request.session.books))) 
                && ((request.body['completecommand.x'] && commandProcessing === true) || (!request.body['completecommand.x'] && commandProcessing === false))
                && ((bookPresentationId && quantity && shoppingCartProcessing === true) || (!bookPresentationId && !quantity && shoppingCartProcessing === false))) {
            request.session.formatsFilter = formatsFilter;
            request.session.languagesFilter = languagesFilter;
            request.session.categoriesFilter = categoriesFilter;
            request.session.shoppingCart = shoppingCart;
            request.session.books = books;
            EventEmitter.removeAllListeners();
            response.render('client', {
                display: request.session.user_display,
                recordsPerPageValue: recordsPerPageValue,
                previousRecordsPerPageValue: previousRecordsPerPageValue,
                recordsPerPageValues: [1, 5, 10, 15, 20, 25, 40, 50, 60, 75, 80, 100],
                pageValue: pageValue,
                formatsList: formatsList,
                formatsFilter: formatsFilter,
                languagesList: languagesList,
                languagesFilter: languagesFilter,
                categoriesList: categoriesList,
                categoriesFilter: categoriesFilter,
                books: books,
                errorMessage: errorMessage,
                shoppingCart: shoppingCart
            });
        }
    }
}

module.exports = function (app, EventEmitter) {
    app.route('/client')
            .get(function (request, response) {
                processClient(request, response, EventEmitter);
            })
            .post(function (request, response) {
                processClient(request, response, EventEmitter);
            });
};