var graph = require('fbgraph');
var fs = require("fs");
const mysql      = require('mysql');
const config = require('./config');
const constants = config.constants;

//var fb = new FacebookSearch(constants.facebook_app_id, constants.facebook_app_secret); 
 graph.setAccessToken(constants.access_token);
  graph.setVersion("2.8");
  
var searchFor = { q: 'restaurant',type: 'place', center: '51.50,-0.10', distance: 100000, limit:500 };

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

function getRestaurantNames(searchFor)
{
graph.search(searchFor, function(err, res) { 
    if(err)
    {
        console.log(err); 
    }
   //console.log(res);
   
   var obj = res.data;
    function getFbList(i)
    {
        if(i < obj.length)
        {
            connection.query("SELECT * FROM restaurantlist WHERE restaurantid ='" + obj[i].id+ "'",function(ferr,frows,ffields)
                   {
                  //console.log("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[i].id + "','" +obj[i].name.replace(/'/,'') + "')");
                       if(frows.length == 0)
                       {
                       	connection.query("INSERT INTO restaurantlist (restaurantid,restaurantnames) values('" + obj[i].id + "','" +obj[i].name.replace(/'/g,'') + "')", function(err, rows, fields) {
                    			if (err){
                    				console.log(err);
                    			}
                    			
                    			console.log("Row inserted");
                    			 getFbList(i + 1);
                    			 
                    		});
                       }
                       else if(frows.length == 1)
                       {
                           getFbList(i + 1);
                       }
                   });
                   
               
           
        }
        else
        {
            if(res.paging != undefined)
            {
                if(res.paging.cursors.after)
               {
                   recursivesearchcall(res.paging.cursors.after);
               }
            }
        }
            
        }
    
    getFbList(0); //First Call


}); 
}

getRestaurantNames(searchFor);

function recursivesearchcall(aftertoken)
{
    var nextsearch = { q: 'restaurant',type: 'place', center: '51.50,-0.10', distance: 100000, limit:500,after: aftertoken};
     if(aftertoken != "")
      {
         getRestaurantNames(nextsearch);
              
      }
              
}


