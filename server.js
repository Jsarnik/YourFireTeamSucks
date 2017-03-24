// Get the packages we need
var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var request = require('request');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');
var timeout = require('connect-timeout');
var db = require('sqlite3');

//Set our SSL Credentials
const privateKey = fs.readFileSync('./ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
const passphrase = fs.readFileSync('./ssl/passphrase.txt', 'utf8');
const sslOptions = {key:privateKey, cert: certificate, passphrase: passphrase};
var cookieJar;

// Create our Express application
var app = express();

// Set view engine to ejs
app.set('view engine', 'ejs');

// Use the body-parser package in our application
app.use(bodyParser.json());  // needed for express 4.0^ - post requests to parse body
app.use(bodyParser.urlencoded({
  extended: true
}));

var apiKey = '52cfc245497e4f11b0439d64b610e510';
//var key = 'b1ccfe5ba9154988b1356d03e85fa735';
var credentials = {destinyKey: apiKey, defaultMemberType: 2};
var currentAuth = null;
var currentUserAuthRequestHeader = {
      'X-API-Key': credentials.destinyKey,
      'Authorization': null
    }

var platformType = {
      'xBox': 1,
      'PlayStation': 2
    }

var router = express.Router();

//Destiny Host and Base Request
const HOST = 'http://www.bungie.net/Platform/Destiny/';
var destinyBaseRequest = request.defaults({headers: {'X-API-Key': credentials.destinyKey}});
var privateBaseRequest = request.defaults({headers: currentUserAuthRequestHeader});

router.post('/getAccessTokenFromCode', function(req, res, next){

  var bodyContent = req.body.params.body;
  var headers = {
          'X-API-Key': credentials.destinyKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'accept': 'application/json'
      }

  // Configure the request
  var options = {
          url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromCode/',
          path: '/Platform/App/GetAccessTokensFromCode/',
          method: 'POST',
          headers: headers,
          form: JSON.stringify(bodyContent)
      }

  // Start the request
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var setCookies = response.headers["set-cookie"] || req.header.cookies['set-cookie'] || cookieJar;
        var jsonResponse = JSON.parse(body);

        if(setCookies){
          cookieJar = parseCookies(setCookies);
        }

        if(jsonResponse.Response){
          currentAuth = jsonResponse.Response;
          currentUserAuthRequestHeader['Authorization'] = 'Bearer ' + currentAuth.accessToken.value;
          privateBaseRequest.headers = currentUserAuthRequestHeader;
          //res.json({status: 200, message: 'success', 'set-cookie' : setCookies});
          res.json(currentUserAuthRequestHeader);
          return;
        }
        res.json(currentUserAuthRequestHeader);
      }
      else{
        res.json(error);
      }
  });
});

// TODO: BUILD A REFRESH TOKEN REQUEST


//PRIVATE ENDPOINTS
router.get('/getCompleteCharacterInfo', function(req, res, next){
    credentials.defaultMemberType = req.query.membershipType || credentials.defaultMemberType;

    privateBaseRequest(HOST + credentials.defaultMemberType + '/Account/' + req.query.membershipId + '/Character/' + req.query.characterId + '/Complete',
        function (err, response, body) {
          var jsonResponse;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            jsonResponse = JSON.parse(body);
          } catch (e) {
            res.status(500);
            jsonResponse = {ErrorCode: 500, Error: e};
          }

          res.json(jsonResponse);
    });
});



// PUBLIC ENDPOINTS
router.get('/getMembershipIdByUserName', function(req, res, next){
    credentials.defaultMemberType = req.query.memberType;
    var user = req.query.userName;

    if(user.charAt(0) === '#'){
      user = user.substring(1, user.length-1);
    }

    destinyBaseRequest(HOST + 'SearchDestinyPlayer/' + credentials.defaultMemberType + '/' + user + '/',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            jsonResponse = JSON.parse(body);
          } catch (e) {
            res.status(500);
            result = {ErrorCode: 500, Error: e};
          }

          if(jsonResponse.Response){
            result = jsonResponse.Response[0];
          }
          else if(jsonResponse.ErrorCode){
            res.status(401);
            result = {ErrorCode: 401, Error: jsonResponse.Message};
          }

          res.json(result);
    });
});
   
router.get('/getCharacterInfoByMembershipId', function(req, res, next){
    destinyBaseRequest(HOST + credentials.defaultMemberType + '/Account/' + req.query.membershipId + '/Summary/',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          var response = JSON.parse(body);
          res.json(response);
    });
});

router.get('/getCharacterStatsById', function(req, res, next){
    destinyBaseRequest(HOST + '/Stats/AggregateActivityStats/' + credentials.defaultMemberType + '/' + req.query.membershipId + '/' + req.query.characterId + '/',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            result = jsonResponse = JSON.parse(body);
          } catch (e) {
            res.status(500);
            result = {ErrorCode: 500, Error: e};
          }

          res.json(result);
    });
});

router.get('/getCharacterActivityHistoryData', function(req, res, next){
    destinyBaseRequest(HOST + '/Stats/ActivityHistory/' + 
      credentials.defaultMemberType + '/' + 
      req.query.membershipId + '/' + 
      req.query.characterId + '/' + 
      '?mode=' + req.query.mode + '&page=' + req.query.page + '&definitions=true',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            result = jsonResponse = JSON.parse(body);
          } catch (e) {
            res.status(500);
            result = {ErrorCode: 500, Error: e};
          }

          res.json(result);
    });
});

router.get('/getPostGameCarnageReport', function(req, res, next){
    destinyBaseRequest(HOST + '/Stats/PostGameCarnageReport/' + req.query.instanceId + '/?definitions=true',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            result = jsonResponse = JSON.parse(body);
          } catch (e) {
            res.status(500);
            result = {ErrorCode: 500, Error: e};
          }

          res.json(result);
    });
});

router.get('/getWeaponDefinitionById', function(req, res, next){
      destinyBaseRequest(HOST + credentials.defaultMemberType + '/' + 
        '/Account/' + req.query.membershipId + '/' + 
        'Character/' +
        req.query.characterId + '/' + 
        'ItemReference/' +
        req.query.referenceId + '/' + 
        '/?definitions=true',
        function (err, response, body) {
          var jsonResponse, result;
          res.setHeader('Content-Type', 'application/json');
          res.status(200);

          try {
            result = jsonResponse = JSON.parse(body).definitions.items[req.query.referenceId];
          } catch (e) {
            res.status(500);
            result = {ErrorCode: 500, Error: e};
          }

          res.json(result);
    });
});

function cookieString (cookies) {
    var cookieString = '';

    cookies.forEach(function( cookie ) {
        cookieString += cookie.split(';')[0] + ',';
    });

    return cookieString.substring(0, cookieString.length-1);
}

function parseCookies (cookies) {
    var list = {};

    cookies.forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

app.use(timeout(120000));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

app.use(express.static(__dirname + '/app'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

// Register all our routes with /api
app.use('/api', router);

//create http and https servers
var httpServer = http.createServer(app);
var httpsServer = https.createServer(sslOptions, app);

// Use environment defined port or 3000
var httpPort = process.env.PORT || 3000;
var httpsPort = process.env.PORT || 8000;

// Start the http server
httpServer.listen(httpPort, "127.0.0.1", function(err) {
    console.log(err, httpServer.address());
}); 

// Start the https server
httpsServer.listen(httpsPort, "127.0.0.1", function(err) {
    console.log(err, httpsServer.address());
});
