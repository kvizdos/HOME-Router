let firstLogin = false;
let socket = io({
    'reconnection': true
});

const mainDomain = window.location.href.split("/")[2].split(".").splice(1).join(".");


function setcookie(name, value, days)
{
  if (days)
  {
    var date = new Date();
    date.setTime(date.getTime()+days*24*60*60*1000); // ) removed
    var expires = "; expires=" + date.toGMTString(); // + added
  }
  else
    var expires = "";
  document.cookie = name+"=" + value+expires + `;path=/;domain=${mainDomain}`; // + and " added
}

socket.on('login', (data) => {
    if(data.authenticated) {
        setcookie("prauxyToken", data.token + ":" + $("#username").val() + ":" + data.group, 365);

        var url = new URL(window.location.href);
        var redir = url.searchParams.get("go");
        if(firstLogin) alert("Welcome to Prauxy- you will be redirected to the password configuration page (you can get back at any time by pressing your username in the navigation bar)")
        window.location.href = window.location.protocol + "//" + (redir !== null ? redir + "." : "") + mainDomain + (redir == null && firstLogin ? "/me/settings" : "");
    }
})

socket.on('resetTFA', (data) => {
    $('#verifyNumber').text(data);
})

const login = () => {
    const username = $("#username").val();
    const password = $("#password").val();

    $("#login").prop("disabled", true);

    $.post(window.location.protocol + "//auth." + window.location.hostname.split(".").splice(1).join(".") + "/login", {
        username: username,
        password: password,
        socketid: socket.id
    }, (res) => {
        if(res.authenticated) {
            $('#verifyNumber').text(res.tfaNum)
            if(!res.showMFA) {
                $("#firstStep").hide();
                $("#secondStep").show();
            } else {
                $("#firstStep").hide();
                $('#mfaQR').attr('src', res.qr);
                $("#mfaStep").show();
            }
        } else {
            alert("Incorrect Username / Password");
            $("#login").prop("disabled", false);
        }
    })
}

const addedMFA = () => {
    firstLogin = true;
    $('#mfaStep').hide()
    $("#secondStep").show();
}

const confirmMFA = () => {
    const mfa = $("#mfa").val();
    const username = $("#username").val();

    $.post(window.location.protocol + "//auth." + window.location.hostname.split(".").splice(1).join(".") + "/login/mfa", {
        username: username,
        mfa: mfa
    }).done((res) => {
        console.log(res);
        if(res.authenticated) {
            setcookie("prauxyToken", res.token + ":" + username + ":" + res.group, 365);

            var url = new URL(window.location.href);
            var redir = url.searchParams.get("go");

            if(firstLogin) alert("Welcome to Prauxy- you will be redirected to the password configuration page (you can get back at any time by pressing your username in the navigation bar)")

            window.location.href = window.location.protocol + "//" + (redir !== null ? redir + "." : "") + mainDomain + (redir == null && firstLogin ? "/me/settings" : "");
        } else {
            alert("Incorrect 2FA code");
        }
    })
    .fail((res) => {
        alert("Incorrect 2FA code")
    })
}

const confirmInputs = (inp) => {  
    if(inp == 0) {  
        const username = $("#username").val();
        const password = $("#password").val();

        $("#login").prop("disabled", !(username != "" && password != ""));
    } else if(inp == 1) {        
        const mfa = $("#mfa").val();

        $("#mfaContinue").prop("disabled", !(mfa.length == 6));

    }

}