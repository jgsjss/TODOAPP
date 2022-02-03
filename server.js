const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const { redirect } = require('express/lib/response');
const rsp = require('express/lib/response');
const req = require('express/lib/request');
const methodOverride = require('method-override');
const { Db } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const usersRouter = require('./routes/users')

const bcrypt = require('bcrypt')
require('dotenv').config();
app.set('view engine', 'ejs');

let db;
MongoClient.connect(process.env.DB_URL, function(err, client){
    if(err) return console.log(err);

    db = client.db('Todo')

    app.listen(process.env.PORT, function(){
        console.log('listening on 8000');
    });
})

app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'))

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));

app.use(passport.initialize());

app.use(passport.session());


//사용자pw를 암호화 하지 않았기에 보안이 쓰레기
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function(inputId, inputPw, done){
    console.log(inputId, inputPw);
    db.collection('member').findOne({userId: inputId}, function(err, res){
        console.log(res.userPw)
        if(err) return done(err)
        //done((서버에러),(성공시 db데이터),(에러메세지))
        if(!res) return done(null, false, {message: 'ID가 틀렸거나 존재하지 않습니다.'})
        if(inputPw == res.userPw){
            console.log('로그인 성공')
            return done(null, res)
        }else{
            return done(null, false, {message: '비밀번호가 일치하지 않습니다.'})
        }
    })
}));
//세션을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function (user, done) {
    done(null, user.userId)
  });
//세션데이터를 가진 사람을 db에서 찾는 코드  
passport.deserializeUser(function (id, done) {
    db.collection('member').findOne({userId : id}, function(err, res){
        done(null, res)
    })
  }); 
//로그인체크 메소드
function isLogin(req, rsp, nmext){
    if(req.user){
        nmext()
    }else{
        rsp.send('회원만 이용 가능합니다.');
    }
}

app.get('/',function(req, rsp){
    rsp.render('index.ejs');
})

app.get('/write', isLogin, function(req, rsp) { 
    rsp.render('write.ejs',{user: req.user})
  });

app.get('/list', function(req, rsp){
    db.collection('post').find().toArray(function(err, res){
        console.log(res);
        rsp.render('list.ejs', { posts: res } )
    });    
});  

app.post('/add', function(req, rsp){
    //counter 콜렉션에서 name: postNum 가 있는 document를 찾는다. 
    // totalPostNum 변수를 생성하여 응답.totalPost(전체 post 수)를 초기화한다.
    db.collection('counter').findOne({name: 'postNum'}, function(err, res){
        let totalPostNum = res.totalPost;
        db.collection('post').insertOne({_id: (totalPostNum+1), title: req.body.title, date: req.body.date, text: req.body.text}, function(){
            console.log('save completed');
            rsp.redirect('http://localhost:8000/list')
            //AutoIncreament 속성 $set : {바꿀 key: 바꿀 value} // $inc : {바꿀 key: 바꿀 value} 기존값에 증가값
            db.collection('counter').updateOne({name: 'postNum'},{ $inc : {totalPost: 1} },function(err, res){
                if(err) return console.log(err);
            })
        });
    });
});

app.delete('/delete', function(req, rsp){
    req.body._id = parseInt(req.body._id);
    //.deleteOne({쿼리}, )
    db.collection('post').deleteOne(req.body, function(err, res){
        console.log('삭제완료');
        rsp.status(200).send({message : 'success'});
    })
})

app.get('/read/:id', function(req, rsp){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, res){
        console.log(res);
    rsp.render('read.ejs',{ data : res});
    if(err) console.log(err);
    })
})
//수정버튼 클릭시
app.get('/edit/:id',function(req,rsp){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, res){
    rsp.render('edit.ejs', { post : res });
    if(err)console.log(err)
    })
})

app.put('/edit', function(req, rsp){
    //$set은 업데이트 혹은 널값이면 인서트.
    db.collection('post').updateOne({_id : parseInt(req.body.id) },
    { $set : { title : req.body.title, date : req.body.date, text : req.body.text } }, function(err, res){
        console.log('수정완료');
        rsp.redirect('/list')
    })
})

app.get('/signin', function(req, rsp){
    rsp.render('signin.ejs');
})

app.post('/signin', passport.authenticate('local', {failureRedirect: '/fail'})
    , function(req, rsp){
    rsp.redirect('/');
})

app.get('/signup', function(req, rsp){
    rsp.render('signup.ejs');
})

app.post('/signup', function(req, rsp){
    db.collection('member').insertOne({userId : req.body.userId, userPw: req.body.userPw, userName: req.body.userName, userEmail: req.body.email, userPhoneNum: req.body.userPhoneNum}, function(err, res){
        console.log('save completed');
    rsp.status(200).redirect('/signin')
    if(err)console.log(err)
    })
    

})
