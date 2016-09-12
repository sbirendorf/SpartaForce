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
        var fs = require("fs");
        var data = JSON.parse(req.body.data);
		var file_url = data.imageUrl;

          // Save base64 image to disk
    
    var buff = new Buffer(file_url
        .replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
     fs.writeFile("jump.jpg", buff, function (err) {
    });
    var image = file_url;

    var dataImg = image.replace(/^data:image\/\w+;base64,/, '');
    

//end image file
    setTimeout(function() {

        var fs = require("fs");
        var r = request.post('https://' + site + '/api/savescan', function optionalCallback(err, httpResponse, body) {
              if (err) {
                       console.log("There was an error:", err);
                       res.send('{"error":{"descr":"There was an error connecting to SpartaTrac"}}');
              } else {
                       console.log("Request posted successfully! ", body);
                       res.send(body);
                     }
         })

            var form = r.form();
            form.append('sessionId', sessionId);
            form.append('aid', data.ID);
            form.append('date', data.Date);
            form.append('test_name', 'Vertical Jump');
            form.append('weight', data.WeightKG);
            form.append('vertical_jump', data.Countermovement.JumpHeight);
            form.append('switch_impulse', '');
            form.append('switch_time', '');
            form.append('ecc_rate_vert_force', data.Countermovement.AverageEccentricRateOfChange);
            form.append('ecc_rate_vert_frc_bfoot', '');
            form.append('ecc_vert_impulse', data.Countermovement.EccentricVerticalImpulse);
            form.append('con_vert_impulse', data.Countermovement.ConcentricVerticalImpulse);
            form.append('avg_vert_con_force', data.Countermovement.AverageConcentricPhaseForce);
            form.append('peak_fz', '');
            form.append('min_fz', '');
            form.append('peak_fx', '');
            form.append('peak_fx', '');
            form.append('min_fx', '');
            form.append('peak_fy', '');
            form.append('min_fy', '');
            form.append('plate_type', 'bertec');
            form.append('files[jpg]', fs.createReadStream(__dirname +'\\jump.jpg'));
           // form.append('files[jpg]', fs.createReadStream(__dirname +'\\cbk.jpg'));
        }, 1000);
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
				'sway_AverageFZ': data.Sway.AverageFZ,
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
    if (req.param("tagId") == 'save_landing') {
        var data = JSON.parse(req.body.data);
        request.post({
            url: 'https://' + site + '/api/savestabilize',
            form: {
                    'sessionId': sessionId,
                    'date': data.Date,
                    'aid': data.ID,
                    'weight': data.WeightKG,
                    'extremity': 'lower',
                    'side' : data.side, // left or right
                    'time_stabilize' : data.TimeToStabilization,
                    'result_vect_to_stabile' : data.RVTTS,
                    'time_stabile_a_p' : data.TTS_AP,
                    'time_stabile_m_l' : data.TTS_ML,
                    'relative_res_impulse' : data.Rel_Res_I,
                    'relative_peak_force' : data.Rel_Fz,
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
    if (req.param("tagId") == 'save_weight') {
        var data = JSON.parse(req.body.data);
        request.post({
            url: 'https://' + site + '/api/set_fact',
            form: { 
                    'sessionId': sessionId,
                    'date': data.Date,
                    'uid': data.uid,
                    'value': data.value,
                    'metafact': 'weight'
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



