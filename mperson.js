var mysql = require('mysql');
var mysqlDB = require('./mysql-db');


exports.getMperson = function(req,res){ //실종자 리스트 받아오기 (지역정보 쿼리스트링으로 받아오기)
    mysqlDB.query('select * from MPERSON',function(err,rows,fields){
        if(err){
            console.log("query error : " + err);
        }else{
            var result = 'rows : '+JSON.stringify(rows)+'<br><br>' +
            'fields : ' + JSON.stringify(fields);
            console.log(rows);
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
}

exports.getMpersonMapList = function(req,res){ //실종자 지도 리스트 받아오기
    var p_id = req.query.p_id;
    mysqlDB.query('select * from MAPLIST where m_status = 1 and p_id=?',[p_id],function(err,rows,fields){
        if(err){
            console.log("error 입니다");
            console.log(err);
        }else{
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
}