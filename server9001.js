//package.json은 외장모듈 관리를 위해 사용(npm init)
//node js 모듈
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
var socketio = require('socket.io');
var Jimp = require('jimp');


//내가만든 js파일
var mysqlDB = require('./mysql-db');
var login = require('./login')
var singUp = require('./sign-up')
var mypage = require('./mypage')
var mperson = require('./mperson')
var insertInfo = require('./insertInfo')
var aboutMap = require('./aboutMap.js')

mysqlDB.connect();

var app = express();

app.set('port',process.env.PORT || 9001); //포트 지정

app.use(express.static(path.join(__dirname,'public'))); //static directory 지정
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); //post방식으로 데이터 받기위해 2줄 적어야한다

app.use(cors());


var mpersonStorage = multer.diskStorage({
    destination : function(req,file,callback){
        callback(null,'./public/mperson_picture');
    },
    filename : function(req,file,callback){
        callback(null,file.originalname);
    }
})

var mpersonUpload = multer({
    storage : mpersonStorage,
    limits:{ 
        files:10,
        fileSize:1024*1024*1024
    }
})


var router = express.Router();
app.use('/',router);

router.route("/login/process").post(login.loginProcess) //로그인 처리

router.route("/examine").post(singUp.doubleCheck) //sign-up의 중복체크
router.route("/admin/process").post(singUp.signUp)//sign-up의 회원가입

//mypage.js(마이페이지 기능)
router.route("/change/department").get(mypage.changeDepartment) //mypage.js의 부서변경
router.route("/change/password").post(mypage.changePassword) //mypage.js의 비밀번호 변경
router.route("/mypage/maplist").get(mypage.getRoom) //mypage.js 방 가져오기
router.route("/delete/room").post(mypage.roomDelete)//mypage.js의 방삭제
router.route("/get/department").get(mypage.getDepartment) //mypage.js의 부서얻기

//insertInfo.js(부서 추가, 실종자 추가)
router.route("/insert/department").get(insertInfo.insertDepartment)//insertInfo.js의 부서추가
router.route("/insert/mperson").post(mpersonUpload.array('upload',1),insertInfo.insertMperson)//insertInfo.js의 실종자 추가

//mperson.js
router.route("/mperson").get(mperson.getMperson) //mperson.js의 실종자 정보 받아오기
router.route("/person/maplist").get(mperson.getMpersonMapList)

//aboutMap.js
router.route("/map/make").post(aboutMap.mapMake) 
router.route("/map/attendance").post(aboutMap.mapAttendance)


var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : "+ app.get('port'));
}) //express를 이용해 웹서버 만든다



