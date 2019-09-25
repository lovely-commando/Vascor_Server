//package.json은 외장모듈 관리를 위해 사용(npm init)
var http = require('http')
var express = require('express')
var static = require('serve-static')
var path = require('path')
var bodyParser = require('body-parser')
var multer = require('multer')
var fs = require('fs')
var cors = require('cors') // 다른 서버로 접근하기위해서 사용
var mysql = require('mysql');
var crypto = require('crypto'); //비밀번호 암호화

var mysqlDB = require('./mysql-db');
mysqlDB.connect();

var app = express();

app.set('port',process.env.PORT || 9000); //포트 지정

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); //post방식으로 데이터 받기위해 2줄 적어야한다

app.use(cors());

var storage = multer.diskStorage({
    destination : function(req,file,callback){
        callback(null,'public')
    }, //파일위치 정하기
    filename : function(req,file,callback){
       var extension = path.extname(file.originalname); //확장자
       var basename = path.basename(file.originalname,extension); //확장자 뺀 파일이름
       callback(null,basename+Date.now()+extension);
    } //파일이름 정하기
})

var upload = multer({
    storage : storage,
    limits:{
        files:10,
        fileSize:1024*1024*1024
    }
});

var router = express.Router();
app.use('/',router);

router.route("/examine").post(function(req,res){ //중복체크
    var email = req.body.email;
    console.log("email : "+email);
    mysqlDB.query('select * from USER where u_email=?',[email],function(err,results){
        if(err){
            console.log("에러발생");
        }
        else if(results[0])
        {
            console.log("이미 이메일이 존재합니다.");
            res.writeHead(200,{"Content-Type":"text/html;charset=uft8"});
            var examine={"overlap_examine":"deny"};
            res.write(JSON.stringify(examine));
            res.end();
        }
        else{
            console.log("존재하지 않습니다.")
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            var examine={"overlap_examine":"access"}
            res.write(JSON.stringify(examine));
            res.end();
        }
    })  
})

router.route("/admin/process").post(function(req,res){ //회원가입
    var email = req.body.email;
    var inputPassword = req.body.password;
    var name = req.body.name;
    var department = req.body.department;
    var salt = Math.round((new Date().valueOf() * Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(inputPassword+salt).digest("hex");
    console.log(`email : ${email} , inputPassword : ${inputPassword}, hashPassword : ${hashPassword}, name : ${name} , department : ${department}, salt : ${salt}`);
    
    var data = {u_email:email,u_password:hashPassword,u_name:name,u_department:department,u_salt:salt};
    mysqlDB.query('insert into USER set ?',data,function(err,results){
        var admit;
        if(err){
            console.log("회원가입시 inser 에러 발생");
            admit ={"overlap_examine":"deny"};
            res.write(JSON.stringify(admit));
            res.end()
        }else{
            admit={"overlap_examine":"success"};
            console.log("회원가입 성공");
            res.write("success")
        }
    })
})

router.route("/login/process").post(function(req,res){ //로그인 처리
    var email = req.body.email;
    var password = req.body.password;
    console.log("email : "+email);
    console.log("password : "+password);

    mysqlDB.query('select * from USER where u_email=?',[email],function(err,results){
        var login;
        if(err)
        {
            login = {"overlap_examine":"error"};
            console.log("로그인 에러");
        }
        else if(!results[0]){
            login = {"overlap_examine":"no"}; 
            console.log("아이디 없음")
            
        }
        else{
            var user = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+user.u_salt).digest("hex");
            if(hashpassword === user.u_password){
                console.log("login success");
                login = {"overlap_examine":"yes"};
            }else{
                console.log("비밀번호가 틀림");
                login = {"overlap_examine":"wrong"}
            }
            console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
    })
})


router.route("/mperson").get(function(req,res){
    mysqlDB.query('select * from MPERSON',function(err,rows,fields){
        if(err){
            console.log("query error : " + err);
            //res.send(err);
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
})

router.route('/process/gettest').get(function(req,res){
    var id = req.query.id;
    var password = req.query.password;
    console.log(`id : ${id} , password : ${password}`);
    res.writeHead(200,{"Content-Type":'text/html;charset=utf8'});
    res.write(`<h3>id : ${id} , password : ${password}</h3>`);
    res.end();
})

router.route('/process/login').post(function(req,res){
    var id = req.body.id || req.query.id;
    var password = req.body.password || req.query.password;
    console.log(`id : ${id} , password : ${password}`);
})

router.route('/process/file').post(upload.array('photo',1),function(req,res){ //photo는 웹페이지 input의 name값
    console.log('/process/photo 라우팅 함수 호출됨.'); 

    var files = req.files; //여기에 파일정보가 있다. 
    console.log('==== 업로드된 파일 ====');
    if(files.length >0){
        console.log(files[0]);
    }else{
        console.log('파일이 없습니다');
    }

    if(Array.isArray(files)){
        for(var i =0;i<files.length;i++){
            originalname = files[i].originalname;
            filename = files[i].filename;
            mimetype = files[i].mimetype;
            size = files[i].size;
            console.log(`originalname : ${originalname} , filename : ${filename} , mimetype : ${mimetype} , size : ${size}`);
        }
    }

    res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
    res.write("<h1>파일 업로드 성공</h1>")
    res.end();
})

app.use(function(req,res,next){
    res.writeHead(200,{'Content-Type':'text/html;charset=utf8'})
    res.write(`<h3>해당하는 내용이 없습니다</h3>`)
    res.end();
})

var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : "+ app.get('port'));
}) //express를 이용해 웹서버 만든다
