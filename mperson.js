var mysql = require('mysql');
var mysqlDB = require('./mysql-db');
var path = require('path')
var fs = require('fs')



exports.insertMperson = function(req,res){ //실종자 추가
    var p_name = req.body.p_name;
   var p_age = req.body.p_age;
   var p_time = req.body.p_time;
   var p_place_string = req.body.p_place_string;
   var p_place_latitude = req.body.p_place_latitude;
   var p_place_longitude = req.body.p_place_longitude;
   var p_place_description = req.body.p_place_description;
   //console.log(`${p_name} , ${p_age},${p_time}, ${p_place}`)
   var files = req.files;
   var p_photo = files[0].originalname;
   var extension = path.extname(files[0].originalname); //확장자
   var basename = path.basename(files[0].originalname,extension);
   console.log(extension);
   console.log(basename);
   console.log(files[0].originalname);
   
   var data = {p_name : p_name , p_age:p_age,p_time:p_time, p_place_string:p_place_string, p_place_latitude:p_place_latitude,
   p_place_longitude:p_place_longitude,p_place_description:p_place_description,p_photo:p_photo};
   var data2;
   mysqlDB.query('insert into MPERSON set ?',data,function(err,results){
       if(err){
           console.log('mperson insert시 에러발생');
           console.log("error : "+err);
           data2= {overlap_examine:'no'}
       }
       else{
           data2 = {overlap_examine:'yes'}
       }
       res.write(JSON.stringify(data2));
   })

   var files = req.files;
}

exports.getMperson = function(req,res){ //실종자 리스트 받아오기 (지역정보 쿼리스트링으로 받아오기)
    mysqlDB.query('select * from MPERSON',function(err,rows,fields){
        if(err){
            console.log("query error : " + err);
        }else{
            var result = 'rows : '+JSON.stringify(rows)+'<br><br>' +
            'fields : ' + JSON.stringify(fields);
            console.log(rows);
            //console.log("result : " +result);
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
}