const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const { redirect } = require('express/lib/response');
const res = require('express/lib/response');

app.set('view engine', 'ejs');

let db;
MongoClient.connect('mongodb+srv://admin:1234@cluster0.lkny9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(err, client){
    if(err) return console.log(err);

    db = client.db('Todo')

    app.listen(8000, function(){
        console.log('listening on 8000');
    });
})

app.use(bodyParser.urlencoded({extended: true}));

//__dirname + '/html파일' 하면 해당 경로 겟 요청시 html파일을 로드한다.
app.get('/',function(req, rsp){
    rsp.sendFile(__dirname + '/index.html');
})

app.get('/write', function(req, rsp) { 
    rsp.sendFile(__dirname +'/write.html')
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
        db.collection('post').insertOne({_id: (totalPostNum+1), title: req.body.title, date: req.body.date}, function(){
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
        rsp.status(200);
    })
})