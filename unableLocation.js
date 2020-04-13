var mysqlDB = require('./mysql-db');

exports.selectWholeInfo = function(req,res){ //
    var mapid = req.query.m_id;
    console.log("mid : ",mapid)
    mysqlDB.query('select ul_longitude, ul_latitude from UNABLE_LOCATION where m_id = ?',[mapid],function(err,rows,fields){
        if(err){
            console.log(err);
            console.log("에러 발생");
        }
        else{
            res.send(JSON.stringify(rows)); 
        }
    })
}

exports.selectDetailInfo = function(req,res){ //

    var mapid = req.query.m_id; 
    var latitude = req.query.ul_latitude;
    var longitude = req.query.ul_longitude;  
    console.log(mapid);
    console.log(latitude);
    console.log(longitude);
    var query = 'select ul_desc, ul_file from UNABLE_LOCATION where m_id = ? and ul_latitude = ? and ul_longitude = ?'
    console.log(query);
    mysqlDB.query(query,[mapid, latitude, longitude],function(err,results){
        if(err){
            console.log(err);
            console.log("detail error");
        }
        else{
            console.log(results);
            res.send(JSON.stringify(results[0])); 
        }
    })
}