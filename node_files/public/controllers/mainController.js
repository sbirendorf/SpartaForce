var version = '1.9';
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
    this.t = -1;//time 
    this.n = 12000; // remove the line after how many ms
    this.v = 0;//value  
    this.stopChart =false;
    this.serverMessage ='';
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
}
//function contStopJumpTest() {// stop the scan at the middle and remove the results
//    stopDuringTesting('ABORT');
//}

function contABORTJumpTest() {//   stop the scan at the middle of the test 
    stopDuringTesting('END');
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
    localStorage.clear();
    $$(".data-table").empty();
    console.log(localStorage);
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
   // console.log(data);
    ui.progressBar();
    $$.ajax({
        type: 'POST',
        url: "/api/post/" + domain,
        data: {"data": data},
        success: function (result) {
            console.log(result);
            serverResultCallback(jQuery.parseJSON(result),sentPercent,testNumber,testType);
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
         globals.serverMessage+='Failed to save trail '+testNumber+' data <br>' ;
    }
    if(globals.serverMessage.length >0){
        ui.setMsg(globals.serverMessage, true);
    }
    if (sentPercent == 1) {//we sent all the trails
            $$(".progress-area").empty();
            if(globals.publish == 'yes'){
                publishResultsInSpartaTrac(testType);
            }
            ui.BtnsEnableControll(['scan','sway','landing','weight']);
    }
}
function publishResultsInSpartaTrac(testType){
    ui.displayMsgRight('Publishing ' + testType, false);
    console.log(testType);
    var domain='';
    switch (testType) {
    case 'scan':
        domain = "scan";
        break;
    case 'sway':
        domain = "sway";
        break;
    case 'landing':
        domain = "landing";
        break;
    }
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
	return yyyy+'-'+mm+'-'+dd+' '+time;
	
}
