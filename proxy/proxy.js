const _CONF = require('../config');

var proxy = require('redbird')({port: _CONF.ports.proxy, bunyan: false});
var http = require('http');

const authenticate = require('../auth/confirmAuth');

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

var urls = require('url');

http.createServer(function (req, res) {
    var goTo = (req.url.slice(1, -1) || "");
    res.writeHead(302, {
        'Location': _CONF.createURL("auth") + (goTo !== "" ? "?go=" + goTo : "")
      });
    res.end();
}).listen(_CONF.ports.unauthed, () => console.log("Unauth Redirect Server Started"));

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

const confirmAuth = (host, url, req) => {
    const mainApp = req.headers.host.split(".")[0]

    const cookies = parseCookies(req);

    if(cookies.kvToken !== undefined || mainApp == "unauthed" || mainApp == "auth") {

        return null;
    } 

    return "http://localhost:" + _CONF.ports.unauthed;

    // // return null;
    // return mainApp == "auth" ? null : {url: "http://localhost/auth/verify"};
}

confirmAuth.priority = 200;
proxy.addResolver(confirmAuth);

proxy.register("auth.home.kentonvizdos.com", "http://localhost:" + _CONF.ports.auth);

proxy.register("home.kentonvizdos.com", "http://localhost:" + _CONF.ports.dashboard);

const registerSaved = () => {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("homerouter");
        dbo.collection("applications").find({}).toArray(function(err, result) {
            if (err) throw err;

            for(p of result) {
                proxy.register(_CONF.createURL(p.shortName, true), "http://localhost:" + p.port);

            }
        });
    });
}

registerSaved();

console.log("Proxy Server Started")

// module.exports.add = function(sub, port) {
//     proxy.register(sub + ".home.kentonvizdos.com", "http://portabeast:" + port);

// };

module.exports = {
    add: (sub, port) => {
        proxy.register(_CONF.createURL(sub, true), "http://localhost:" + port);
    }
}