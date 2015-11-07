'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var async = require('async');
var hbs = require('express-hbs');
var baucis = require('baucis');
var Colu = require('colu');
var CoinKey = require('coinkey');
var ci = require('coininfo');
var bodyParser = require('body-parser');
var util = require('util');
var Redis = require('ioredis');

var ourServer = '159.122.238.144';

var coluSettings = {
	network: 'testnet',
	privateSeed: '5b5dc4509ff10a38b90916f23ab3fb50a534ddcb30f6cd003f8eb8ca09eb02af',
	redisHost: ourServer
};

// init express
var app = express();
var redis = new Redis(6379, ourServer);
var colu = new Colu(coluSettings);
app.use(bodyParser());


colu.on('connect', function () {
	var privateSeed = colu.hdwallet.getPrivateSeed();
	console.log("privateSeed: ", privateSeed)
});

app.configure(function(){
    app.set('port', process.env.PORT || 80);

    app.set('view engine', 'handlebars');
    app.set('views', __dirname + '../app/scripts/views');
});

// set logging
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// mount static
app.use(express.static( path.join( __dirname, '../app') ));
app.use(express.static( path.join( __dirname, '../.tmp') ));

app.use(bodyParser.json());


// route index.html
app.get('/', function(req, res){
  res.sendfile( path.join( __dirname, '../app/index.html' ) );
});

app.get('/patient/:patientAddress', function(req, res){
	colu.coloredCoins.getAddressInfo(req.params.patientAddress, function (err, body) {
		if (err) return console.error(err);

		console.log('get patient', req.params.patientAddress);
		console.log(err);
		console.log(body);
        var records=[];

		//loop through patient records
		for(var i=0 ; i<body.utxos.length;i++){
	        for(var j=0 ; j<body.utxos[i].assets.length;j++){
	        	console.log(body.utxos[i].assets[j]);
	        	records.push(body.utxos[i].assets[j].assetId);
	        }
	    }

		res.status(200).json({
			records: {
				"records": records
			}
		});

	});
});

app.post('/patient', function(req, res){
	console.log('Create Patient');
	var ck = CoinKey.createRandom(ci('BTC-TEST'));
	console.log('Created Patient Private Key', ck.privateWif);
	console.log('Created Patient Public Key', ck.publicAddress);
	res.status(201).json({
		patient: {
			public_key: ck.publicAddress,
			private_key: ck.privateWif
		}
	});
});

app.post('/doctor', function(req, res){
	console.log('Create Doctor');
	var ck = CoinKey.createRandom(ci('BTC-TEST'));
	console.log('Created Doctor Private Key', ck.privateWif);
	console.log('Created Doctor Public Key', ck.publicAddress);
	redis.set(ck.publicAddress, ck.privateWif);
	res.status(201).json({
		patient: {
			public_key: ck.publicAddress
		}
	});
});

app.post('/record', function(req, res){
	console.log('Create Medical Record');
	var toAddress = req.body.patientId;
	var medicalRecord = {
		patientId : req.body.patientId,
		dateOfBirth : req.body.dateOfBirth,
		gender : req.body.gender
	};
	console.log(medicalRecord);
	var asset = {
    	amount: 1,
		reissueable: false,
	    metadata: medicalRecord,
		transfer: [{
			address: toAddress,
			amount: 1
		}]
	};

	console.log("Create & Send asset");
	colu.issueAsset(asset, function (err, body) {
		if (err) {
			console.log("Create asset - error");
			res.status(500).json({ error: err });
		}
		console.log("response: ", body);
		console.log("issue address: ", body.issueAddress);
		console.log("receiving address: ", body.receivingAddresses);
		res.status(201).json({
			record: {
				"txid" : body.txid,
				"assetId" : body.assetId,
				"issueAddress" : body.issueAddress
			}
		});
	});

});

app.put('/record', function(req, res){
	var toAddress = req.query.toAddress;
	var fromAddress = req.query.fromAddress;
	var assetId = req.query.assetId;
	transferAsset(assetId, toAddress, fromAddress, res);
});


app.get('/record', function(req, res){
	console.log('Get Medical Record by Asset Address');
	console.log(req.query);
	var asset = {
    	assetId: req.query.assetId
	};
	// TODO: Change to getAssetMetaData
    colu.coloredCoins.getAssetData(asset,function (err, body) {
        if (err) return console.error(err);
        console.log("AssetData: ", util.inspect(body, {depth:10}));
		res.status(201).json({
			record: {
				assetId : body.assetId,
				medicalRecord : body.assetData[0].metadata.metadataOfIssuence.data
			}
		});
    })
});



// start server
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express App started!');
});


colu.init();
