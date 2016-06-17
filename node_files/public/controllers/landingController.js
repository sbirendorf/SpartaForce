function contStartLandingTest() {
    ui.displayMsgRight("Step on the plate.", false);
    ui.BtnsEnableControll(['landing','stop']);
    var userWeight =[];
    var getWeight = setInterval(function () {
        if (globals.currentWeight > 3) {
            ui.displayMsgRight("Stand Still.", false);
            if ($$(".stop-btn").is(":disabled") == true) {
                clearInterval(getWeight);
            }// if the user canceld the test , stop the interval
            var avgWeight = weightCalc(getWeight,userWeight);
            if(avgWeight>3){
                setTimeout(function(){  startLandingOperator(avgWeight); }, 3000);
            }
        }
    }, 200);
}
function weightCalc(getWeight,userWeight){
    userWeight.push(globals.currentWeight);
    if(userWeight.length > 10 ){
       var max = Math.max.apply(null, userWeight);
       var min = Math.min.apply(null, userWeight);  
        if(max - min <1){
            var sum = 0;
            var ww = userWeight.length;
            for( var i = 0; i < ww; i++ ){
                sum += parseInt( userWeight[i], 10 ); //don't forget to add the base
            }
            var avgWeight = sum/ww;
            clearInterval(getWeight); 
            ui.displayMsgRight("Step off the plate. ", false);
            return avgWeight;
        }
        userWeight.shift(); // remove the first key from the array
    }  
}
function startLandingOperator(userWeight) {
    var str = setInterval(function () {
        if (globals.currentWeight < 2) {
            var audio = new Audio('../horn.mp3');
            audio.play();
            var side = ui.getSide(globals.landingTestNumber);
            ui.displayMsgRight("Jump onto the plate, land on your " + side + " foot", false);
            ui.displayMsg('Trial Number :' + globals.landingTestNumber);
            startLanding(userWeight);
            clearInterval(str);
            t = 0;
            globals.stopChart = false;
            startLandingRealTimeChart();
            $$("#sway").show();
            $$("#scan").hide();
            stratLandingTest();
        }
    }, 2500);
}
//check when the user back on the plate , than start the counter to stop the test
function stratLandingTest() {
    var str = setInterval(function () {
        if (globals.currentWeight > 5) {
            globals.flag = true;
            clearInterval(str);
        }
    }, 500);
}
function validateLandingResult(data) {
    return false;
}
//landing results 
function singleLegLandingResult(data) {
    console.log(data);
    var invalid = validateLandingResult(data);
    if (invalid) {

    } else {
        d = new Date();
        data.side = ui.getSide(globals.landingTestNumber);
        data.Date = d.yyyymmdd();
        var testInitWeight = data.Input.WeightKG;
        //if pounds convert the weight, notich the object name still WeightKG
        data.WeightKG = ui.convertWeight(data.Input.WeightKG);
        
        console.log(data);
        var data = JSON.stringify(data);
        localStorage.setItem("Sparta_landing_" + globals.landingTestNumber+ '_' + globals.testGUID, data);
        console.log(localStorage['Sparta_landing_' + globals.landingTestNumber+ '_' + globals.testGUID]);
        var q = jQuery.parseJSON(localStorage['Sparta_landing_' + globals.landingTestNumber+ '_' + globals.testGUID]);
        globals.landingTestNumber--;
    }
    //test again 
    if (globals.landingTestNumber > 0) {
        setTimeout(function () {
            ui.displayMsgRight("Loading", false);
            drawData = true;
            startLandingOperator(testInitWeight);
        }, 2500);
    } else {//test is over 
        ui.displayMsgRight("", false);
        var r = confirm("Test Over! Send data to sparta Trac?");
        if (r == true) {
            sendDataToTrac('landing');
        }
         ui.displayMsgRight("", false);
         globals.landingTestNumber = globals.initLandingTestNumber;
    }
}

function landingProgress(obj) {
    //the user is on the plate , wait 5 sec and send a message 
    //we want to be here once, so we set the flag to true
    if (obj.Status == 'protocolinprogress' && globals.flag == true) {
        globals.flag = false;
        setTimeout(function () {
            ui.displayMsgRight("Step off the plate.", false);
            var audio = new Audio('../stop.mp3');
            audio.play();
            globals.stopChart = true;
        }, 3000);
    }
}

//function for the weight test
function contStartWeightTest() {
    ui.displayMsgRight("Step on the plate.", false);
    ui.BtnsEnableControll([]);
    var userWeight =[];
    $$("#temp_div").show();
    $$("#cop1_div").hide();
    $$(".msg-area2").hide();
    $$("#scan").hide();
    var getWeight = setInterval(function () {
        if (globals.currentWeight > 3) {
            ui.displayMsgRight("Stand Still.", false);
            var avgWeight = weightCalc(getWeight,userWeight);
            if(avgWeight == null){avgWeight = 0;}
            $$("#temp_div").empty();
            var stopBtn = '<button class="stop-weight-btn btn btn-danger" style="width: 120px;margin-top: 95px;" onClick="stopWeightTest();">Stop Weight</button><br><br>';
            $$("#temp_div").append("<div class='weight-test'>" + avgWeight.toFixed(1) + "</div>");
            $$("#temp_div").append(stopBtn);
        }
    }, 100);
}
function stopWeightTest() {
    $$("#temp_div").empty();
    ui.displayMsgRight("", false);
    clearInterval(globals.weightTest);
    ui.BtnsEnableControll(['scan','sway','landing','weight']);
    $$("#temp_div").hide();
    $$("#cop1_div").show();
    $$(".msg-area2").show();
}
