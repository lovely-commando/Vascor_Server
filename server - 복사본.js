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


router.route("/mapdetail").get(function(req,res){
    var m_id = req.query.m_id;
    console.log("m_id : "+m_id);
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
            console.log(rows);
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
})


router.route("/map/attendance").post(function(req,res){ //방 참가 처리
    var mapId = req.body.mapId;
    var password = req.body.password;
    console.log("mapId : "+mapId);
    console.log("password : "+password);

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
            console.log("방 없음")
            console.log(JSON.stringify(attendance));
            res.write(JSON.stringify(attendance));
            res.end();
        }
        else{
            var map = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+map.m_salt).digest("hex");
            if(hashpassword === map.m_password){
                console.log("attendance success");
                attendance = {"overlap_examine":"yes"};
            }else{
                console.log("attendance fail");
                attendance = {"overlap_examine":"wrong"}
            }
            console.log(JSON.stringify(attendance));
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
    console.log(`mperson : ${mperson} , mapPassword : ${mapPassword}, mapOwner : ${mapOwner}, mapStaus : ${mapStaus} , mapHorizontal : ${mapHorizontal}, mapVertical : ${mapVertical} , `+
                `mapPlacestring : ${mapPlacestring} , mapPlaceLatitude : ${mapPlaceLatitude}, mapPlaceLongitude : ${mapPlaceLongitude}, mapUp : ${mapUp} , mapDown : ${mapDown}, mapRight : ${mapRight} , `+
                `mapLeft : ${mapLeft} , mapUnitScale : ${mapUnitScale}, mapRotation : ${mapRotation}, mapCenterLatitude : ${mapCenterLatitude} , mapCenterLongitude : ${mapCenterLongitude}, mapNorthWestLatitude : ${mapNorthWestLatitude} , `+
                `mapNorthWestLongitude : ${mapNorthWestLongitude} , mapNorthEastLatitude : ${mapNorthEastLatitude}, mapNorthEastLongitude : ${mapNorthEastLongitude},`+
                `mapSouthWestLatitude : ${mapSouthWestLatitude} , mapSouthWestLongitude : ${mapSouthWestLongitude}, mapSouthEastLatitude : ${mapSouthEastLatitude},`+
                `mapSouthEastLongitude : ${mapSouthEastLongitude} , salt : ${salt}, hashPassword : ${hashPassword}`);
    
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
            console.log("회원가입 성공");
            res.write(JSON.stringify(admit));
            res.end();
        }
    })
})


router.route("/mypage/maplist").get(function(req,res){ //맵정보 가저오기
    var u_id = req.query.u_id;
    mysqlDB.query('select m_id,p_name,m_place_string from MAPLIST,MPERSON where m_status = 1 and m_owner=? and MAPLIST.p_id=MPERSON.p_id',[u_id],function(err,rows,fields){
        if(err){
            console.log("error 입니다");
        }else{
            console.log(rows);
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            res.write(JSON.stringify(rows));
            res.end();
        }
    })
})

router.route("/delete/room").post(function(req,res){ //방삭제
    var mapId = req.body.mapId;
    var password = req.body.password;
    console.log("mapId : "+mapId);
    console.log("password : "+password);

    mysqlDB.query('select * from MAPLIST where m_id=?',[mapId],function(err,results){
        var delete_room;
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
            console.log("방 없음")
            console.log(JSON.stringify(delete_room));
            res.write(JSON.stringify(delete_room));
            res.end();
        }
        else{
            var map = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+map.m_salt).digest("hex");
            if(hashpassword === map.m_password){
                console.log("delete_room success");
                delete_room = {"overlap_examine":"yes"};
                mysqlDB.query(`UPDATE MAPLIST SET m_status = 0 WHERE m_id=${mapId}`);
            }else{
                console.log("delete_room fail");
                delete_room = {"overlap_examine":"wrong"}
            }
            console.log(JSON.stringify(delete_room));
            res.write(JSON.stringify(delete_room));
            res.end();
        }
    })
});

router.route("/change/department").get(function(req,res){ //부서 변경
    var u_department = req.query.u_department;
    var u_id = req.query.u_id;
    console.log("u_id : "+u_id);
    console.log("u_department : "+u_department);
    
    mysqlDB.query('update USER set u_department = ? where u_id=?',[u_department,u_id],function(err,rows,fields){
        var user;
        if(err){
            console.log("에러 발생");
            user = {"check":"no"}
            res.send(JSON.stringify(user))
        }else{
            console.log("부서변경 성공");
            user = {"check":"yes"}
            res.send(JSON.stringify(user))
        }
    })
});

router.route("/change/password").post(function(req,res){ //비밀번호 변경
    var u_id = req.body.u_id;
    var password = req.body.password;
    console.log("u_id : "+u_id);
    console.log("password : "+password);
    
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
            console.log("rows : " + rows);
            console.log("fields : "+ fields);
            user={"check":"yes"}
            res.send(JSON.stringify(user)); 
        }
    })
})

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
            res.writeHead(200,{"Content-Type":"text/html;charset=utf8"});
            var examine={"overlap_examine":"deny"};
            console.log(JSON.stringify(examine));
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
            console.log("회원가입시 insert 에러 발생");
            admit ={"overlap_examine":"deny"};
            res.write(JSON.stringify(admit));
            res.end()
        }else{
            admit={"overlap_examine":"success"};
            console.log("회원가입 성공");
            res.write(JSON.stringify(admit));
            res.end();
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
            login = {"check":"error"};
            console.log("로그인 에러");
            console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
        else if(!results[0]){
            login = {"check":"no"}; 
            console.log("아이디 없음")
            console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
        else{
            var user = results[0];
            var hashpassword = crypto.createHash("sha512").update(password+user.u_salt).digest("hex");
            if(hashpassword === user.u_password){
                console.log("login success");
                login = {"check":"yes","u_email":user.u_email,"u_name":user.u_name,"u_department":user.u_department,"u_id":user.u_id};
            }else{
                console.log("비밀번호가 틀림");
                login = {"check":"wrong"}
            }
            console.log(JSON.stringify(login));
            res.write(JSON.stringify(login));
            res.end();
        }
    })
})


router.route("/mperson").get(function(req,res){ //실종자 리스트 (지역정보 쿼리스트링으로 받아오기)
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

var io = socketio.listen(server); //소켓 서버 생성
console.log('socket.io 요청을 받아들일 준비가 되었습니다');

var user_list = {};
var user_id = new Array();
//socket
io.sockets.on('connection',function(socket){
   
    console.log('Socket ID : '+ socket.id + ', Connect');
    
    socket.on('attendRoom', function(data){  //방참여 
        console.log("접속한 소켓 id : "+socket.id); 
        console.log("data.id : "+data.id);
        user_list[data.id] = socket.id;
        socket.attend_id = socket.id;//socket에 attend_id변수 추가하고 socket.id값 넣기
        var message = { msg: 'server', data:'data'}
        user_id[user_id.length] = data.id;
        io.sockets.connected[user_list[data.id]].emit('attendRoom',message);
    })
    
    socket.on('complete',function(data){
        console.log('Client Message : '+data);
        var mid = data.mid;
        var districtNum = data.districtNum;
        var index = data.index;
        console.log("mid : "+mid);
        console.log("districtNum : "+districtNum);
        console.log("index : "+index);
        
        var DBdata = {m_id:mid,md_districtNum:districtNum,md_index:index,md_status:"1"};
        mysqlDB.query('insert into MAPDETAIL set ?',DBdata,function(err,results){
            if(err){
                console.err("error입니다.")
            }
        })
        //디비에저장

        //모두에게 데이터 보내기
        var serve_data = {
            districtNum : districtNum,
            index : index
        };
        //console.log("user_size : "+user_id.length);
        io.sockets.emit("complete",serve_data);
        /*for(var i = 0;i<user_id.length;i++){
            console.log("user_id : "+user_id[i]);
            io.sockets.connected[user_list[user_id[i]]].emit("complete",serve_data);
        }*/
    });

    socket.on('not_complete',function(data){
        console.log('Client Mesaage : '+data);
        var mid = data.mid;
        var districtNum = data.districtNum;
        var index = data.index;
        var content = data.content;
        console.log("mid : "+mid);
        console.log("dist : "+districtNum);
        console.log("index : "+index);
        console.log("content : "+content);

        var DBdata = {m_id:mid,md_districtNum:districtNum,md_index:index,md_status:"0"};
        mysqlDB.query('insert into MAPDETAIL set ?',DBdata,function(err,results){
            if(err){
                console.log("error입니다.")
                console.log(err)
            }
        })

        //디비 저장

        var serve_data = {
            districtNum : districtNum,
            index : index,
            content : content
        };
        
        io.sockets.emit("not_complete",serve_data);
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