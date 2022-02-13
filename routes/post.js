const router = require('express').Router();




 // 로그인체크 메소드
 function isLogin(req, rsp, next) {
     if (req.user) {
         next()
     } else {
         rsp.write("<head><meta charset='UTF-8'><script>alert('로그인 후 이용가능합니다.'); location.replace('http:localhost:8000/signin');</script></head>")
     }
 }


 router.use(isLogin);



 router.get('/write', function (req, rsp) {
     rsp.render('write.ejs', {user: req.user})
 });

 router.get('/list', function (req, rsp) {
     req.app.db.collection('post').find().toArray(function (err, res) {
         console.log(res);
         rsp.render('list.ejs', {posts: res})
     });
 });

 router.post('/add', function (req, rsp) {
     // counter 콜렉션에서 name: postNum 가 있는 document를 찾는다.
     //  totalPostNum 변수를 생성하여 응답.totalPost(전체 post 수)를 초기화한다.
     // req.user 유저정보가 JSON 형식으로 저장되어있다.
     console.log(req.user.userName)
     req.app.db.collection('counter').findOne({name: 'postNum'}, function (err, res) {
         let totalPostNum = res.totalPost;
         let saveData = {
             _id: (totalPostNum + 1),
             writer: req.user.userId,
             title: req.body.title,
             date: req.body.date,
             text: req.body.text
         }

         req.app.db.collection('post').insertOne(saveData, function () {
             console.log('save completed');
             rsp.redirect('http:localhost:8000/list')
             // AutoIncreament 속성 $set : {바꿀 key: 바꿀 value}  $inc : {바꿀 key: 바꿀 value} 기존값에 증가값
             db.collection('counter').updateOne({name: 'postNum'}, {$inc: {totalPost: 1}}, function (err, res) {
                 if (err) return console.log(err);
             })
         });
     });
 });

 router.delete('/delete',  function (req, rsp) {
     req.body._id = parseInt(req.body._id);

     let deleteData = {_id: req.body._id, writer: req.user.userId}

     .deleteOne({쿼리}, )
     req.app.db.collection('post').deleteOne(deleteData,  function (err, res) {
         if (res) {
             rsp.status(200).send({message: 'success'});
             console.log('삭제완료');
         }else {
             console.log(err)
             rsp.status(401).send({message: 'failed'})
         }
     })
 })

 router.get('/read/:id', function (req, rsp) {
     req.app.db.collection('post').findOne({_id: parseInt(req.params.id)}, function (err, res) {
         if (res) {
             console.log(res);
             rsp.render('read.ejs', {data: res});
         }
         if (err) {
             console.log(err);

         }
     })
 })
 // 수정버튼 클릭시
 router.get('/edit/:id', function (req, rsp) {

     let editData = {_id: parseInt(req.params.id), writer: req.user.userId}

     req.app.db.collection('post').findOne(editData, function (err, res) {
         if (!err) {
             rsp.status(200).render('edit.ejs', {post: res});
         } else {
             console.log(err)
             rsp.status(401).write("<head><meta charset='UTF-8'><script>alert('작성자만 수정 가능합니다.'); location.replace(`http:localhost:8000/list}`)</script> </head>")
         }
     })
 })

 router.put('/edit', function (req, rsp) {
     // $set은 업데이트 혹은 널값이면 인서트.
     req.app.db.collection('post').updateOne({_id: parseInt(req.body.id)},
         {$set: {title: req.body.title, date: req.body.date, text: req.body.text}}, function (err, res) {
             console.log('수정완료');
             rsp.redirect('/list')
         })
 })


 module.exports = router;