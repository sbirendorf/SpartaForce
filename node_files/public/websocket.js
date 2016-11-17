
//var $ = window.jQuery;
//console.log($.fn.jquery);

var websocket = null;
var lastConnectedState = 0;
var userStartedTest=false;
var testWeight=0;
var drawData = false;



function generateUUID()
{
   var d = new Date().getTime();
   if (window.performance && typeof window.performance.now === "function")
   {
      d += performance.now(); ; //use high-precision timer if available
   }
   var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
   {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
   });
   return uuid;
}

//////////////////////////////////////////////////////////////////////////
// Websocket functions

function connectToWebsocketServer()
{
   websocket = new WebSocket("ws://localhost:"+globals.WebsocketPort);

   websocket.onopen = function(evt)
   {
      websocketConnected();   // start the chain of events
   }

   websocket.onclose = function(evt)
   {
      websocketDisconnected();
      delete websocket; // remove ourselves
      websocket = null;
   };

   websocket.onerror = function(evt)
   {
      websocketError(evt.data);
   };

   websocket.onmessage = function(evt)
   {
      websocketParseIncomingData(evt.data);
   }
}

function disconnectFromWebsocketServer()
{
   if (isWebsocketConnected())
      websocket.close();
}

function isWebsocketConnected()
{
   if (websocket && websocket.readyState == 1)
      return true;
   return false;
}

function getSocketState()
{
   var stateStr="UNKNOW";
   if (websocket)
   {
      switch (websocket.readyState)
      {
         case 0:
            stateStr = "CONNECTING";
            break;
         case 1:
            stateStr = "OPEN";
            break;
         case 2:
            stateStr = "CLOSING";
            break;
         case 3:
            stateStr = "CLOSED";
            break;
      }
   }

   return stateStr;
}

// Send the raw data to the server
function sendDataToWebsocketServer(text)
{
   if (isWebsocketConnected())
      websocket.send(text);
}

//////////////////////////////////////////////////////////////////////////
// Hanlders from the websocket on events.

// We have successfully connected to the server, so we need to start running.
function websocketConnected()
{
   sendInit();
}

function websocketDisconnected()
{

}

function websocketError(errData)
{
      console.warn("Websocket error:", evt.data);
      ui.setMsg('Websocket error: '+evt.data, true);
}

function websocketParseIncomingData(jsonText)
{
   var obj = JSON.parse(jsonText);
   if (obj.Command == "STATUS")
   {
      //update the weight 
      var theWeightKG = obj.WeightKG;
      globals.currentWeight =obj.WeightKG;
      ui.setWeight(obj.WeightKG);//update the weight on the screen
      
      // if the status of the plate connection changed 
      if (lastConnectedState != obj.Connected)
      {
         lastConnectedState = obj.Connected;
        if(obj.Connected == true){
         $("conn_status").update('<i class="glyphicon glyphicon-ok-sign"></i>');
         ui.BtnsEnableControll(['scan','sway','landing','weight']);
         $$( ".log-msg" ).empty();
        }else{
            $("conn_status").update('<i class="glyphicon glyphicon-remove-sign"></i>');
            ui.setMsg("Can't connect to the force plate", true);
        }
      }   
      //COPfield.positionTargetCursor(obj.FZ, obj.COPx, obj.COPy);
      if(drawData == true && obj.JumpType=='Countermovement'){
            globals.t=globals.t+3 ;
          //  console.log(globals.t);
            globals.v=Math.abs(obj.WeightKG * 9.81);
        }
      if(drawData == true && obj.JumpType=='Sway'){
            globals.t = 10*obj.COPy ;
            globals.v = 10*obj.COPx;
       }
      if(drawData == true && obj.JumpType=='SingleLegLanding'){
            globals.t++ ;
            globals.v = Math.abs(15*obj.COPy);
            if(obj.WeightKG >10){
                landingProgress(obj);
            }
       }
//     console.log(JSON.stringify(obj));
      return;
   }
   if (obj.Command == "ACK")
   {
       $$( ".log-msg" ).empty();
       if(obj.Result == "FAIL"){
            ui.setMsg("Command failed, Reason:"+obj.Reason, true);
            ui.displayMsgRight('');
        }
   }
   if (obj.Command == "PROGRESS")
   {
       if(obj.JumpType=='Sway'){
           swayProgress(obj);
           drawData=true;
       }else if(obj.JumpType=='Countermovement'){
           jumpProgress(obj);
            drawData=true;
       }
      else if(obj.JumpType=='SingleLegLanding'){
           landingProgress(obj);
           drawData=true;
       }
   }
   if (obj.Command == "RESULTS")
   {
        //save the results 
        if(obj.Result =="OK"){
            afterResult(obj);
        }else{
            ui.setMsg("Test failed. Reason: "+obj.Reason , true);
            var audio = new Audio('error.mp3');
            audio.play();
            ui.displayMsgRight('');
            if(obj.JumpType == "Countermovement"){
              setTimeout(function () {
                        contStartJumpTest();
              }, 3500);

            }
            console.log(obj);
            // if(obj.JumpType == "SingleLegLanding"){
            //   setTimeout(function () {
            //             startLandingOperator(globals.landingInitWeight);
            //   }, 500);

            // }

        }
        drawData=false;
   }
}

function websocketSendJsonData(jsonObject)
{
   sendDataToWebsocketServer(JSON.stringify(jsonObject));
}

// These functions send various commands to the websocket server. The ID string can be anything, and is used primarily for you to keep track of commands
// and responses. The INIT command will start sending your STATUS results with the same ID tagged in it. ACKs will also be sent back with the corresponding
// ID value.

function sendInit()
{
   // var time = getCurrentDateTime();
   // globals.testId = globals.testGUID+'_'+time;
   websocketSendJsonData({ Command: "STARTSTATUS", ID: globals.testGUID, "ResponseRate": globals.RtnRate }); // there is no point in having a faster than 20ms update rate; this gives a very nice and smooth result
}

function sendStop()
{
   websocketSendJsonData({ Command: "STOPSTATUS", ID: globals.testGUID });
}

function sendGetConfig()
{
   websocketSendJsonData({ Command: "GETCONFIG", ID: globals.testGUID }); // send a CONFIG result block
}
function sendSetConfig(ZeroNow,AutoZero,StillnessLevel,StillnessSec,ResultsAge)
{	
   websocketSendJsonData({ Command: "CONFIG",
                           ID: globals.testGUID,
                           ZeroNow: ZeroNow,
                           AutoZero: AutoZero,
                           AutostartStillnessLevel: StillnessLevel,
                           AutostartStillnessSeconds: StillnessSec,
                           KeepResultsAge: ResultsAge
                       });
}


function startJump()// start scan
{
   var time = getTimeStamp();
   globals.testId = globals.testGUID+'_'+time;
   websocketSendJsonData({ Command: "BEGIN",
                          ID: globals.testId,
                          JumpType: 'Countermovement',
                          MaxMSOffPlate:globals.JumpTimeOfPlate
                        }); 
}
function startSway()// start sway
{
   var time = getTimeStamp();
   globals.testId = globals.testGUID+'_'+time;
   websocketSendJsonData({ Command: "BEGIN",
                            ID: globals.testId,
                            JumpType: 'Sway',
                            MaxSamples:20000 
                        }); 
}
function startLanding(weight)// start landing
{
   var time = getTimeStamp();
   globals.testId = globals.testGUID+'_'+time;
   websocketSendJsonData({ Command: "BEGIN",
                           ID: globals.testId,
                           JumpType: 'SingleLegLanding', 
                           WeightKG:weight,
                           ValidationRequiredStabilityDuration:globals.ValidationRequiredStabilityDuration,
                           MinForceThreshold: globals.ValidationMinForceThreshold,
                           MaxMSOffPlate: globals.JumpTimeOfPlate 
                       }); 
}
function getJumpData(full)// get results
{
   websocketSendJsonData({ Command: "GETRESULTS", ID: globals.testId,IncludeForceData: full }); 
}
function stopDuringTesting(command)// stop the test , command: end or abort 
{
   websocketSendJsonData({ Command: command, ID: globals.testId });
}

