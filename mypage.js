var mysql = require('mysql');
var mysqlDB = require('./mysql-db');
var crypto = require('crypto');

exports.changePassword = function(req,res){ //비밀번호 변경
    var u_id = req.body.u_id;
    var password = req.body.password;
    
    var salt = Math.round((new Date().valueOf() * Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(password+salt).digest("hex");
    mysqlDB.query('update USER set u_password=?,u_salt=? where u_id=?',[hashPassword,salt,u_id],function(err,rows,fields){
        var user;
        if(err){
            console.log(err);
            console.log("에러 발생");
            user={"check":"no"};  
            res.send(JSON.stringify(user));          
        }
        else{
            //console.log("rows : " + rows);
            //console.log("fields : "+ fields);
            user={"check":"yes"}
            res.send(JSON.stringify(user)); 
        }
    })
}


exports.getDepartment = function(req,res){
    mysqlDB.query("select * from DEPARTMENT",function(err,rows,fields){
        if(err){
            console.log(err)
            console.log("error 입니다")
        }else{
           // console.log(rows)
            res.write(JSON.stringify(rows))
        }
    })
}


exports.changeDepartment = function(req,res){ //부서 변경
    var u_department = req.query.u_department;
    var u_id = req.query.u_id;

    //색상정보 알아오기
    mysqlDB.query('select color from DEPARTMENT where u_department=?',[u_department],function(err,results){
        var data
        if(err){
            console.log("에러 발생");
            data={"check":"error"}
            res.send(JSON.stringify(data))
        }else{
           // console.log("color얻어오기")
            var color = results[0]
            console.log("color : "+color.color)
            mysqlDB.query('update USER set u_department = ? where u_id=?',[u_department,u_id],function(err,rows,fields){
                var user;
                if(err){
                    console.log("에러 발생");
                    user = {"check":"error"}
                    res.send(JSON.stringify(user))
                }else{
                   // console.log("부서변경 성공");
                    user = {"check":"yes","color":color.color}
                    res.send(JSON.stringify(user))
                }
            })
        }
    })
}


exports.getRoom = function(req,res){  //자신이 만든 방 가져오기 수정필요
    var u_id = req.query.u_id;
    mysqlDB.query('select m_id,p_name,m_center_place_string from MAPLIST,MPERSON where m_status = 1 and m_owner=? and MAPLIST.p_id=MPERSON.p_id',[u_id],function(err,rows,fields){
        if(err){
            console.log("error 입니다");
        }else{
            console.log(rows);
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
}

exports.roomDelete = function(req,res){ //방삭제
    var mapId = req.body.mapId;
    var password = req.body.password;
    //console.log("mapId : "+mapId);
    //console.log("password : "+password);

    mysqlDB.query('select * from MAPLIST where m_id=?',[mapId],function(err,results){
        var delete_room
        if(err)
        {
            delete_room = {"overlap_examine":"error"};
            console.log("방참가 에러 에러");
            console.log(JSON.stringify(delete_room));
            res.write(JSON.stringify(delete_room));
            res.end();
        }
        else if(!results[0]){
            delete_room = {"overlap_examine":"no"}; 
            res.write(JSON.stringify(delete_room));
            res.end();
        }
        else{
            var map = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+map.m_salt).digest("hex");
            if(hashpassword == map.m_password){
                //console.log("delete_room success");
                
                mysqlDB.query(`UPDATE MAPLIST SET m_status = 0 WHERE m_id=${mapId}`,function(err,results){
                    if(err){
                        delete_room = {"overlap_examine":"error"};
                        res.send(JSON.stringify(delete_room))
                    }else{
                        delete_room = {"overlap_examine":"yes"}
                        res.send(JSON.stringify(delete_room))
                    }

                });
            }else{
                delete_room = {"overlap_examine":"wrong"}
                res.send(JSON.stringify(delete_room))
            }
        }
    })
}