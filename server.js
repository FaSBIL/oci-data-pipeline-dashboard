const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// 오라클 DB 접속 정보
const dbConfig = {
  user: "vm29",
  password: "oracle",
  connectString: "localhost:1521/xepdb1"
};

// 프론트엔드가 데이터를 요청할 주소(API 엔드포인트)
app.get('/api/data', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ DB 접속 성공, 데이터를 조회합니다...");

    const result = await connection.execute(
      `SELECT * FROM global_data`,
      [], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 20000 }
    );

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
