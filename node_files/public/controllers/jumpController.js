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
    if (data.Countermovement.JumpHeight < globals.ValidationMinJumpHeight || data.Countermovement.JumpHeight > globals.ValidationMaxJumpHeight) {
        ui.setMsg('Invalid jump height. Jump as to be greater than '+data.Countermovement.JumpHeight, true);
        return true;
    } 
    if (data.Countermovement.AverageConcentricPhaseForce < globals.ValidationMinAverageConcentricPhaseForce) {
         ui.setMsg('Invalid jump (Average Concentric Phase Force)', true);
        return true;
    }
    if (data.Countermovement.AverageEccentricRateOfChange < globals.ValidationMinAverageEccentricRateOfChange) {
        ui.setMsg('Invalid jump (Average Eccentric Rate Of Change)', true);
        return true;
    }
    if (data.Countermovement.ConcentricVerticalImpulse < globals.ValidationMinConcentricVerticalImpulse) {
        ui.setMsg('Invalid jump (Concentric Vertical Impulse)', true);
        return true;
    } 
    var num= Number(globals.jumpTestNubmer)+1;
    var lastJump = localStorage['Sparta_scan_' + num+ '_' + globals.testGUID];
    if (lastJump != null || lastJump != undefined) {//if not the first jump
         lastJump = jQuery.parseJSON(lastJump);
         if(Math.abs(lastJump.WeightKG - data.WeightKG) > globals.WeightDiff){
             ui.setMsg('Invalid weight, initial weight was '+lastJump.WeightKG +', current weight ' +data.WeightKG , true);
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
        ui.displayMsgRight('');
        var audio = new Audio('../error.mp3');
        audio.play();

        setTimeout(function () {
             contStartJumpTest();
        }, 3500);
        
    } else {
        ui.displayMsgRight('<div class="jump-height"><div class="jump-title">Jump Height </div><div class="jump-number">' + Number(100 * data.Countermovement.JumpHeight).toFixed()+'</div></div>', false);   
        getJumpImage(data, globals.jumpTestNubmer);
    }
    
}

function saveJumpToLocalStorage(data, imageUrl){ 
    //d = new Date();
   // data.Date = d.yyyymmdd();
    data.Date =getCurrentDateTime();
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
        }, 3500);
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
}
function getJumpImage(data,number){

	var doctype = '<?xml version="1.0" standalone="no"?>'
		  + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
      $$("svg").css("background-color", "#ffffff");
		// serialize our SVG XML to a string.
	  var source = (new XMLSerializer()).serializeToString(d3.select('svg').node());
		// create a file blob of our SVG.
		var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

		var url = window.URL.createObjectURL(blob);

		// Put the svg into an image tag so that the Canvas element can read it in.
		var img = d3.select('body').append('img')
		 .attr('width', 100)
		 .attr('height', 100)
		 .node();
        var canUrl ='';
		img.onload = function(){
		  // Now that the image has loaded, put the image into a canvas element.
		  var canvas = d3.select('body').append('canvas').node();
		  canvas.width = 600;
		  canvas.height = 600;
		  var ctx = canvas.getContext('2d');
		  ctx.drawImage(img, 0, 0);
		  var canvasUrl = canvas.toDataURL("image/png");
		  var img2 = d3.select('body').append('img')
			.attr('width', 150)
			.attr('height', 150)
			.node();
		  // this is now the base64 encoded version of our PNG! you could optionally 
		  // redirect the user to download the PNG by sending them to the url with 
		  canUrl = img2.src = canvasUrl; 
            saveJumpToLocalStorage(data, canUrl);
            $$( "canvas" ).remove();
            $$( "body img:not(.main-logo)").remove();
            
		}
		// start loading the image.
		img.src = url;
}