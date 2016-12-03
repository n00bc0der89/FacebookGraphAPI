var graph = require('fbgraph');
const config = require('./config');
const constants = config.constants;
const mysql      = require('mysql');


var params = { fields: "feed" };
 
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
 connection.query("SELECT restaurantid FROM restaurantlist",function(ferr,frows,ffields)
    {
        if(frows.length > 0)
        {
            function getDetails(n)
            {
                
                if(n < frows.length)
                {
                    graph.get(frows[n].restaurantid.toString(), params,  function(err, res) {
                      //console.log(res); // { picture: "http://profile.ak.fbcdn.net/..." } 
                      if(err)
                      {
                          console.log(err);
                      }
                      if(res != null)
                      {
                          var data = res.feed.data;
                      
                          for(var i =0; i < data.length; i++)
                          {
                              console.log(data[i].message + "," + data[i].created_time);
                          } 
                      }
                      
                      if(res.feed.paging && res.feed.paging.next) {
                            recursivecall(res.feed,n);
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
                        var ndata = nres.data;
          
                          for(var j =0; j < ndata.length; j++)
                          {
                              console.log(ndata[j].message + "," + ndata[j].created_time);
                          }
                          
                          recursivecall(nres,n); //Recursive call
                  });
              }
              else
              {
                  getDetails(n + 1); 
              }
             
          }

            
            
            
        }
    });
                      
        
    