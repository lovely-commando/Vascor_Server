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
var socketio = require('socket.io');
var Jimp = require('jimp');


var mysqlDB = require('./mysql-db');
var login = require('./login')
var singUp = require('./sign-up')
var mypage = require('./mypage')
var mperson = require('./mperson')



mysqlDB.connect();

var app = express();

app.set('port',process.env.PORT || 9001); //포트 지정

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); //post방식으로 데이터 받기위해 2줄 적어야한다

app.use(cors());



var storage = multer.diskStorage({
    destination : function(req,file,callback){
        var dir = './public/not_complete_picture';
        callback(null,dir);

    }, //파일위치 정하기
    filename : function(req,file,callback){
       var extension = path.extname(file.originalname); //확장자
       var basename = path.basename(file.originalname,extension); //확장자 뺀 파일이름
       callback(null,basename+extension);
    } //파일이름 정하기
})

var upload = multer({
    storage : storage,
    limits:{
        files:10,
        fileSize:1024*1024*10
    }
});


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

router.route("/change/department").get(mypage.changeDepartment) //mypage.js의 부서변경
router.route("/change/password").post(mypage.changePassword) //mypage.js의 비밀번호 변경
router.route("/mypage/maplist").get(mypage.getRoom) //mypage.js 방 가져오기
router.route("/delete/room").post(mypage.roomDelete)//mypage.js의 방삭제



router.route("/insert/mperson").post(mpersonUpload.array('upload',1),mperson.insertMperson)//mperson.js의 실종자 추가
router.route("/mperson").get(mperson.getMperson) //mperson.js의 실종자 정보 받아오기







router.route("/complete/data").get(function(req,res){
    var m_id = req.query.m_id;
    console.log("m_id : " + m_id);

    mysqlDB.query("select m_find_latitude, m_find_longitude from MAPLIST where m_id =?",[m_id],function(err,results){
        if(err){
            console.log("complete 에러 발생");
        }else{
           // console.log(JSON.stringify(results));
            var data = { 
                "m_find_latitude":results[0].m_find_latitude,
                "m_find_longitude":results[0].m_find_longitude
            }
            res.write(JSON.stringify(data));
        }
    })
})

router.route("/not_complete/list").get(function(req,res){ //특정 인덱스에 대해서만 수색불가정보 가저오기
    var m_id = req.query.m_id;
    var index = req.query.index;
    console.log("m_id : "+m_id);
    console.log("index : "+index);
    mysqlDB.query('select ul_longitude,ul_latitude,ul_desc,ul_file,ul_index from UNABLE_LOCATION where m_id = ? and ul_index = ?',[m_id,index],function(err,rows,fields){
        if(err){
            console.log("not_complete_list error입니다")
        }
        else{
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
})

router.route("/tracking/list").get(function(req,res){
    var mid = req.query.m_id;
    var index = req.query.index;
    console.log("mid : "+mid);
    console.log("index : "+index);
    mysqlDB.query("select * from MAPDETAIL where m_id = ? and md_index = ?",[mid,index],function(err,rows,fields){
        if(err){
            console.log("mapdetail query error : "+err);
        }else{
           // console.log("mapdetail rows : "+ JSON.stringify(rows));
            res.write(JSON.stringify(rows));
        }
    })
})



//기존 맵에 들어갔을 때, 전체 지도 트래킹 정보 받아오기

router.route("/get/detail/data").get(function(req,res){
    var mid = req.query.mid;
    

    mysqlDB.query("select  md_index,md_inner_scale,md_run_length from MAPDETAIL where m_id = ?",[mid],function(err,rows,fields){
        if(err){
            console.log("mapdetail query error : "+err);
        }else{
          //  console.log("mapdetail rows : "+ JSON.stringify(rows));
            res.write(JSON.stringify(rows));
        }
    })
})

//전체 지도 수색불가 정보 받아오기
router.route("/get/not_complete/data").get(function(req,res){
    var mid = req.query.mid;

    mysqlDB.query("select ul_longitude,ul_latitude,ul_desc,ul_file,ul_index from UNABLE_LOCATION where m_id = ?",[mid],function(err,rows,fields){
        if(err){
            console.log("unable_location query error :"+err);

        }else{
           // console.log("u_l_q  rows : "+JSON.stringify(rows));
            res.write(JSON.stringify(rows));
        }
    })
})



///여기서부터 
/*router.route("/complete").get(function(req,res){
    var mid = req.query.mid;
    var lat = req.query.lat;
    var lng = req.query.lng;
    console.log("mid : "+mid);
    console.log("lat : "+lat);
    console.log("lng : "+lng);
    var data;
    mysqlDB.query('UPDATE MAPLIST SET m_find_latitude = ?, m_find_longitude = ? where m_id = ?',[lat, lng, mid],function(err,rows,fields){
        if(err){
            console.log("실종자 발견")
            data ={"overlap_examine":"deny"};
            res.write(JSON.stringify(data));
            res.end()
        }
        else{
            data = {"overlap_examine" : 'yes'};
            res.write(JSON.stringify(data));
            res.end();
        }
    })
});*/



/*router.route("/not_complete").get(function(req,res){
    var mid = req.query.mid;
    var desc = req.query.desc;
    var lat = req.query.lat;
    var lng = req.query.lng;
    console.log("mid : "+mid);
    console.log("desc : "+desc);
    console.log("lat : "+lat);
    console.log("lng : "+lng);
    var data;
    mysqlDB.query('INSERT into UNABLE_LOCATION (m_id, ul_longitude, ul_latitude, ul_desc) values (?, ?, ?, ?);',[mid, lng,lat, desc],function(err,rows,fields){
        if(err){
            console.log("발견지점 불가 삽입 실패")
            data ={"overlap_examine":"deny"};
            res.write(JSON.stringify(data));
            res.end()
        }
        else{
            data = {"overlap_examine" : 'yes'};
            res.write(JSON.stringify(data));
            res.end();
        }
    })

    
    
})*/
   

router.route("/not_complete/image").post(upload.array("upload",1),function(req,res){ //수색불가시 사진 보낼 때의 url
    var files = req.files;
    var mid = req.body.mid;
  

    console.log("mid : "+mid);
  

    console.log('===업로드된 파일 ====');
    console.log(files[0]); 
    console.log("file name : "+files[0].originalname);
    var dir = "./public/not_complete_picture/"+mid;
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    var admit;
    fs.renameSync("./public/not_complete_picture/"+files[0].originalname, dir+"/"+files[0].originalname,function(err){});
        
    admit = {"overlap_examine" : 'yes'};
    res.write(JSON.stringify(admit));
    res.end();
    
  

});
    





router.route("/mapdetail").get(function(req,res){
    var m_id = req.query.m_id;
    mysqlDB.query('select * from MAPDETAIL where m_id = ?',[m_id],function(err,rows,fields){
        if(err){
            console.log("error입니다")
        }
        else{
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
})



router.route("/person/maplist").get(function(req,res){ //맵정보 가져오기,실종자별로 
    var p_id = req.query.p_id;
    mysqlDB.query('select m_id, p_id, m_owner, m_status, m_horizontal, m_vertical, m_place_string, m_place_latitude, m_place_longitude, m_up, m_down, m_right, m_left, m_unit_scale,' +
                    'm_rotation, m_center_point_latitude, m_center_point_longitude, m_northWest_latitude, m_northWest_longitude, m_northEast_latitude, m_northEast_longitude,' +
                    'm_southWest_latitude, m_southWest_longitude, m_southEast_latitude, m_southEast_longitude from MAPLIST where m_status = 1 and p_id=?',[p_id],function(err,rows,fields){
        if(err){
            console.log("error 입니다");
            console.log(err);
        }else{
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
})


router.route("/map/attendance").post(function(req,res){ //방 참가 처리
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
                //console.log("attendance success");
                attendance = {"overlap_examine":"yes"};
            }else{
                //console.log("attendance fail");
                attendance = {"overlap_examine":"wrong"}
            }
            //console.log(JSON.stringify(attendance));
            res.write(JSON.stringify(attendance));
            res.end();
        }
    })
})

router.route("/map/make").post(function(req,res){ //맵만들기
    var mperson                    = req.body.mperson;
    var mapPassword                = req.body.mapPassword;
    var mapOwner                   = req.body.mapOwner;
    var mapStaus                   = req.body.mapStatus;
    var mapHorizontal              = req.body.mapHorizontal;
    var mapVertical                = req.body.mapVertical;
    var mapPlacestring             = req.body.mapPlacestring;
    var mapPlaceLatitude           = req.body.mapPlaceLatitude;
    var mapPlaceLongitude          = req.body.mapPlaceLongitude;
    var mapUp                      = req.body.mapUp;
    var mapDown                    = req.body.mapDown;
    var mapRight                   = req.body.mapRight;
    var mapLeft                    = req.body.mapLeft;
    var mapUnitScale               = req.body.mapUnitScale;
    var mapRotation                = req.body.mapRotation;
    var mapCenterLatitude          = req.body.mapCenterLatitude;
    var mapCenterLongitude         = req.body.mapCenterLongitude;
    var mapNorthWestLatitude       = req.body.mapNorthWestLatitude;
    var mapNorthWestLongitude      = req.body.mapNorthWestLongitude;
    var mapNorthEastLatitude       = req.body.mapNorthEastLatitude;
    var mapNorthEastLongitude      = req.body.mapNorthEastLongitude;
    var mapSouthWestLatitude       = req.body.mapSouthWestLatitude;
    var mapSouthWestLongitude      = req.body.mapSouthWestLongitude;
    var mapSouthEastLatitude       = req.body.mapSouthEastLatitude;
    var mapSouthEastLongitude      = req.body.mapSouthEastLongitude;
    var salt = Math.round((new Date().valueOf() * Math.random())) + "";
    var hashPassword = crypto.createHash("sha512").update(mapPassword+salt).digest("hex");
    /*console.log(`mperson : ${mperson} , mapPassword : ${mapPassword}, mapOwner : ${mapOwner}, mapStaus : ${mapStaus} , mapHorizontal : ${mapHorizontal}, mapVertical : ${mapVertical} , `+
                `mapPlacestring : ${mapPlacestring} , mapPlaceLatitude : ${mapPlaceLatitude}, mapPlaceLongitude : ${mapPlaceLongitude}, mapUp : ${mapUp} , mapDown : ${mapDown}, mapRight : ${mapRight} , `+
                `mapLeft : ${mapLeft} , mapUnitScale : ${mapUnitScale}, mapRotation : ${mapRotation}, mapCenterLatitude : ${mapCenterLatitude} , mapCenterLongitude : ${mapCenterLongitude}, mapNorthWestLatitude : ${mapNorthWestLatitude} , `+
                `mapNorthWestLongitude : ${mapNorthWestLongitude} , mapNorthEastLatitude : ${mapNorthEastLatitude}, mapNorthEastLongitude : ${mapNorthEastLongitude},`+
                `mapSouthWestLatitude : ${mapSouthWestLatitude} , mapSouthWestLongitude : ${mapSouthWestLongitude}, mapSouthEastLatitude : ${mapSouthEastLatitude},`+
                `mapSouthEastLongitude : ${mapSouthEastLongitude} , salt : ${salt}, hashPassword : ${hashPassword}`);*/
    
    var data = {p_id:mperson,m_password:hashPassword,m_owner:mapOwner,m_status:mapStaus,m_horizontal:mapHorizontal,m_vertical:mapVertical,
                m_place_string:mapPlacestring,m_place_latitude:mapPlaceLatitude,m_place_longitude:mapPlaceLongitude,m_up:mapUp,m_down:mapDown,m_right:mapRight,m_left:mapLeft,
                m_unit_scale:mapUnitScale,m_rotation:mapRotation,m_center_point_latitude:mapCenterLatitude,m_center_point_longitude:mapCenterLongitude,
                m_northWest_latitude:mapNorthWestLatitude,m_northWest_longitude:mapNorthWestLongitude,
                m_northEast_latitude:mapNorthEastLatitude,m_northEast_longitude:mapNorthEastLongitude,
                m_southWest_latitude:mapSouthWestLatitude,m_southWest_longitude:mapSouthWestLongitude,
                m_southEast_latitude:mapSouthEastLatitude,m_southEast_longitude:mapSouthEastLongitude,
                m_salt:salt};
    mysqlDB.query('insert into MAPLIST set ?',data,function(err,results){
        var admit;
        if(err){
            console.log("맵 목록 insert 에러 발생");
            admit ={"overlap_examine":"deny"};
            res.write(JSON.stringify(admit));
            res.end()
        }else{
            admit={"overlap_examine":"success","m_id":results.insertId};
            //console.log("results :" +JSON.stringify(results));
            //console.log("회원가입 성공");
            res.write(JSON.stringify(admit));
            res.end();
            var run_length = " ";
            var scale = 0;
            if(mapUnitScale == "20"){
                scale = '4';
                run_length = '2,14,'
            } else if(mapUnitScale == '30' || mapUnitScale == '50'){
                scale = '8';
                run_length = '2,30,'
            } else if(mapUnitScale == '100'){
                scale = '16';
                run_length = '2,62,'
            } else if(mapUnitScale == '250'){
                scale = '32';
                run_length = '2,126,'
            } else{
                scale = '64';
                run_length = '2,254,'
            }
            var data2 ;
            for(var i =0;i<64;i++){
                data2 = {
                    "m_id":results.insertId,
                    "md_index":i,
                    "md_inner_scale":scale,
                    "md_run_length":run_length
                }
                mysqlDB.query('insert into MAPDETAIL set ?',data2,function(err,row,fields){
                    if(err){
                        console.log("mapdetail insert error");
                    }else{
                        console.log("mapdetail insert success");
                    }
                })
            }
        }
    })
})





router.route('/process/file').post(upload.array('photo',1),function(req,res){ //photo는 웹페이지 input의 name값
  //  console.log('/process/photo 라우팅 함수 호출됨.'); 

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

var io = socketio.listen(server); //소켓 서버 생성

console.log('socket.io 요청을 받아들일 준비가 되었습니다');

io.sockets.on('connection',function(socket){
   
    console.log('Socket ID : '+ socket.id + ', Connect');
    
    socket.on('attendRoom',function(data){
        var u_id = data.id // user id
        var m_id = data.mapid // map id
        
        socket.join(m_id);
        var message = { msg: 'server', data:'방참여'}
        console.log("curRoom : "+ io.sockets.adapter.rooms[m_id]);
        console.log("curRoom_length : "+ io.sockets.adapter.rooms[m_id].length);
        io.sockets.connected[socket.id].emit('attendRoom',message);
    
    })

    socket.on('makeroom',function(data){
        var u_id = data.id //user id
        var m_id = data.mapid //map id

        console.log("make room");
        if(io.sockets.adapter.rooms[m_id]){
            console.log("이미 방이 만들어져 있습니다.");
        }else
        console.log('새로방을 만듭니다');

        socket.join(m_id);

        var curRoom = io.sockets.adapter.rooms[m_id];
        curRoom.u_id = u_id;
        curRoom.m_id = m_id;
        curRoom.s_id = socket.id;
        console.log("curRoom : "+curRoom);
        var message = {msg:'server',data :'방만들기 완료'}
        io.sockets.connected[socket.id].emit('makeroom',message);
    })
    
    socket.on('complete',function(data){
        console.log('Client Message : '+data);
        var mid = data.mid;
        var lat = data.lat;
        var lng = data.lng;
        console.log("mid : "+mid);
        console.log("lat :" +lat);
        console.log("lng : "+lng);
        
        //모두에게 데이터 보내기
        var serve_data = {
            lat : lat,
            lng : lng
        };
        var data;
        mysqlDB.query('UPDATE MAPLIST SET m_find_latitude = ?, m_find_longitude = ? where m_id = ?',[lat, lng, mid],function(err,rows,fields){
            if(err){
                console.log("실종자 발견")
            }
            else{
               console.log("성공");
            }
        })
        
        io.sockets.in(mid).emit('complete',serve_data);
    });

    socket.on('not_complete',function(data){ //사진 넣어야함 =>사진은 http로
        console.log('Client Mesaage : '+data);
        var mid = data.mid;
        var lat = data.lat;
        var lng = data.lng;
        var desc = data.desc;
        var photo_name;
        var index = data.index;
        if(data.photo_name == null)
            photo_name = null;
        else{
            photo_name = data.photo_name;
        }

        console.log("mid : "+mid);
        console.log("dist : "+lat);
        console.log("index : "+lng);
        console.log("content : "+desc);
        console.log("img name :"+photo_name);
        console.log("index : "+index)


        //디비 저장
        mysqlDB.query('INSERT into UNABLE_LOCATION (m_id, ul_longitude, ul_latitude, ul_desc,ul_file,ul_index) values (?, ?, ?, ?,?,?);',[mid, lng,lat, desc,photo_name,index],function(err,rows,fields){
            if(err){
                console.log("발견지점 불가 삽입 실패")
            }
            else{
                var serve_data = {
                    "lat":lat,
                    "lng":lng,
                    "desc":desc,
                    "photo_name":photo_name,
                    "index":index
                };
                
                io.sockets.in(mid).emit('not_complete',serve_data);
            }
        })  
    })

    socket.on('seeroad',function(data){
        var uid = data.uid;
        var mid = data.mid;
        var lat = data.lat;
        var lng = data.lng;
        var index = data.index;
        //var scale = data.scale;
        var run_length = data.run_length;

        data = {
            "m_id":mid,
            "md_index" : index,
            "md_run_length":run_length
        }

        mysqlDB.query("update MAPDETAIL set md_run_length=? where m_id=? and md_index=?",[run_length,mid,index],function(err,rows,fields){
            if(err){
                console.log("mapdetail update error");
            }else{
                console.log("mapdetail update success");
            }
        }) // 디비에 run_length 관련 데이터 저장
        
        console.log("mid : "+mid);
        console.log("lat : "+lat);
        console.log("lng : "+lng);
        serve_data = {
            "uid":uid,
            "lat":lat,
            "lng":lng
        } //방에있는 클라이언트에게 뿌릴 데이터

        io.sockets.in(mid).emit('seeroad',serve_data);
        console.log("io_socket");
    })

   /* socket.on('disconnect',function(data){
        var u_id = data.u_id;
        var socket_id = user_list[u_id];
        console.log("disconnect");
        console.log("data : "+u_id);
        var index = user_id.indexOf(u_id);
        user_id.pop(index);
        delete user_list.u_id;
        io.sockets.connected[socket_id].emit("disconnect",null);
    })*/
})


