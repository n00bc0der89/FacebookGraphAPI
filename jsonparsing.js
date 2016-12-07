const sanitizeHtml = require('sanitize-html');
const config = require('./config');
const constants = config.middlewareconstants;
const jsonParsing = {};
var fs = require('fs');
const kafka  = require('kafka-node');
var Producer 		= kafka.Producer;
var kafkaClient 	= new kafka.Client('localhost:2181');
var producer 		= new Producer(kafkaClient);
	
(function(jsonParsing){

  jsonParsing.getParsedString = function(inputString){
	
	var idList = ["id","about","bio","business","category","category_list","cover","description","engagement","fan_count","hours","is_always_open","is_verified",
	"is_permanently_closed","is_unclaimed","link","location.city","location.country","location.latitude","location.longitude","location.street","location.zip",
	"name","overall_star_rating","place_type","price_range","rating_count","username","verification_status","website"];

	inputString = inputString.replace(/<3/g,'').trim();
	//inputString = inputString.replace(/(\r\n|\n|\r)/gm,"").trim();
	
	var input = sanitizeHtml(inputString, {
		allowedTags: [],
		allowedAttributes: []
	});

	input = input.replace(/&amp;/gi,'&').trim();
	input = input.replace(/&lt;/gi,'<').trim();
	input = input.replace(/&gt;/gi,'>').trim();
	input = input.replace(/\|/g,'#').trim();
	input = input.replace(/&quot;/gi,'"').trim();
	input = input.replace(/\t/g,'').trim();
	input = input.replace(/\n/g,'').trim();
	input = input.replace(/\r/g,'').trim();
	input = input.replace(/(?:\r\n|\r|\n)/g,' ').trim();
	
	var val;
try{
	

	var parsedJSON = JSON.parse(input);

	
	if(parsedJSON.feed != undefined)
	{
	for(var d =0; d < parsedJSON.feed.data.length; d++)
	{
		var output="";
			
		for(var i=0;i<idList.length;i++)
		{
				val = 'parsedJSON.'+idList[i];
				
				try{
					evalVal = eval(val);
				}
				catch(ex){
					
					evalVal = '';
				}
				
				if(evalVal == undefined || evalVal == null) {
					
					output = output + 'null' + constants.fieldDelimter;
				}else{
					if(val == "parsedJSON.description")
					{
						
						var desc = evalVal;
						desc = desc.replace(/(\r\n|\n|\r)/gm,"").trim(); 
						output = output + desc + constants.fieldDelimter;
						console.log(desc);
					}
					else
					{
					output = output + evalVal + constants.fieldDelimter;
					}
					
				} 
		}
			
			//Get Feed related fields and append it.
			var message = (parsedJSON.feed.data[d].message != undefined ? parsedJSON.feed.data[d].message : null);	//message
			if(message != null)
			{
				message = message.replace(/(\r\n|\n|\r)/gm,"").trim();
			}
			output = output + message + constants.fieldDelimter;
			console.log(message);
			var picture = (parsedJSON.feed.data[d].picture != undefined ? parsedJSON.feed.data[d].picture : null);		//picture
			output = output + picture + constants.fieldDelimter;
			var videosource = (parsedJSON.feed.data[d].source != undefined ? parsedJSON.feed.data[d].source : null);		//video
			output = output + videosource + constants.fieldDelimter;
			var link = (parsedJSON.feed.data[d].link != undefined ? parsedJSON.feed.data[d].link : null);				//link
			output = output + link + constants.fieldDelimter;
			
			// Three obj - Comment, Like, Share
			var action = null;
			if(parsedJSON.feed.data[d].actions != undefined)
			{
					//Comment
				  action = (parsedJSON.feed.data[d].actions[0] != undefined ? parsedJSON.feed.data[d].actions[0].name : null) + "," + 
						   (parsedJSON.feed.data[d].actions[0] != undefined ? parsedJSON.feed.data[d].actions[0].link : null) + "," +  
						   (parsedJSON.feed.data[d].actions[1] != undefined ? parsedJSON.feed.data[d].actions[1].name : null) + "," +  
						   (parsedJSON.feed.data[d].actions[1] != undefined ? parsedJSON.feed.data[d].actions[1].link : null) + "," +  
						   (parsedJSON.feed.data[d].actions[2] != undefined ? parsedJSON.feed.data[d].actions[2].name : null) + "," +  
						   (parsedJSON.feed.data[d].actions[2] != undefined ? parsedJSON.feed.data[d].actions[2].link : null);
			}
				output = output + action + constants.fieldDelimter;
				
			var mess_tags = null;
			if(parsedJSON.feed.data[d].message_tags != undefined)
			{
				if(parsedJSON.feed.data[d].message_tags.length > 0)
				{
					for(var l =0; l < parsedJSON.feed.data[d].message_tags.length; l++ )
					{
						mess_tags = "";
						mess_tags += parsedJSON.feed.data[d].message_tags[l].id + "," + parsedJSON.feed.data[d].message_tags[l].name + "," + parsedJSON.feed.data[d].message_tags[l].type; 
					}
					
				}
			}
			output = output + mess_tags + constants.fieldDelimter;
			
			var id = (parsedJSON.feed.data[d].id != undefined ? parsedJSON.feed.data[d].id : null);
			output = output + id + constants.fieldDelimter;
			
			output = output.substr(0,output.length-1);
			output = output + "\n";
			
			payloads = [{topic: 'facebooktopic', messages: output, partition: 0 }];
			 
			 producer.send(payloads, function (err, data) {
	            //console.log(payloads.messages);
	            	fs.appendFile("op/output.txt",output,function(err){
						console.log(err);
						 console.log('Writing File');
					});
			   // console.log('Pushed Successfully');
    		 });
		}
	}

}catch(ex){
	console.log(ex);
	
		fs.appendFile("op/errfile.txt",input,function(err){
		console.log(err);	
	});
	
	
}

	//output = output.substr(0,output.length-1);
//	return output;	
  };

}(jsonParsing));

module.exports = jsonParsing;