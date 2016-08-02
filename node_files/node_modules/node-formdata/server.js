// Code from: https://github.com/andrewrk/node-multiparty/blob/master/examples/upload.js
// Example code of the multiparty library....
// ONLY FOR TEST ENVIRONMENT To test against some server - start the server via node server.js
var http = require('http')
    , util = require('util')
    , multiparty = require('multiparty')
    , PORT = process.env.PORT || 27372;

var server = http.createServer(function(req, res) {
    if (req.url === '/') {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end(
                '<form action="/upload" enctype="multipart/form-data" method="post">'+
                '<input type="text" name="title"><br>'+
                '<input type="file" name="upload" multiple="multiple"><br>'+
                '<input type="submit" value="Upload">'+
                '</form>'
        );
    } else if (req.url === '/upload') {
        var form = new multiparty.Form();

        form.parse(req, function(err, fields, files) {
            if (err) {
                res.writeHead(400, {'content-type': 'text/plain'});
                res.end("invalid request: " + err.message);
                return;
            }
            res.writeHead(200, {'content-type': 'application/json'});
            var response = {
                fields: fields,
                files: files
            };
            res.end(JSON.stringify(response));
        });
    } else {
        res.writeHead(404, {'content-type': 'text/plain'});
        res.end('404');
    }
});
server.listen(PORT, function() {
    console.info('listening on http://0.0.0.0:'+PORT+'/');
});

module.exports = server;