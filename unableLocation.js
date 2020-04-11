var mysqlDB = require('./mysql-db');

exports.selectWholeInfo = function(req,res){ //
    var mapid = req.query.m_id;
    
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
    mysqlDB.query('select ul_desc, ul_file from UNABLE_LOCATION where m_id = ? and ul_longitude = ? and ul_latitude = ?',[mapid, latitude, longitude],function(err,rows,fields){
        if(err){
            console.log(err);
            console.log("에러 발생");
        }
        else{
            res.send(JSON.stringify(rows)); 
        }
    })
}