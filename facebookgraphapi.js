var graph = require('fbgraph');
const config = require('./config');
const constants = config.constants;
const mysql      = require('mysql');
const kafka  = require('kafka-node');
var Producer 		= kafka.Producer;
var kafkaClient 	= new kafka.Client('localhost:2181');
var producer 		= new Producer(kafkaClient);


 
 graph.setAccessToken(constants.access_token);
 
 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 connection.connect();
 graph.setVersion("2.8");
 
 	payloads = [{	 topic: 'facebooktopic', messages: "", partition: 0 }];
 
 connection.query("SELECT * FROM restaurantlist",function(ferr,frows,ffields)
    {
        if(frows.length > 0)
        {
            
            function getDetails(n)
            {
                
                if(n < frows.length)
                {
                    var ep = frows[n].epoch;
                    var date = new Date().toISOString();
                    var params = "";
                    if(ep == null)
                    {
                      params = { fields: "id,about,bio,business,category,category_list,cover,description,engagement,fan_count,general_info,hours,is_always_open,is_verified,is_permanently_closed,is_unclaimed,link,location,name,overall_star_rating,place_type,price_range,rating_count,username,verification_status,website,feed.until("+ date +"){message,place,link,actions,message_tags,scheduled_publish_time}" }; 
                    }
                    else
                    {
                         params = { fields: "id,about,bio,business,category,category_list,cover,description,engagement,fan_count,general_info,hours,is_always_open,is_verified,is_permanently_closed,is_unclaimed,link,location,name,overall_star_rating,place_type,price_range,rating_count,username,verification_status,website,feed.since("+ ep +"){message,place,link,actions,message_tags,scheduled_publish_time}" }; 
                    }
                    
                    
                    graph.get(frows[n].restaurantid.toString(), params,  function(err, res) {
                      //console.log(res); // { picture: "http://profile.ak.fbcdn.net/..." } 
                      if(err)
                      {
                          console.log(err);
                      }
                      if(res != null)
                      {
                          var data = res;
                      
                              //console.log(data);
                         payloads.messages = JSON.stringify(data);
                         
                         producer.send(payloads, function (err, data) {
						    console.log('Pushed Successfully');
					    });
                      }
                      
                      if(data.feed != undefined)
                      {
                          if(data.feed.paging && data.feed.paging.next) {
                                recursivecall(data.feed,n);
                          }
                      }
                      else
                      {
                          getDetails(n + 1);
                      }
                    });
                }
            }
            
            getDetails(0);
            
            
            //Recursive function call
            
        function recursivecall(res,n)
          {
              if(res.paging && res.paging.next)
              {
                  graph.get(res.paging.next, function(nerr, nres) {
                      if(nerr)
                      {
                          console.log(nerr);
                      }
                        var ndata = nres;
          
                             // console.log(ndata);
                            payloads.messages = JSON.stringify(data);
                         
                             producer.send(payloads, function (err, data) {
    						    console.log('Pushed Successfully');
    					    });
                           
                           
                          recursivecall(nres,n); //Recursive call
                  });
              }
              else
              {
                  //Update sql table : epoch field with todays date time.
                  connection.query('UPDATE restaurantlist SET epoch = "'+ new Date().toISOString() +'" WHERE restaurantid = "'+ frows[n].restaurantid +'";', function(err, rows, fields) {
					if (err) 
					{
					 console.log(err);   
					}
					else
					{
					    console.log("Updated");
					}
				});
                  
                  getDetails(n + 1); 
              }
             
          }
  
        }
    });
                      
        
    
