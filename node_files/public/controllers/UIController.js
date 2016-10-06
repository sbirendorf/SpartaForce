$$(document).ready(function () {
    $$('#hide, #show').on('click', advanceBtn);
    $$('#hide').hide();
    $$('.ops-test-send').hide();
    disable_test_btns();
});


function UI () {}

UI.staticMethod = function () {
    return 1;
};

UI.prototype.convertWeight = function (weight) {
     if (globals.weightType == 'lb') {
        return weight * 2.205;
    }
    return weight;
};
UI.prototype.setWeight = function (weight) {
     var w = ui.convertWeight(weight);
     $("weight_text").update(w.toFixed(1));   
};

UI.prototype.setUserName = function(name){
    $$(".user-name").empty();
    $$(".user-name").append(name);
};
UI.prototype.setMsg = function(text, error){
    $$(".log-msg").empty();
    if (error) {
        $$(".log-msg").append('<div class="alert alert-danger"><br><strong>Error! </strong>' + text + '<br><br></div>');
    } else {
        $$(".log-msg").append('<div class="alert alert-success">' + text + '<br><br></div>');
    }
};
UI.prototype.displayMsg = function(text){
    $$(".display-msg").empty();
    $$(".display-msg").append('<p>' + text + '</p>');
};
UI.prototype.displayMsgRight = function(text){
   $$(".log-msg-right").empty();
    $$(".log-msg-right").append('<p>' + text + '</p>');
};
UI.prototype.getSide = function(type){
    var side = type % 2;
    if (side == 0) {//start with right 
        return 'Right';
    } else {
        return 'Left';
    }
};
Date.prototype.yyyymmdd = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = this.getDate().toString();
    var h = this.getHours().toString();
    var n = this.getMinutes().toString();
    var ss = this.getSeconds().toString();
    return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]) + 'T' + h + ':' + n + ':' + ss; // padding
};
UI.prototype.progressBar = function(type){
    var str = ' <div class="loading-modal"><img src="../images/modal-loading.gif"></div>';
    $$(".progress-area").empty();
    $$(".progress-area").append(str);
};
UI.prototype.BtnsEnableControll = function(enableButtons){
    var disableBtns = ['scan','sway','landing','stop','weight'];
        $$.each(enableButtons, function(i,btn){
             $$('.'+btn+'-btn').prop("disabled", 0);
            var index = disableBtns.indexOf(btn);
            disableBtns.splice(index, 1);// remove from the array
        }); 
        $$.each(disableBtns, function(t,remove){
            $$('.'+remove+'-btn').prop("disabled", 1);
        });
        $$('.sway-buttons').empty();
};

function swaySideButtons() {
    var u = "'upper'";
    var l = "'lower'";
    $$(".sway-buttons")
            .append('\
                <button class="btn-sm btn-info" style="width: 94px;" onClick="contStartSwayTest(' + l + ');">Lower Sway</button>\n\
                <button class="btn-sm btn-info" style="width: 94px;" onClick="contStartSwayTest(' + u + ');">Upper Sway</button><br><br>'
                    );
}
function disable_test_btns() {
    $$('.scan-btn').prop("disabled", 1);
    $$('.sway-btn').prop("disabled", 1);
    $$('.landing-btn').prop("disabled", 1);
    $$('.weight-btn').prop("disabled", 1);
    $$('.stop-btn').prop("disabled", 1);
    $$('.sway-buttons').empty();
}
function advanceBtn() {
    $$('#hide').toggle();
    $$('#show').toggle();
    $$('.ops-test-send').toggle();
}

function view_data(type) {
    $$(".data-table").empty();
    $$(".data-table").html("<p> No Data </p>");
    var max = get_max(type);
    var json = getDataLocalStorage(max, type);
    var str = "<table class='table table-hover'><thead><tr><th>Trial</th><th>Date</th><th>Weight</th></tr></thead><tbody>";
    for (var s = max; s > 0; s--) {
        if (json[s] != null || json[s] != undefined) {
            var temp = jQuery.parseJSON(json[s]);
            str += "<tr><td>" + s + "</td><td>" + temp.Date + "</td><td>" + temp.WeightKG.toFixed(1) + "</td></tr>";
        }
    }
    str += "</tbody></table>";
    $$(".data-table").html(str);
}
function get_max(type) {
    if (type == 'scan') {
        var max = globals.initJumpTestNubmer;
    } else if (type == 'sway') {
        var max = globals.initSwayTestNumber;
    } else if (type == 'landing') {
        var max = globals.initLandingTestNumber;
    }
    return max;
}
