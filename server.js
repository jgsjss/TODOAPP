const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const {redirect} = require('express/lib/response');
const rsp = require('express/lib/response');
const req = require('express/lib/request');
const methodOverride = require('method-override');
const postRouter = require('./routes/post.js');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const {Db} = require('mongodb');
const MongoClient = require('mongodb').MongoClient;



const bcrypt = require('bcrypt')
require('dotenv').config();
app.set('view engine', 'ejs');

let db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
    if (err) return console.log(err);
    db = client.db('Todo')
    //라우터로 분리한 코드에서 몽고db 기능을 사용하려면 app.db = db; 작성한다.
    app.db = db;

    app.listen(process.env.PORT, function () {
        console.log('listening on 8000');
    });
})



// app.use(express.static(path.join(__dirname, '../public')))

//최신 버전 express에 bodyParser 내장됨
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'))

app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));

app.use(passport.initialize());

app.use(passport.session());
//express 내장기능 json 사용
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')))

app.use('/post', postRouter);


//사용자pw를 암호화 하지 않았기에 보안이 쓰레기

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (inputId, inputPw, done) {
    console.log(inputId, inputPw);
    db.collection('member').findOne({userId: inputId}, function (err, res) {
        console.log(res.userPw)
        if (err) return done(err)
        //done((서버에러),(성공시 db데이터),(에러메세지))
        if (!res) return done(null, false, {message: 'ID가 틀렸거나 존재하지 않습니다.'})
        if (inputPw == res.userPw) {
            console.log('로그인 성공')
            return done(null, res)
        } else {
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
    db.collection('member').findOne({userId: id}, function (err, res) {
        done(null, res)
    })
});

//로그인체크 메소드
// function isLogin(req, rsp, next) {
//     if (req.user) {
//         next()
//     } else {
//         rsp.write("<head><meta charset='UTF-8'><script>alert('로그인 후 이용가능합니다.'); location.replace('http://localhost:8000/signin');</script></head>")
//     }
// }

app.get('/', function (req, rsp) {
    rsp.render('index.ejs');
})

app.get('/signin', function (req, rsp) {
    rsp.render('signin.ejs');
})

app.post('/signin', passport.authenticate('local', {failureRedirect: '/fail'})
    , function (req, rsp) {
        rsp.redirect('/');
    })

app.get('/signup', function (req, rsp) {
    rsp.render('signup.ejs');
})

app.post('/signup', async function (req, rsp) {
    db.collection('member').findOne({userId: req.body.userId}).then((res) => {
        if (res != null) {
            rsp.write("<head><meta charset='UTF-8'><script>alert('아이디가 사용중입니다.'); location.replace('http://localhost:8000/signup');</script></head>")
        } else {
            db.collection('member').insertOne({
                userId: req.body.userId,
                userPw: req.body.userPw,
                userName: req.body.userName,
                userEmail: req.body.email,
                userPhoneNum: req.body.userPhoneNum
            }, function (err, res) {
                console.log('signup completed');
                rsp.status(200).redirect('/signin')
                if (err) console.log(err)
            })
        }
    })


})


// app.get('/', function (req, rsp) {
//     rsp.render('index.ejs');
// })
//
// app.get('/write', isLogin, function (req, rsp) {
//     rsp.render('write.ejs', {user: req.user})
// });
//
// app.get('/list', isLogin, function (req, rsp) {
//     db.collection('post').find().toArray(function (err, res) {
//         console.log(res);
//         rsp.render('list.ejs', {posts: res})
//     });
// });
//
// app.post('/add', function (req, rsp) {
//     //counter 콜렉션에서 name: postNum 가 있는 document를 찾는다.
//     // totalPostNum 변수를 생성하여 응답.totalPost(전체 post 수)를 초기화한다.
//     //req.user 유저정보가 JSON 형식으로 저장되어있다.
//     console.log(req.user.userName)
//     db.collection('counter').findOne({name: 'postNum'}, function (err, res) {
//         let totalPostNum = res.totalPost;
//         let saveData = {
//             _id: (totalPostNum + 1),
//             writer: req.user.userId,
//             title: req.body.title,
//             date: req.body.date,
//             text: req.body.text
//         }
//
//         db.collection('post').insertOne(saveData, function () {
//             console.log('save completed');
//             rsp.redirect('http://localhost:8000/list')
//             //AutoIncreament 속성 $set : {바꿀 key: 바꿀 value} // $inc : {바꿀 key: 바꿀 value} 기존값에 증가값
//             db.collection('counter').updateOne({name: 'postNum'}, {$inc: {totalPost: 1}}, function (err, res) {
//                 if (err) return console.log(err);
//             })
//         });
//     });
// });
//
// app.delete('/delete',  function (req, rsp) {
//     req.body._id = parseInt(req.body._id);
//
//     let deleteData = {_id: req.body._id, writer: req.user.userId}
//
//     //.deleteOne({쿼리}, )
//     db.collection('post').deleteOne(deleteData,  function (err, res) {
//         if (res) {
//             rsp.status(200).send({message: 'success'});
//             console.log('삭제완료');
//         }else {
//             console.log(err)
//             rsp.status(401).send({message: 'failed'})
//         }
//     })
// })
//
// app.get('/read/:id', function (req, rsp) {
//     db.collection('post').findOne({_id: parseInt(req.params.id)}, function (err, res) {
//         if (res) {
//             console.log(res);
//             rsp.render('read.ejs', {data: res});
//         }
//         if (err) {
//             console.log(err);
//
//         }
//     })
// })
// //수정버튼 클릭시
// app.get('/edit/:id', function (req, rsp) {
//
//     let editData = {_id: parseInt(req.params.id), writer: req.user.userId}
//
//     db.collection('post').findOne(editData, function (err, res) {
//         if (!err) {
//             rsp.status(200).render('edit.ejs', {post: res});
//         } else {
//             console.log(err)
//             rsp.status(401).write("<head><meta charset='UTF-8'><script>alert('작성자만 수정 가능합니다.'); location.replace(`http://localhost:8000/list}`)</script> </head>")
//         }
//     })
// })
//
// app.put('/edit', function (req, rsp) {
//     //$set은 업데이트 혹은 널값이면 인서트.
//     db.collection('post').updateOne({_id: parseInt(req.body.id)},
//         {$set: {title: req.body.title, date: req.body.date, text: req.body.text}}, function (err, res) {
//             console.log('수정완료');
//             rsp.redirect('/list')
//         })
// })


//해결책 1. 검색할 문서의 양을 제한을 둡니다.
// DB에다가 검색요청을 날릴 때 특정 날짜에서만 검색하라고 요구할 수도 있고
// skip(), limit() 이런 함수를 이용하시면 pagination 기능을 개발할 수 있습니다.
// 그니까 맨 처음 검색할 땐 맨앞에 20개만 찾아줘~
// 그 다음엔 다음 20개를 찾아줘~
// 이렇게 요구할 수 있다는 겁니다. 대부분의 게시판들은 이런 방법을 이용합니다.

// 해결책 2. text search 기능을 굳이 쓰고 싶으면
// MongoDB를 님들이 직접 설치하셔야합니다.
// 그리고 indexing할 때 띄어쓰기 단위로 글자들을 indexing하지말고
// 다른 알고리즘을 써라~ 라고 셋팅할 수 있습니다.
// nGram 이런 알고리즘을 쓰면 된다고 하는데 이걸 언제하고 있습니까 패스합시다

// 해결책 3. Search index를 사용합니다.
// MongoDB Atlas에서만 제공하는 기능인데
// 클러스터 들어가보시면 아마 Search 어쩌구라는 메뉴가 있을겁니다. 그거 누르시면 됩니다.
app.get('/search', (req, rsp) => {
    let keyword = [
        {
            $search: {
                index: 'titlesearch',
                text: {
                    query: req.query.value,
                    path: 'title',
                }
            }
        },
        //{$sort : { _id : 1} }} 아이디 오름차순정렬, -1은 내림차순
        {$sort: {_id: 1}},
        //        { $limit : 10 }  검색게시글 10개로 제한
        {$limit: 10},
        //         { $project : { title : 1, _id : 0}}  원하는 항목만 보여줌, 0은 nonedisplay
        // {$project: {title: 1, _id: 0}}
    ]
    console.log("검색키워드", req.query)
    db.collection('post').aggregate(keyword).toArray((err, res) => {
        console.log("검색결과 : ", res)
        rsp.render('search.ejs', {posts: res});
    })
})

