// server.js

// set up ========================
var express = require('express');
var app = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var request = require('request');
// configuration =================

app.use(express.static(__dirname + '/public'));                 // set the static files location /public
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());

//global 
var sessionId;
var site = '';
// listen (start app with node server.js) ======================================
app.listen(9000);
console.log("SpartaForce listening on port 9000");
app.post('/api/post/:tagId', function (req, res) {
    if (req.param("tagId") == 'start') {
        var data = JSON.parse(req.body.data);
        sessionId = data.sid;
        site = data.site;
        request.post({
            url: 'https://' + data.site + '/api/bertec_setting/' + data.uid,
            form: {
                'uid': data.uid
            }
        }, function (error, response, body) {
            if (error) {
                console.log("Error:", error);
                res.send('{"error":{"descr":"error connecting to SpartaTrac"}}');
            } else {
                console.log("Request posted successfully! ", body);
                res.send(body);
            }
        });
    }
    if (req.param("tagId") == 'save_scan') {
        var data = JSON.parse(req.body.data);
        request.post({
            url: 'https://' + site + '/api/savescan',
            form: {
                'sessionId': sessionId,
                'date': data.Date,
                'aid': data.ID,
                'test_name': 'Vertical Jump',
                'weight': data.WeightKG,
                'vertical_jump': data.Countermovement.JumpHeight,
                'switch_impulse': '',
                'switch_time': '',
                'ecc_rate_vert_force': data.Countermovement.AverageEccentricRateOfChange,
                'ecc_rate_vert_frc_bfoot': '',
                'ecc_vert_impulse': data.Countermovement.EccentricVerticalImpulse,
                'con_vert_impulse': data.Countermovement.ConcentricVerticalImpulse,
                'avg_vert_con_force': data.Countermovement.AverageConcentricPhaseForce,
                'peak_fz': '',
                'min_fz': '',
                'peak_fx': '',
                'min_fx': '',
                'peak_fy': '',
                'min_fy': '',
                'plate_type': 'bertec'
            }
        }, function (error, response, body) {
            if (error) {
                console.log("There was an error:", error);
                res.send('{"error":{"descr":"There was an error connecting to SpartaTrac"}}');
            } else {
                console.log("Request posted successfully! ", body);
                res.send(body);
            }
        });
    }
    if (req.param("tagId") == 'save_sway') {
        var data = JSON.parse(req.body.data);
        request.post({
            url: 'https://' + site + '/api/savesway',
            form: {
                'sessionId': sessionId,
                'date': data.Date,
                'aid': data.ID,
                'weight': data.WeightKG,
                'extremity': data.extremity,
                'side': data.side,
                'sway_velocity': data.Sway.TotalVelocityMs,
                'sway_vel_ant_post': data.Sway.APVelocityMs,
                'sway_vel_med_lat': data.Sway.MLVelocityMs,
                //new values
                'vel_ant_post_int_1': data.Sway.AP_Vel_1,
                'vel_ant_post_int_2': data.Sway.AP_Vel_2,
                'vel_med_lat_int_1': data.Sway.ML_Vel_1,
                'vel_med_lat_int_2': data.Sway.ML_Vel_2,
                'fre_tot_med_lat_int_1': data.Sway.f_ML_1,
                'fre_tot_med_lat_int_2': data.Sway.f_ML_2,
                'files': '',
                'plate_type': 'bertec'
            }
        }, function (error, response, body) {
            if (error) {
                console.log("There was an error:", error);
                res.send('{"error":{"descr":"There was an error connecting to SpartaTrac"}}');
            } else {
                console.log("Request posted successfully! ", body);
                res.send(body);
            }
        });
    }
    if (req.param("tagId") == 'publish_tests') {
//        console.log(req.body.test);
//        console.log(req.body.uid);
//        console.log(sessionId);   
        request.post({
            url: 'https://' + site + '/api/publish_tests',
            form: {
                'sessionId': sessionId,
                'uid': req.body.uid,
                'test': req.body.test
            }
        }, function (error, response, body) {
            if (error) {
                console.log("There was an error:", error);
                res.send('{"error":{"descr":"SpartaTrac can not publish the test"}}');
            } else {
                console.log("published successfully! ", body);
                res.send(body);
            }
        });
    }

});
app.get('*', function (req, res) {
    res.sendfile('./public/index.html'); // load the single view file
});



