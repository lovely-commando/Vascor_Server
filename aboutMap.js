var mysqlDB = require('./mysql-db');
var crypto = require('crypto'); 

//map make
exports.mapMake = function(req,res){
    var p_id = req.body.p_id
    var m_password = req.body.m_password
    var m_owner = req.body.m_owner
    var m_status = req.body.m_status
    var m_size = req.body.m_size
    var m_unit_scale = req.body.m_unit_scale
    var m_rotation = req.body.m_rotation
    var m_center_place_string = req.body.m_center_place_string
    var m_center_point_latitude = req.body.m_center_point_latitude
    var m_center_point_longitude = req.body.m_center_point_longitude
    var m_salt = Math.round((new Date().valueOf() * Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(m_password+m_salt).digest("hex");
    
    var data = {p_id:p_id,m_password:hashPassword,m_owner:m_owner,m_status:m_status,m_size:m_size,
                m_unit_scale:m_unit_scale,m_rotation:m_rotation,m_center_place_string:m_center_place_string,
                m_center_point_latitude:m_center_point_latitude,m_center_point_longitude:m_center_point_longitude,
                m_salt:m_salt}
    mysqlDB.query('insert into MAPLIST set ?',data,function(err,results){
        var admit;
        if(err){
            console.log("맵 목록 insert 에러 발생");
            admit ={"overlap_examine":"error"};
        }else{
            console.log(results)
            admit = {"overlap_examine":"success","m_id":results.insertId}
        }
        res.write(JSON.stringify(admit));
        res.end()
    })
}

//map attendance
exports.mapAttendance = function(req,res){
    var mapId = req.body.mapId;
    var password = req.body.password;

    mysqlDB.query('select * from MAPLIST where m_id=?',[mapId],function(err,results){
        var attendance;
        if(err)
        {
            attendance = {"overlap_examine":"error"};
            console.log("방참가 에러 에러");
            console.log(JSON.stringify(attendance));
            res.write(JSON.stringify(attendance));
            res.end();
        }
        else if(!results[0]){
            attendance = {"overlap_examine":"no"}; 
            res.write(JSON.stringify(attendance));
            res.end();
        }
        else{
            var map = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+map.m_salt).digest("hex");
            if(hashpassword === map.m_password){
                attendance = {"overlap_examine":"yes"};
            }else{
                attendance = {"overlap_examine":"wrong"}
            }
            //console.log(JSON.stringify(attendance));
            res.write(JSON.stringify(attendance));
            res.end();
        }
    })
}