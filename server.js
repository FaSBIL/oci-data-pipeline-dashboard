const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
const port = 3000;

// CORS 설정 (나중에 프론트엔드 화면에서 데이터를 달라고 할 때 차단당하지 않도록 허용)
app.use(cors());

// 오라클 DB 접속 정보 (질문자님 환경에 맞춘 세팅입니다)
const dbConfig = {
  user: "vm29",
  password: "oracle",
  connectString: "localhost:1521/xepdb1"
};

// 프론트엔드가 데이터를 요청할 주소(API 엔드포인트) 만들기
app.get('/api/data', async (req, res) => {
  let connection;
  try {
    // 1. 오라클 DB에 로그인
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ DB 접속 성공, 데이터를 조회합니다...");

    // 2. SQL 쿼리로 global_data 테이블의 모든 데이터 가져오기
    // 넉넉하게 2만 건까지 한 번에 뽑아오도록 maxRows 설정
    const result = await connection.execute(
      `SELECT * FROM global_data`,
      [], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 20000 }
    );

    // 3. 쨘! 가져온 데이터를 JSON 형태로 포장해서 웹으로 쏴주기
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    console.log(`📦 ${result.rows.length}건의 데이터를 성공적으로 보냈습니다!`);

  } catch (err) {
    console.error("❌ 에러 발생:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    // 4. 작업이 끝나면 DB 문 닫기(필수!)
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// 서버 켜기
app.listen(port, () => {
  console.log(`=========================================`);
  console.log(`🚀 Node.js 백엔드 서버가 가동되었습니다!`);
  console.log(`📡 접속 주소: http://localhost:${port}`);
  console.log(`=========================================`);
});

