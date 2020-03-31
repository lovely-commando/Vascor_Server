var mysqlDB = require('./mysql-db');

//부서 정보 수정
exports.modfiyDepartment = function(req,res){ //
    var origin_department = req.query.origin_department;
    var new_department = req.query.new_department;
    var color = req.query.color;
    
    mysqlDB.query('update DEPARTMENT set u_department=?,color=? where u_department=?',[new_department,color,origin_department],function(err,rows,fields){
        var department;
        if(err){
            console.log(err);
            console.log("에러 발생");
            department={"checked":"error"};  
            res.send(JSON.stringify(department));          
        }
        else{
            // console.log("new_department" + new_department);
            // console.log("color : " + color);
            // console.log("origin_department" + origin_department)
            department={"checked":"done"}
            res.send(JSON.stringify(department)); 
        }
    })
}

//부서 정보 삭제
exports.deleteDepartment = function(req,res){ //
    var department = req.query.department;
    // var color = req.query.color;
    
    mysqlDB.query('delete FROM DEPARTMENT where u_department=?',[department],function(err,rows,fields){
        var res_department;
        if(err){
            console.log(err);
            console.log("에러 발생");
            res_department={"checked":"error"};  
            res.send(JSON.stringify(res_department));          
        }
        else{
            res_department={"checked":"yes"}
            res.send(JSON.stringify(res_department)); 
        }
    })
}