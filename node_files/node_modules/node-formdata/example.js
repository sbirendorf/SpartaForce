var fileUpload = require('./index.js');

// start the server with:
// node server.js to test this example against

var defaultOptions = {
    url: 'http://localhost:27372/upload',
    method: 'POST',
    verbose: true,
    file: './file.txt',
    progress: function(){},
    error: function(){/*asdf*/},
    fields: {
        name: 'Test',
        uuid: '5fc00ddc-292a-4084-8679-fa8a7fadf1db'
    }
};

// HTTP
fileUpload(defaultOptions).then(function(data) {
    console.log(data);
    console.log('end');
}, function() {
    console.log('error', arguments);
}, function( progress ) {
    console.log('upload progress', progress);
});

//// use your own instance of request
//var request = require('request');
//// with request
//fileUpload(defaultOptions, request);