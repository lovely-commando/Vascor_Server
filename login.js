var mysql = require('mysql');
var mysqlDB = require('./mysql-db');
var crypto = require('crypto');


exports.loginProcess = function(req,res){ //로그인 처리
    var email = req.body.email;
    var password = req.body.password;
   // console.log("email : "+email);
   // console.log("password : "+password);

    mysqlDB.query('select * from USER where u_email=?',[email],function(err,results){
        var login;
        if(err)
        {
            login = {"check":"error"};
            console.log("로그인 에러");
            console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
        else if(!results[0]){
            login = {"check":"no"}; 
           // console.log("아이디 없음")
           // console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
        else{
            var user = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+user.u_salt).digest("hex");
            if(hashpassword === user.u_password){
                console.log("login success");
                if(user.u_department == null){
                    login = {"check":"yes","u_email":user.u_email,"u_name":user.u_name,"u_department":user.u_department,"u_id":user.u_id,"color":null}
                    res.write(JSON.stringify(login))
                    res.end();
                }
                else{
                    mysqlDB.query('select d.color from DEPARTMENT d,USER u where u.u_department = d.u_department and u.u_department = ?',[user.u_department],
                    function(err,results){
                        console.log(results)
                        var color = results[0].color
                        console.log("color : "+color)
                        login = {"check":"yes","u_email":user.u_email,"u_name":user.u_name,"u_department":user.u_department,"u_id":user.u_id,"color":color}
                        res.write(JSON.stringify(login));
                        res.end();
                    })
                }
               
            }else{
                //console.log("비밀번호가 틀림");
                login = {"check":"wrong"}
                res.write(JSON.stringify(login));
                res.end();
            }
           // console.log(JSON.stringify(login));
        }
    })
}