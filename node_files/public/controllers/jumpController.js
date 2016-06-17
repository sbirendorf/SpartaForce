function contStartJumpTest() {
    globals.stopChart = false;
    globals.t = 0;
    startJump();
    ui.displayMsg('Jump Number :' + globals.jumpTestNubmer);
    startScanRealTimeChart();
    $$("#sway").hide();
    $$("#scan").show();
    ui.BtnsEnableControll(['scan','stop']);
}
//simple validation before we save the data
function validateJumpResult(data) {
    if (data.Countermovement.JumpHeight < globals.ValidationMinJumpHeight || data.JumpHeight > globals.ValidationMaxJumpHeight) {
        ui.setMsg('Invalid jump height', true);
        return true;
    } 
    if (data.Countermovement.AverageConcentricPhaseForce < globals.ValidationMinAverageConcentricPhaseForce) {
         ui.setMsg('Invalid jump', true);
        return true;
    }
    if (data.Countermovement.AverageEccentricRateOfChange < globals.ValidationMinAverageEccentricRateOfChange) {
        ui.setMsg('Invalid jump', true);
        return true;
    }
    if (data.Countermovement.ConcentricVerticalImpulse < globals.ValidationMinConcentricVerticalImpulse) {
        ui.setMsg('Invalid jump', true);
        return true;
    } 
    var num= Number(globals.jumpTestNubmer)+1;
    var lastJump = localStorage['Sparta_scan_' + num+ '_' + globals.testGUID];
    if (lastJump != null || lastJump != undefined) {//if not the first jump
         lastJump = jQuery.parseJSON(lastJump);
         if(Math.abs(lastJump.WeightKG - data.WeightKG) > globals.WeightDiff){
             ui.setMsg('Invalid weight', true);
             return true;
         }
    }
    return false;
}
//scan results 
function countermovementResult(data) {
    globals.stopChart = true;
    //if pounds convert the weight, notice the object name still WeightKG
     data.WeightKG = ui.convertWeight(data.WeightKG);
    var invalid = validateJumpResult(data);
    if (invalid) {
        ui.displayMsg('');
    } else {
        ui.displayMsgRight('Jump Height ' + Number(100 * data.Countermovement.JumpHeight).toFixed(), false);
        d = new Date();
        data.Date = d.yyyymmdd();
        var data = JSON.stringify(data);
        //data= '{"Command": "RESULTS","ID": "testguid","JumpType": "Countermovement","Result": "OK","Reason": "foobar","Timestamp": "ms","ResultsTimestamp": "ms","WeightKG": "230.44","Countermovement": {"JumpHeightM": "123.4","EccRateOfFzNs": "3","NormalConcImpNSKg": "4.3","NormAvgConcForceN": "0.2"},"Sway": {"MLVelocityMs": "4","APVelocityMs": "0.3","TotalVelocityMs": "6.4"},"SingleLegLanding": {"NormalizedMaxVerticalForce": "5","TimeToStabilization": "5.2","MLTTS": "0.5","APTTS": "1.1","RVTTS": "0"},"Fz": ["44.2","44.3","44.21","45.7"],"Mx": ["1.2","3.1",".21","5.4"],"My": ["0.2","0.1","3.1","'+numberOfJumps+'"]}';
        localStorage.setItem("Sparta_scan_" + globals.jumpTestNubmer+ '_' + globals.testGUID, data);
        console.log(localStorage['Sparta_scan_' + globals.jumpTestNubmer+ '_' + globals.testGUID]);
        var q = jQuery.parseJSON(localStorage['Sparta_scan_' + globals.jumpTestNubmer+ '_' + globals.testGUID]);
        console.log(q.Command);
        globals.jumpTestNubmer--;
    }
    //test again 
    if (globals.jumpTestNubmer > 0) {
        setTimeout(function () {
            drawData = true;
            contStartJumpTest();
            ui.displayMsg('Jump Number :' + globals.jumpTestNubmer);
        }, 5000);
    } else {//test is over 
        var r = confirm("Test Over! Send data to sparta Trac?");
        if (r == true) {
            sendDataToTrac('scan');
        }
        globals.jumpTestNubmer = globals.initJumpTestNubmer;
        ui.displayMsg('');
    }
}
function jumpProgress(obj) {
    if (obj.Status == 'waitingforstill') {
        $$(".log-msg").empty();
        ui.displayMsgRight("Stand Still ,Time Remain " + obj.TimeRemainSec.toFixed(0), false);
    }
    if (obj.Status == 'protocolstart') {
        $$(".log-msg").empty();
        ui.displayMsgRight("JUMP ", false);
        var audio = new Audio('../horn.mp3');
        audio.play();
    }
    if (obj.Status == 'protocolinprogress') {
        $$(".log-msg").empty();
        ui.displayMsgRight("Jump", false);

    }
    if (obj.Status == 'computingstart') {
        $$(".log-msg").empty();
        ui.displayMsgRight("Done, Computing", false);
    }
}