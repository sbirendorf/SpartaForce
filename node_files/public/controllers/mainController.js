var version = '2.0';
var $$ = window.jQuery;
var globals,ui;
console.log($$.fn.jquery);
function contStartApp() {
	document.title = "SpartaForce v " +version;
    var fType = window.location.href.split("/");
    var site = fType[3].substring(fType[3].indexOf("#") + 1);
    var u = fType[3].substring(0, fType[3].indexOf('#'));
    var data = {site: site, sid: u, uid: fType[4]};
    var json = JSON.stringify(data);
    $$.ajax({
        type: 'POST',
        url: "/api/post/start",
        data: {"data": json},
        success: function (result) {
			ui = new UI(); // new object instance
            var result = jQuery.parseJSON(result);
            if (result.hasOwnProperty('error')) {
                ui.setMsg(result.error.descr, true);
            } else {
                globals = new Globals(result.config);
                ui.setUserName(result.config.name);
                // localStorage.clear();
                connectToWebsocketServer();
                setTimeout(function () {
                    sendSetConfig(result.config.ZeroNow,
                            result.config.AutoZero,
                            result.config.StandStillLevel,
                            result.config.StandStill,
                            result.config.KeepData);
                    $$("#temp_div").hide();
                    $$("#cop1_div").show();
                }, 600);
            }
        },
        error: function (result) {
            console.log(result);
            ui.setMsg('Configuration failed to initialize, can not connect to SpartaTrac', true);
        }
    });
}

function Globals(obj) {
    console.log(obj);
    this.testGUID = obj.uid; // the user id ,init the value on start
    this.testId = '';
    this.jumpTestNubmer = obj.jumpTestNubmer;
    this.swayTestNumber = obj.swayTestNumber;
    this.landingTestNumber = obj.landingTestNumber;
    this.initJumpTestNubmer = obj.jumpTestNubmer;
    this.initSwayTestNumber = obj.swayTestNumber;
    this.initLandingTestNumber = obj.landingTestNumber;
    this.publish = obj.publish;;
    this.weightType = obj.WeightType;
    this.sendPercent = Number(0);
    this.weightTest ='';
    this.swayExtremity = 'lower';
    this.currentWeight; // the weight update every 100 ms by the plate
    this.flag;
    this.swayWeightValidation = false;
    this.t = -1;//time 
    this.n = 12000; // remove the line after how many ms
    this.v = 0;//value  
    this.stopChart =false;
    this.serverMessage ='';
    this.swayErrorCounter = 0;
    this.StandStill = obj.StandStill;
    this.KeepData = obj.KeepData;
    this.WebsocketPort = obj.WebsocketPort;
    this.RtnRate = obj.RtnRate;
    this.JumpTimeOfPlate = obj.JumpTimeOfPlate;
    this.WeightDiff = obj.WeightDiff;
    this.ValidationMinAverageConcentricPhaseForce = obj.ValidationMinAverageConcentricPhaseForce;
    this.ValidationMinAverageEccentricRateOfChange = obj.ValidationMinAverageEccentricRateOfChange;
    this.ValidationMinConcentricVerticalImpulse = obj.ValidationMinConcentricVerticalImpulse;
    this.ValidationMinJumpHeight = obj.ValidationMinJumpHeight;
    this.ValidationMaxJumpHeight = obj.ValidationMaxJumpHeight;
    this.ValidationRequiredStabilityDuration = obj.ValidationRequiredStabilityDuration;
    this.ValidationMinForceThreshold = obj.ValidationMinForceThreshold;
    this.ValidationMaxMSOffPlate = obj.ValidationMaxMSOffPlate;
    this.swayTimeOffPlate = obj.ValidationSwayTimeOffPlate;
    this.landingInitWeight = 0;
    this.landingMinForce = obj.ValidationLandingMinForce;
    this.totalTests = 0; 
    this.MinJumpsToScan = Number(obj.MinJumpsToScan);
    this.upperSwayWeightDiff = obj.upperSwayWeightDiff;
}
//function contStopJumpTest() {// stop the scan at the middle and remove the results
//    stopDuringTesting('ABORT');
//}

function contABORTJumpTest() {//   stop the scan at the middle of the test 
    stopDuringTesting('END');
   // stopDuringTesting('ABORT');
    ui.displayMsgRight("", false);
    globals.stopChart = true;
    ui.BtnsEnableControll(['scan','sway','landing','weight']);
}
function afterResult(data) {
    switch (data.JumpType) {
        case 'Countermovement':
            countermovementResult(data);
            break;
        case 'Sway':
            swayResult(data);
            break;
        case 'SingleLegLanding':
            singleLegLandingResult(data);
            break;
    }
}
function clearlocalStorage() {
    console.log(localStorage);
    var r = confirm("Are you sure you want to clear all tests data for this athlete?");
    if (r == true) {
         localStorage.clear();
        $$(".data-table").empty();
    } 
}
function getDataLocalStorage(max, type) {
    var json = [];
    for (var s = max; s > 0; s--) {
        var d = localStorage['Sparta_' + type + '_' + s+ '_' + globals.testGUID];
        if (d != null || d != undefined) {
            var data = jQuery.parseJSON(d);
            json[s] = JSON.stringify(data);
        }
        d = null;
    }
    return json;
}
//data in json format 
function send_date(data, domain, testType, sentPercent,testNumber) {
    ui.progressBar();
    $$.ajax({
        type: 'POST',
        url: "/api/post/" + domain,
        data: {"data": data},
        success: function (result) {
           var json = jQuery.parseJSON(result);
            if(json.status == 'error'){
                 ui.setMsg(json.error.descr, true);
                 $$(".progress-area").empty();
            }else{
                serverResultCallback(json,sentPercent,testNumber,testType);
           }
        },
        error: function (result) {
            var result = jQuery.parseJSON(result);
            console.log(result);
            ui.setMsg('Server error ,cant connect to spartaTrac ' + result, true);
        }
    });
}
//Parameters testType = scan, sway, landing
function sendDataToTrac (testType) {
    $$(".log-msg").empty();
    var max = get_max(testType);
    var totalTests = 0;
    globals.serverMessage='';
    var json = getDataLocalStorage(max, testType);
    // loop through the data to check how many tests we send to the server 
    for (var s = max; s > 0; s--) {
        if(json[s] != undefined){
            totalTests++;
        }
    }
    if(totalTests == 0){
          alert('No data found');
    }
    globals.totalTests = totalTests;
    var count =1;
    for (var s = max; s > 0; s--) {
        if(json[s] != undefined){
                send_date(json[s], 'save_'+testType, testType, count/totalTests,s);
                count++;
        }
    }
};
function serverResultCallback(result,sentPercent,testNumber,testType) {
    console.log(result);
    //if we saved the data on the server we should get a nid back 
    if(result.sid >1){
        localStorage.removeItem('Sparta_' + testType + '_' + testNumber+ '_' + globals.testGUID);// remove the data to a void duplicate
    }else{
         globals.serverMessage+='Failed to save trial '+testNumber+' data <br>' ;
    }
    if(globals.serverMessage.length >0){
        ui.setMsg(globals.serverMessage, true);
    }
    if (sentPercent == 1) {//we sent all the trails
            $$(".progress-area").empty();
            if(globals.publish == 'yes' ){
                publishResultsInSpartaTrac(testType);
            }
            ui.BtnsEnableControll(['scan','sway','landing','weight']);
    }
}
function publishResultsInSpartaTrac(testType){ 
    switch (testType) {
    case 'scan':
        callPublish('scan');
        var min = Number(globals.MinJumpsToScan)-1;
        if(globals.totalTests <=min){
            ui.displayMsgRight('Not enough trials to publish ', false);
            return 0;
        }
        break;
    case 'sway':
        callPublish('sway');
        if(globals.totalTests <=3){
            ui.displayMsgRight('Not enough trial to publish ', false);
            return 0;
        }
        break;
    case 'landing':
        callPublish('landing');
        if(globals.totalTests <=5){
            ui.displayMsgRight('Not enough trial to publish ', false);
            return 0;
        }
        break;
    }
}

function callPublish(domain){
    ui.displayMsgRight('Publishing ' + domain, false);
     $$.ajax({
        type: 'POST',
        url: "/api/post/publish_tests",
        data: {"test": domain,"uid": globals.testGUID},
        success: function (result) { 
            ui.displayMsgRight('Publish finished', false);
        },error: function (result) {
            var result = jQuery.parseJSON(result);
            console.log(result);
            ui.setMsg('SpartaTrac can not publish the test', true);
        }
    });
}
function getCurrentDateTime(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	if(dd<10) {
		dd='0'+dd
	} 

	if(mm<10) {
		mm='0'+mm
	} 
	return yyyy+'-'+mm+'-'+dd+''+time;
	
}
function getTimeStamp(){
    var d = new Date();
    return d.getTime();
}