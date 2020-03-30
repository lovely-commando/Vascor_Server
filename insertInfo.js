var mysqlDB = require('./mysql-db');


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
//    console.log(extension);
//    console.log(basename);
//    console.log(files[0].originalname);
   
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
}

exports.insertDepartment = function(req,res){
    var department = req.query.department
    var color = req.query.color

    var data = {"u_department":department,"color":color}
    mysqlDB.query("insert into DEPARTMENT set ?",data,function(err,results){
        var check
        if(err){
            console.log(err)
            check = {"overlap_examine":"error"}
        }else{
            check = {"overlap_examine":"success"}
        }
        res.send(JSON.stringify(check))
    })
}

