function contStartApp(){document.title="SpartaForce v-"+version;var e=window.location.href.split("/"),t=e[3].substring(e[3].indexOf("#")+1),a=e[3].substring(0,e[3].indexOf("#")),i={site:t,sid:a,uid:e[4]},s=JSON.stringify(i);$$.ajax({type:"POST",url:"/api/post/start",data:{data:s},success:function(e){var e=jQuery.parseJSON(e);e.hasOwnProperty("error")?ui.setMsg(e.error.descr,!0):(globals=new Globals(e.config),ui=new UI,ui.setUserName(e.config.name),connectToWebsocketServer(),setTimeout(function(){sendSetConfig(e.config.ZeroNow,e.config.AutoZero,e.config.StandStillLevel,e.config.StandStill,e.config.KeepData),$$("#temp_div").hide(),$$("#cop1_div").show()},600))},error:function(e){console.log(e),ui.setMsg("Configuration failed to initialize, can not connect to SpartaTrac",!0)}})}function Globals(e){console.log(e),this.testGUID=e.uid,this.jumpTestNubmer=e.jumpTestNubmer,this.swayTestNumber=e.swayTestNumber,this.landingTestNumber=e.landingTestNumber,this.initJumpTestNubmer=e.jumpTestNubmer,this.initSwayTestNumber=e.swayTestNumber,this.initLandingTestNumber=e.landingTestNumber,this.publish=e.publish,this.weightType=e.WeightType,this.sendPercent=Number(0),this.weightTest="",this.swayExtremity="lower",this.currentWeight,this.flag,this.t=-1,this.n=12e3,this.v=0,this.stopChart=!1,this.serverMessage="",this.StandStill=e.StandStill,this.KeepData=e.KeepData,this.WebsocketPort=e.WebsocketPort,this.RtnRate=e.RtnRate,this.JumpTimeOfPlate=e.JumpTimeOfPlate,this.WeightDiff=e.WeightDiff,this.ValidationMinAverageConcentricPhaseForce=e.ValidationMinAverageConcentricPhaseForce,this.ValidationMinAverageEccentricRateOfChange=e.ValidationMinAverageEccentricRateOfChange,this.ValidationMinConcentricVerticalImpulse=e.ValidationMinConcentricVerticalImpulse,this.ValidationMinJumpHeight=e.ValidationMinJumpHeight,this.ValidationMaxJumpHeight=e.ValidationMaxJumpHeight,this.ValidationRequiredStabilityDuration=e.ValidationRequiredStabilityDuration,this.ValidationMinForceThreshold=e.ValidationMinForceThreshold,this.ValidationMaxMSOffPlate=e.ValidationMaxMSOffPlate}function contABORTJumpTest(){stopDuringTesting("END"),globals.stopChart=!0,ui.BtnsEnableControll(["scan","sway","landing","weight"])}function afterResult(e){switch(e.JumpType){case"Countermovement":countermovementResult(e);break;case"Sway":swayResult(e);break;case"SingleLegLanding":singleLegLandingResult(e)}}function clearlocalStorage(){console.log(localStorage),localStorage.clear(),$$(".data-table").empty(),console.log(localStorage)}function getDataLocalStorage(e,t){for(var a=[],i=e;i>0;i--){var s=localStorage["Sparta_"+t+"_"+i+"_"+globals.testGUID];if(null!=s||void 0!=s){var n=jQuery.parseJSON(s);a[i]=JSON.stringify(n)}s=null}return a}function send_date(e,t,a,i,s){ui.progressBar(),$$.ajax({type:"POST",url:"/api/post/"+t,data:{data:e},success:function(e){console.log(e),serverResultCallback(jQuery.parseJSON(e),i,s,a)},error:function(e){var e=jQuery.parseJSON(e);console.log(e),ui.setMsg("Server error ,cant connect to spartaTrac "+e,!0)}})}function sendDataToTrac(e){var t=get_max(e),a=0;globals.serverMessage="";for(var i=getDataLocalStorage(t,e),s=t;s>0;s--)void 0!=i[s]&&a++;for(var n=1,s=t;s>0;s--)void 0!=i[s]&&(send_date(i[s],"save_"+e,e,n/a,s),n++)}function serverResultCallback(e,t,a,i){console.log(e),e.sid>1?localStorage.removeItem("Sparta_"+i+"_"+a+"_"+globals.testGUID):globals.serverMessage+="Failed to save trail "+a+" data <br>",globals.serverMessage.length>0&&ui.setMsg(globals.serverMessage,!0),1==t&&($$(".progress-area").empty(),"yes"==globals.publish&&publishResultsInSpartaTrac(i),ui.BtnsEnableControll(["scan","sway","landing","weight"]))}function publishResultsInSpartaTrac(e){ui.displayMsgRight("Publishing "+e,!1),console.log(e);var t="";switch(e){case"scan":t="scan";break;case"sway":t="sway";break;case"landing":t="landing"}$$.ajax({type:"POST",url:"/api/post/publish_tests",data:{test:t,uid:globals.testGUID},success:function(){ui.displayMsgRight("Publish finished",!1)},error:function(e){var e=jQuery.parseJSON(e);console.log(e),ui.setMsg("SpartaTrac can not publish the test",!0)}})}var version="1.7",$$=window.jQuery,globals,ui;console.log($$.fn.jquery);