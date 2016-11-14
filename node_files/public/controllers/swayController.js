
function contStartSwayTest(extremity) {
    $$(".sway-buttons").empty();
    globals.swayExtremity = extremity;
    globals.stopChart = false;
    startSway();
  //  startLandingRealTimeChart();
    startSwayRealTimeChart();
    ui.displayMsg('Trials Remaining :' + globals.swayTestNumber);
    $$("#sway").show();
    $$("#scan").hide();
    ui.BtnsEnableControll(['sway','stop']);
}

function validateSwayResult(data) {
    if (data.WeightKG < 5) { 
        ui.setMsg('Invalid minimum weight', true);
        return true;
    }
    var num= Number(globals.swayTestNumber)+1;
    var lastSway = localStorage['Sparta_sway_' + num];
    if (lastSway != null || lastSway != undefined) {//if not the first sway
         lastSway = jQuery.parseJSON(lastSway);
         if(Math.abs(lastSway.WeightKG - data.WeightKG) > globals.WeightDiff){
             ui.setMsg('Invalid weight', true);
             return true;
         }
    }
    return false;
}

//sway results 
function swayResult(data) {
    //if pounds convert the weight, notice the object name still call WeightKG
    data.WeightKG = ui.convertWeight(data.WeightKG);
    var invalid = validateSwayResult(data);
    if (invalid) {
        ui.displayMsg('');
        var audio = new Audio('../error.mp3');
        audio.play();
    } else {
        d = new Date();
        data.side = ui.getSide(globals.swayTestNumber);
        data.extremity = globals.swayExtremity;
        data.Date = d.yyyymmdd();
        
        console.log(data);
        var data = JSON.stringify(data);
        localStorage.setItem("Sparta_sway_" + globals.swayTestNumber+ '_' + globals.testGUID, data);
       // console.log(localStorage['Sparta_sway_' + globals.swayTestNumber]);
        var q = jQuery.parseJSON(localStorage['Sparta_sway_' + globals.swayTestNumber+ '_' + globals.testGUID]);
        globals.swayTestNumber--;
    }
    //test again 
    if (globals.swayTestNumber > 0) {
        setTimeout(function () {
            contStartSwayTest(globals.swayExtremity);
        }, 4000);
    } else {//test is over 
        var r = confirm("Test Over! Send data to sparta Trac?");
        if (r == true) {
            sendDataToTrac('sway');
        }
        ui.displayMsgRight("", false);
        globals.swayTestNumber = globals.initSwayTestNumber;
    }

}
function swayProgress(obj) {
    if (obj.Status == 'waitingforstill') {
        $$(".log-msg").empty();
        var side = ui.getSide(globals.swayTestNumber);
        globals.flag=true;
        ui.displayMsgRight("Stand Still – Balance on " + side + " Foot / Hand First.  Time Remaining " + obj.TimeRemainSec.toFixed(0), false);
    }
    //bertec execute protocolstart twice and the sounds play twice
    //we added a flag to fix this bug
    if (obj.Status == 'protocolstart' && globals.flag==true) {
        $$(".log-msg").empty();
        var side = ui.getSide(globals.swayTestNumber);
        ui.displayMsgRight("Status: Balance on ." + side + "", false);
        var audio = new Audio('../horn.mp3');
        audio.play();
        globals.flag=false;
    }
    if (obj.Status == 'protocolinprogress') {
        $$(".log-msg").empty();
        var side = ui.getSide(globals.swayTestNumber);
        var t = 20 - obj.SamplesCollected / 1000;
        ui.displayMsgRight("Balance on " + side + ",  Time Remaining " + t.toFixed(0) + "", false);
        swayValidateDuringTest(obj);
    }
    if (obj.Status == 'computingstart') {
        var audio = new Audio('../stop.mp3');
        audio.play();
    }
    if (obj.Status == 'computingstart') {
        $$(".log-msg").empty();
        var side = ui.getSide(globals.swayTestNumber);
        ui.displayMsgRight("Done, Computing ." + side + "", false);
    }
    if (obj.Status == 'notrunning') {
        $$(".log-msg").empty();
        ui.displayMsgRight("", false);
    }
}
//run test validation during the test
function swayValidateDuringTest(data){
    //check if off the plate
    if(data.WeightKG <1){ 
          globals.swayErrorCounter++;
          //check for how long the user if off the plate
          if(globals.swayErrorCounter > globals.swayTimeOffPlate){
             stopDuringTesting('END');
             //overwrite the error from the websocket, wait to show after
               setTimeout(function () {
                     ui.setMsg("Test failed, do not step off the place", true);
                }, 250);
             
          }
    }else{
        globals.swayErrorCounter = 0;
    }
}