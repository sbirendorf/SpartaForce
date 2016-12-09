function contStartJumpTest() {
    globals.stopChart = false;
    globals.t = 0;
    startJump();
    ui.displayMsg('Jumps Remaining :' + globals.jumpTestNubmer);
    startScanRealTimeChart();
    $$("#sway").hide();
    $$("#scan").show();
    ui.BtnsEnableControll(['scan','stop']);
}
//simple validation before we save the data
function validateJumpResult(data) {
    
    return false;
}
//scan results 
function countermovementResult(data) {
    globals.stopChart = true;
    //if pounds convert the weight, notice the object name still WeightKG
     data.WeightKG = ui.convertWeight(data.WeightKG);
    var invalid = validateJumpResult(data);
    if (invalid) {
        ui.displayMsgRight('');
        var audio = new Audio('../error.mp3');
        audio.play();

        setTimeout(function () {
             contStartJumpTest();
        }, 9500);
        
    } else {
        ui.displayMsgRight('<div class="jump-height"><div class="jump-title">Jump Height </div><div class="jump-number">' + Number(100 * data.Countermovement.JumpHeight).toFixed()+'</div></div>', false);   
        getJumpImage(data, globals.jumpTestNubmer);
    }
    
}

function saveJumpToLocalStorage(data, imageUrl){ 
    //d = new Date();
    data.Date = d.yyyymmdd();
    data.imageUrl = imageUrl;
    var data = JSON.stringify(data);
    //data= '{"Command": "RESULTS","ID": "testguid","JumpType": "Countermovement","Result": "OK","Reason": "foobar","Timestamp": "ms","ResultsTimestamp": "ms","WeightKG": "230.44","Countermovement": {"JumpHeightM": "123.4","EccRateOfFzNs": "3","NormalConcImpNSKg": "4.3","NormAvgConcForceN": "0.2"},"Sway": {"MLVelocityMs": "4","APVelocityMs": "0.3","TotalVelocityMs": "6.4"},"SingleLegLanding": {"NormalizedMaxVerticalForce": "5","TimeToStabilization": "5.2","MLTTS": "0.5","APTTS": "1.1","RVTTS": "0"},"Fz": ["44.2","44.3","44.21","45.7"],"Mx": ["1.2","3.1",".21","5.4"],"My": ["0.2","0.1","3.1","'+numberOfJumps+'"]}';
    localStorage.setItem("Sparta_scan_" + globals.jumpTestNubmer+ '_' + globals.testGUID, data);
    var q = jQuery.parseJSON(localStorage['Sparta_scan_' + globals.jumpTestNubmer+ '_' + globals.testGUID]);
    //console.log(q.Command);
    globals.jumpTestNubmer--;

    continueScan();
}

//check if we need to test again
function continueScan(){ 
    //test again 
    if (globals.jumpTestNubmer > 0) {
        setTimeout(function () {
            drawData = true;
            contStartJumpTest();
            ui.displayMsg('Jumps Remaining :' + globals.jumpTestNubmer);
        }, 9500);
    } else {//test is over 
        ui.displayMsg('Jumps Remaining :' + globals.jumpTestNubmer);
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
        ui.displayMsgRight("Stand Still ,Time Remaining " + obj.TimeRemainSec.toFixed(0), false);
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
    if (obj.Status == 'notrunning') {
        $$(".log-msg").empty();
        ui.displayMsgRight("", false);
    }
}
function getJumpImage(data,number){

	var doctype = '<?xml version="1.0" standalone="no"?>'
		  + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
      $$("svg").css("background-color", "#ffffff");
		// serialize our SVG XML to a string.
	  var source = (new XMLSerializer()).serializeToString(d3.select('svg').node());
		// create a file blob of our SVG.
		var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

		
		}
}