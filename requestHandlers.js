var querystring = require("querystring");
var redis = require("redis");
var client = redis.createClient("6379", "127.0.0.1");
var gs = require("nodegrass");
var fs = require("fs");

function start(res) {
	console.log("Request handler 'start' was called.");

    res.writeHead(200, {"Content-Type": "text/html"});
    res.end();

}

function redisHmset(postData, urlData, callback) {
	client.select('1', function(error) {
		if (error) {
			console.log("error");
		} else {
			var info = {}
			info.stuName = querystring.parse(postData)["stuName"];
			info.stuNum = querystring.parse(postData)["stuNum"];
			info.stuUrl = querystring.parse(postData)["stuUrl"];
			info.stuPage = urlData
			client.hmset(info.stuName, info, function(error, res) {
				if (error) {
					console.log(error);
				} else {
					console.log(res);
				}
	            if (typeof callback == 'function') {
		            callback(postData);
	            }
			});
		}
	});
}

function redisHmget(info, key, callback) {
	client.on("error", function(error) {
		console.log("error");
	});

	client.select('1', function(error){
	    if(error) {
	        console.log(error);
	    } else {
	        client.hmget(info, key, function(error, res){
	            if(error) {
	                console.log(error);
	            } else {
	                console.log(res);   
	            }
	            if (typeof callback == 'function') {
			        callback(res);	            
	            }
	        });
	    }
	});
}


function upload(res, postData) {
	console.log("Request handler 'upload' was called.");
	
	client.on("error", function(error) {
		console.log("error");
	});
	

	
	gs.get("http://" + querystring.parse(postData)["stuUrl"], function(data) {
		console.log(data);
		redisHmset(postData, data, function(postData) {
			res.writeHead(200, {"Content-Type": "text/plain"});
			redisHmget(querystring.parse(postData)["stuName"], "stuName", function(key) {
				res.write("You've uploaded your profile\n");
				res.write("Name: " + key + "\n");
				redisHmget(querystring.parse(postData)["stuName"], "stuNum", function(key) {
					res.write("ID: " + key + "\n");
					redisHmget(querystring.parse(postData)["stuName"], "stuUrl", function(key) {
						res.write("Url: " + key + "\n");
						res.end();
						client.end();
					});
				});
			});
		});

		fs.writeFile(querystring.parse(postData)["stuUrl"] + ".html", data, function(error) {
			if (error) {
				console.log(error);
			}
		});
	}, "utf8").on("error", function(error) {
		console.log("error");
	});	
	
}

exports.start = start;
exports.upload = upload;