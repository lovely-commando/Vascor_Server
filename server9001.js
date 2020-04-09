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
var socketio = require('socket.io');


//내가만든 js파일
var mysqlDB = require('./mysql-db');
var login = require('./login')
var singUp = require('./sign-up')
var mypage = require('./mypage')
var mperson = require('./mperson')
var insertInfo = require('./insertInfo')
var aboutMap = require('./aboutMap.js')
var departmentInfo = require('./departmentInfo')

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

//departmentInfo.js(부서 변경, 부서 삭제)
router.route("/modify/department").get(departmentInfo.modfiyDepartment)//departmentInfo.js의 부서 수정
router.route("/delete/department").get(departmentInfo.deleteDepartment)//departmentINfo.js의 부서 삭제

//지도관련

router.route("/get/placeIndex").get(function(req,res){
    console.log("get placeindex")
    var mid = req.query.mid
    var query = 'select md_index from MAPDETAIL where m_id = ? and md_percent = -1.0'
    mysqlDB.query(query,[mid],function(err,results){
        console.log(results)
        res.send(JSON.stringify(results))
    })
})


var server = http.createServer(app).listen(app.get('port'),function(){
    console.log("익스프레스로 웹 서버를 실행함 : "+ app.get('port'))
}) //express를 이용해 웹서버 만든다

var io = socketio.listen(server)
console.log('socket.io 요청을 받아들일 준비가 되었습니다')

io.sockets.on('connection',function(socket){
    console.log("socket Id : "+socket.id+ " connect")
    var LatLngArr = new Array()
    
    
    // var data = {}
    // if(socket == null){
    //     data["check"] = "error"
    // }else{
    //     data["check"] = "success"
    // }
    // io.sockets.connected[socket.id].emit("connect",data)
    
    socket.on("makeRoom",function(data){
        socket.uid = data.uid
        socket.mid = data.mid

        var message = {}
        console.log("make room");
        if(io.sockets.adapter.rooms.hasOwnProperty(socket.mid)){
            console.log("이미 방이 만들어져 있습니다.");
            message["check"] = "success"
            socket.join(socket.mid)
        }else{
            socket.join(socket.mid)
            var curRoom = io.sockets.adapter.rooms[socket.mid];
            if(curRoom == null){
                message["check"] = "error"
            }else{
                console.log("방만들었습니다.")
                curRoom.uid = socket.uid;
                curRoom.mid = socket.mid;
                curRoom.sid = socket.id;
                //위치정보 저장할 배열도 있어야함
                console.log("curRoom : ",curRoom);
                console.log("curRoom_length : ", io.sockets.adapter.rooms[socket.mid].length)
                message["check"] = "success"
            }
        }
        console.log("message : ",message)
        io.sockets.connected[socket.id].emit('makeRoom',message)

       
        
    })

    socket.on("attendRoom",function(data){
        var uid = data.uid // user id
        var mid = data.mid // map id
        var message = {}

        if(socket == null){
            message["check"] = "error"
        }else{
            socket.join(mid);
            console.log("curRoom : ", io.sockets.adapter.rooms[mid]);
            console.log("curRoom_length : "+ io.sockets.adapter.rooms[mid].length);
            message["check"] = "success"
        }
        io.sockets.connected[socket.id].emit('attendRoom',message);
    })

    socket.on("sendLatLng", function(data){
        var curLat = data.Lat
        var curLng = data.Lng
        var curLatLng = '' + data.Lat + ";" + data.Lng
        console.log("socketMID : " + socket.mid)
        console.log("socketUID : "+ socket.uid)
        console.log("curLat : " + curLat);
        console.log("curLng : " + curLng);
        LatLngArr.push(curLatLng)
        if(LatLngArr.length > 20){
            var uploadtoDBLatLng = ""
            LatLngArr.forEach(function(element){
                uploadtoDBLatLng += element
                uploadtoDBLatLng += "@"
            })
            console.log("uploadtoDBLatLng : " + uploadtoDBLatLng)
            mysqlDB.query('INSERT into MAPLATLNG (m_id, u_id, latlng_arr) values (?, ?, ?);',[socket.mid, socket.uid, uploadtoDBLatLng],function(err,rows,fields){
                if(err){
                    console.log("위치정보 배열 에러")
                }
                else{
                    socket.to(socket.mid).emit("drawLatLng", uploadtoDBLatLng)
                }
            })
            LatLngArr = new Array()
            LatLngArr.push(curLatLng)  
        }
    })


})


