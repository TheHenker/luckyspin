/** Credits - Do not edit/remove this comment (Read http://domain.name/LICENSE)
 * @desc domain.name core source file
 * @author Dexon <dexon@live.ca> (https://github.com/Dexon95)
 * @contributors 
 */

 var app = {
    id: 1323
 }

 var user = {
    connected: false,
    token: null,
    uname: null,
    balance: null,
    clientSeed: null,
    hash: null
 }

var socket;
var showingrecaptcha = false;

function onloadCallback() {
    grecaptcha.render('faucetClaimCaptcha', {
        'sitekey' : '6LdI2CMTAAAAAGMWJ-lJ3k2PXrjlxgcjuzmeq5kq',
        'callback' : correctCaptcha
    });
};

$(function(){
    if(getURLParameter('access_token')!="" && getURLParameter('access_token')!=null){
        login(getURLParameter('access_token'));
    }

    // https://blog.moneypot.com/introducing-socketpot/
    socket = io('https://socket.moneypot.com');

    socket.on('connect', function() {
        console.info('[socketpot] connected');
        var authRequest = {
            app_id: app.id,
            access_token: (user.token!=null?user.token:undefined),
            subscriptions: ['CHAT', 'DEPOSITS', 'BETS']
        };
        socket.emit('auth', authRequest, function(err, authResponse) {
            if (err) {
                console.error('[auth] Error:', err);
                console.info('[authRequest]:', authRequest);
                console.info('[authResponse]:', authResponse);
                return;
            }  
            console.info('[authResponse]:', authResponse);          
        });
    });

    socket.on('disconnect', function() {
        console.warn('[socketpot] disconnected');
    });
    socket.on('client_error', function(err) {
        console.error('[socketpot] client_error:', err);
    });
    socket.on('error', function(err) {
        console.error('[socketpot] error:', err);
    });
    socket.on('reconnect_error', function(err) {
        console.error('[socketpot] error while reconnecting:', err);
        console.info('If this message keeps coming back, try to clear cache then close and reopen your browser.');
    });
    socket.on('reconnecting', function() {
        console.warn('[socketpot] attempting to reconnect...');
    });
    socket.on('reconnect', function() {
        console.info('[socketpot] successfully reconnected');
    });
    socket.on('new_bet', function(payload) {
        setTimeout(function(){
            console.info("[new_bet] Detected a new bet has been done.", payload);
            if(user.uname == payload.uname){
                var table = document.getElementById("mybet_history");
                
                var row = table.insertRow(0);
                row.id = "mybet_"+payload.id;
                row.className = "mybets_log_item";
                
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                
                var win = parseFloat(payload.profit) >= 0;
                
                cell1.innerHTML = "<a href=\"https://blog.moneypot.com/bets/"+payload.id+"\" target=\"_blank\">"+payload.id+"</a>";
                cell1.className = (win?"win":"lose");

                cell2.innerHTML = parseFloat(((parseFloat(payload.wager)+parseFloat(payload.profit))/parseFloat(payload.wager)).formatMoney(2, '.', ','))+"x";
                cell2.className = (parseFloat(payload.profit)>1?"table-result up":(parseFloat(payload.profit)<1?(parseFloat(payload.profit)==0?"table-result equal":"table-result down"):"table-result equal"));

                cell3.innerHTML = parseFloat(parseFloat(payload.wager/100).formatMoney(2,'.',','));

                cell4.innerHTML = parseFloat(parseFloat(payload.profit/100).formatMoney(2,'.',','));

                $('.mybets_log_item').each(function(index){
                    if(index>25) $(this).remove();
                });
            }

            var table = document.getElementById("bet_history");
                
            var row = table.insertRow(0);
            row.id = "bet_"+payload.id;
            row.className = "allbets_log_item";
            
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            
            var win = parseFloat(payload.profit) >= 0;
            
            cell1.innerHTML = "<a href=\"https://blog.moneypot.com/bets/"+payload.id+"\" target=\"_blank\">"+payload.id+"</a>";
            cell1.className = (win?"win":"lose");

            cell2.innerHTML = payload.uname;

            cell3.innerHTML = parseFloat(((parseFloat(payload.wager)+parseFloat(payload.profit))/parseFloat(payload.wager)).formatMoney(2, '.', ','))+"x";
            cell3.className = (parseFloat(payload.profit)>1?"table-result up":(parseFloat(payload.profit)<1?(parseFloat(payload.profit)==0?"table-result equal":"table-result down"):"table-result equal"));

            cell4.innerHTML = parseFloat(parseFloat(payload.wager/100).formatMoney(2,'.',','));

            cell5.innerHTML = parseFloat(parseFloat(payload.profit/100).formatMoney(2,'.',','));

            $('.allbets_log_item').each(function(index){
                if(index>25) $(this).remove();
            });
        }, 1500);
    });

    $("#myBetsButton").click(function(){
        $("#myBetsButton").addClass("selected");
        $("#allBetsButton").removeClass("selected");
        $(".my-table-spins").css("display", "table");
        $(".table-spins").css("display", "none");
    });

    $("#allBetsButton").click(function(){
        $("#allBetsButton").addClass("selected");
        $("#myBetsButton").removeClass("selected");
        $(".my-table-spins").css("display", "none");
        $(".table-spins").css("display", "table");
    });

    $("#faucetButton").click(function(){
        if(showingrecaptcha == false){
            $("#faucetClaimCaptcha").css("top", "10px");
            showingrecaptcha = true;
            console.log("showing google recaptcha");
        }else if(showingrecaptcha == true){
            $("#faucetClaimCaptcha").css("top", "-90px");
            showingrecaptcha = false;
            console.log("hiding google recaptcha");
        }
    });

    $(".login_button").click(function(){
        if(user.connected){
            location.reload();
        }else{
            window.location.href = "https://blog.moneypot.com/oauth/authorize?app_id=1323&response_type=token&state=Meh&redirect_uri=http://luckyspin.ga/";
        }
    });

    $('#depositButton').click(function(){
        var windowUrl = 'https://www.moneypot.com/dialog/deposit?app_id='+app.id;
        var windowName = 'manage-auth';
        var windowOpts = 'width=420,height=350,left=100,top=100';
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
    });

    $('#withdrawButton').click(function(){
        var windowUrl = 'https://www.moneypot.com/dialog/withdraw?app_id='+app.id;
        var windowName = 'manage-auth';
        var windowOpts = 'width=420,height=350,left=100,top=100';
        var windowRef = window.open(windowUrl, windowName, windowOpts);
        windowRef.focus();
    });

    window.addEventListener('message', function(event) {
        if (event.origin === 'https://www.moneypot.com' && event.data === 'UPDATE_BALANCE') {
            $.getJSON("https://api.moneypot.com/v1/auth?access_token="+user.token, function(json){
                user.balance = json.user.balance/100;
                $('.balance-result').text((user.balance).formatMoney(2,'.',','));  
            });
        }
    }, false);

    $(".skin-one").click(function(){
        currentWheel = 0; // 1
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-one').addClass("wheel-active");
    });
    $(".skin-two").click(function(){
        currentWheel = 1; // 2
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-two').addClass("wheel-active");
    });
    $(".skin-three").click(function(){
        currentWheel = 2; // 3
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-three').addClass("wheel-active");
    });
    $(".skin-four").click(function(){
        currentWheel = 3; // 4
        $('.change-skin').removeClass("skin-active");
        $(this).addClass("skin-active");

        $('.skincss').removeClass("wheel-active");
        $('.wheel-four').addClass("wheel-active");
    });

    $('#10p').click(function(){
        $('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * 0.1).formatMoney(2,'.',',')));
    });
    $('#25p').click(function(){
        $('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * 0.25).formatMoney(2,'.',',')));
    });
    $('#50p').click(function(){
        $('#wager-result').val(parseFloat((parseFloat($('#wager-result').val()) * 0.5).formatMoney(2,'.',',')));
    });
    $('#max').click(function(){
        $('#wager-result').val(parseFloat($('.balance-result').text()));
    });
    $('#100').click(function(){
        $('#wager-result').val(100);
    });
    $('#1000').click(function(){
        $('#wager-result').val(1000);
    });
    $('#10000').click(function(){
        $('#wager-result').val(10000);
    });
    $('#reset').click(function(){
        $('#wager-result').val(1);
    });
});

function login(token){
    window.history.pushState('', 'luckyspin', '/luckyspin');

    var loaderContainer = jQuery('<div/>', {
        id:     'loaderContainer',
        style:  "position: absolute;"+
                "top: 0; right: 0; bottom: 0; left: 0;"+
                "z-index: 2000;"
    }).appendTo('body');
    
    var loaderSegment = jQuery('<div/>', {
        class:  'ui segment',
        style:  'height: 100%; opacity: 0.7;'
    }).appendTo(loaderContainer);
    
    var loaderDimmer = jQuery('<div/>', {
        class:  'ui active dimmer'
    }).appendTo(loaderSegment);
    
    var loaderText = jQuery('<div/>', {
        id:     'loaderText',
        class:  'ui text loader',
        text:   'Connecting'
    }).appendTo(loaderDimmer);

    $.getJSON("https://api.moneypot.com/v1/token?access_token="+token, function(json){
        if(json.error){
            console.error("LOGIN ERROR:", json.error);
            $('#loaderText').text('Error while connecting: '+ json.error);
            return;
        }

        user.uname = json.auth.user.uname;
        user.balance = json.auth.user.balance/100;
        user.connected = true;
        user.token = token;
        user.clientSeed = getRandCseed();

        $('.login_button').text(user.uname);
        $('.balance-result').text((user.balance).formatMoney(2,'.',','));
        $('.bet_cashout_button').text("Bet");

        $('#loaderContainer').css('display', 'none');

        $('#wager-result').attr("disabled", false);
    });
}

function getHash(callback){
    if(user.hash == null){
        $.post("https://api.moneypot.com/v1/hashes?access_token="+user.token, '', function(json) {
            if(json.hash){
                console.log("[Provably fair] We received our hash: "+json.hash);
                user.hash = (typeof json.hash === "undefined"?null:json.hash);
                if(callback) callback();
            }else{
                console.error("HASH ERROR:",json);
                $('#wager-result').attr("disabled", false);
                $('.spin-circle').css("display", "inline-block");
                return;
            }
        });
    }else{
        if(callback) callback();
    }
}

$('.spin-circle').click(function(){
    if(!user.connected){
        window.location.href = "https://blog.moneypot.com/oauth/authorize?app_id=1323&response_type=token&state=Meh&redirect_uri=http://luckyspin.ga/";
        return;
    }
    
    placeBet(currentWheel);
});

var currentWheel = 0;
var spinning = false;


var wheels = [[
    {value:0},
    {value:0.5},
    {value:0},
    {value:2},
    {value:0.5},
    {value:0.5},
    {value:2},
    {value:3},
    {value:0},
    {value:0.5},
    {value:1},
    {value:0.5},
    {value:1},
    {value:2},
    {value:1},
    {value:0.5},
    {value:1},
    {value:3},
    {value:0.5},
    {value:0},
    {value:2},
    {value:0.5},
    {value:1},
    {value:0.25}
],
[
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:1.75},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:2},
    {value:0},
    {value:1.25},
    {value:0},
    {value:2}
],
[
    {value:2.5},
    {value:2.75},
    {value:2.5},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:2.5},
    {value:2.75},
    {value:2.5},
    {value:0},
    {value:0},
    {value:.75},
    {value:0},
    {value:0},
    {value:2.5},
    {value:2.75},
    {value:2.25},
    {value:0},
    {value:0},
    {value:0},
    {value:0},
    {value:0}
],
[
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:3},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:1},
    {value:0},
    {value:10},
    {value:0},
    {value:1}
]];


function placeBet(wheelNumber){
    if(spinning) return;

    $('#wager-result').attr("disabled", true);
    $('.spin-circle').css("display", "none");

    getHash(function(){
        var payouts = [];

        for(var i=0; i<wheels[wheelNumber].length; i++){
            payouts.push({
                from: Math.floor((Math.pow(2,32)/wheels[wheelNumber].length)*i),
                to: Math.floor((Math.pow(2,32)/wheels[wheelNumber].length)*(i+1)),
                value: (wheels[wheelNumber][i].value*(parseFloat($('#wager-result').val())))*100
            });
        }
        console.log("DEBUGGING:", payouts);

        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "https://api.moneypot.com/v1/bets/custom?access_token="+user.token,
            data: JSON.stringify({
                client_seed: parseInt(user.clientSeed),
                hash: String(user.hash),
                wager: (parseFloat($('#wager-result').val())*100),
                payouts: payouts
            }),
            dataType: "json",
            error: function(xhr, status, error) {
                console.error("BET ERROR:", xhr.responseText);
                $('#wager-result').attr("disabled", false);
                $('.spin-circle').css("display", "inline-block");
                return;
            }
        }).done(function(data){
            console.log("[DATA - result from bet]",data);
            var outcome = data.outcome;
            var prizeNumber = 0;
            for(var i=0; i<payouts.length; i++){
                if(outcome>=payouts[i].from && outcome<payouts[i].to){
                    prizeNumber = i;
                    SPIN(prizeNumber);
                    break;
                }
            }
            user.hash = data.next_hash;
        });
    });
}

function SPIN(number){
    var $r = $('.wheel-active img').fortune({prices: wheels[currentWheel], clockWise: true});
    console.log("[DEBUG] NUMBER TO SPIN:", number,"| Amount:", wheels[currentWheel].length);
    number = parseFloat((wheels[currentWheel].length - parseInt(number)) + 5.5);
    console.log("DEBUG: number:", number);
    $r.spin(number).done(function(price) {
        console.log("DEBUG: prize:", price);
        $.getJSON("https://api.moneypot.com/v1/auth?access_token="+user.token, function(json){
            user.balance = json.user.balance/100;
            $('.balance-result').text((user.balance).formatMoney(2,'.',','));  
        });

        $('#wager-result').attr("disabled", false);
        $('.spin-circle').css("display", "inline-block");
    });
}

function correctCaptcha(response) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "https://api.moneypot.com/v1/claim-faucet?access_token="+user.token,
        data: JSON.stringify({
            "response": response
        }),
        dataType: "json"
    }).done(function(data) {
        console.log((data.amount/100)+" has been added to your balance!");
        $.get( "https://api.moneypot.com/v1/auth?access_token="+user.token, function( data ) {
            if(typeof data.user.uname !== "undefined"){
                user_balance = (data.user.balance/100);
                $('.balance-result').text((user.balance).formatMoney(2,'.',','));
            }
        });
        $("#faucetClaimCaptcha").css("top", "-90px");
        grecaptcha.reset();
        showingrecaptcha = false;
    }).fail(function(data) {
        var error = data.error;
        if(error == "FAUCET_ALREADY_CLAIMED"){
            console.error("Faucet already claimed");
            grecaptcha.reset();
        }else if(error == "INVALID_INPUT_RESPONSE"){
            console.error("Google has rejected the response. Try to refresh and do again.");
            grecaptcha.reset();
        }
        $("#faucetClaimCaptcha").css("top", "-90px");
        showingrecaptcha = false;
    });
};

function getRandCseed(){
    var array = new Uint32Array(1);
    return window.crypto.getRandomValues(array)[0];
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[#|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null
}

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
