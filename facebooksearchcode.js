var FacebookSearch = require('facebook-search');
var fs = require("fs");
const mysql      = require('mysql');
const config = require('./config');
const constants = config.constants;

var fb = new FacebookSearch(constants.facebook_app_id, constants.facebook_app_secret); 

var searchFor = { q: 'restaurants',type: 'place', center: '51.50,-0.10', distance: 10000 };

console.log("host: " + process.env.IP);
console.log("port: " + process.env.PORT);
const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 connection.connect();


fb.search(searchFor, function(err, res) { 
    if(err)
    {
        console.log(err); 
    }
   //console.log(res);
   
   var obj = res;
    function getFbList(i)
    {
        if(i < obj.length)
        {
            connection.query("SELECT * FROM restaurantlist WHERE restaurantid ='" + obj[i].id+ "'",function(ferr,frows,ffields)
                   {
                  //console.log("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[i].id + "','" +obj[i].name.replace(/'/,'') + "')");
                       if(frows.length == 0)
                       {
                       	connection.query("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[i].id + "','" +obj[i].name.replace(/'/,'') + "')", function(err, rows, fields) {
                    			if (err){
                    				console.log(err);
                    			}
                    			
                    			console.log("Row inserted");
                    		});
                       }
                   });
            getFbList(i + 1);
        }
    }
    
    getFbList(0); //First Call

fb.next(function(nerr, nres) {
    if(nerr)
    {
       console.log(nerr); 
    }
   // console.log(res);
    obj = nres;
   
   function getnextFbList(j)
    {
        if(j < obj.length)
        {
            connection.query("SELECT * FROM restaurantlist WHERE restaurantid ='" + obj[j].id+ "'",function(nferr,nfrows,nffields)
                   {
                  //console.log("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[i].id + "','" +obj[i].name.replace(/'/,'') + "')");
                       if(nfrows.length == 0)
                       {
                       	connection.query("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[j].id + "','" +obj[j].name.replace(/'/,'') + "')", function(err, rows, fields) {
                    			if (err){
                    				console.log(err);
                    			}
                    			
                    			console.log("Row inserted");
                    		});
                       }
                   });
            getnextFbList(j + 1);
        }
    }
   
       getnextFbList(0);  //Call next page link
       
    setTimeout(function(){
	connection.end();

	}, 30000);
	
});

}); 

