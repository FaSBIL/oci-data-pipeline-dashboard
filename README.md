🌍 OCI 기반 글로벌 통계 데이터 파이프라인 구축피지컬AI 부트캠프 중간평가 과제 > 프로젝트명: 글로벌 출산율 및 경제성장률 상관관계 분석 대시보드1. 서비스 소개 및 사용 시나리오본 프로젝트는 "국가의 경제 성장(GDP)과 출산율 하락 간의 상관관계가 전 세계적인 보편적 현상인가?"라는 가설을 검증하기 위해 기획되었습니다. World Bank의 공공 데이터를 수집하여 클라우드 환경에서 가공 및 적재하고, 실시간 선형회귀 분석이 가능한 대시보드를 제공합니다.사용 시나리오:글로벌 트렌드 파악: 사용자는 '타임랩스' 버튼을 클릭하여 1980년대부터 2020년까지 전 세계 국가들이 고성장/저출산 등 4가지 클러스터로 어떻게 이동하는지 시각적으로 확인합니다.국가별 심층 분석: 드롭다운에서 특정 국가(예: Korea, Rep.)를 선택하면 과거부터 현재까지의 추세를 확인하고, 시스템이 자동으로 계산한 상관계수(R, R²) 기반의 AI 인사이트 리포트를 읽어볼 수 있습니다.2. 아키텍처 설명 및 OCI 리소스본 프로젝트는 Oracle Cloud Infrastructure(OCI)를 기반으로 데이터 수집부터 서비스 제공까지의 전체 파이프라인을 구축했습니다.🛠 사용된 OCI 리소스Compute (Linux VM): 데이터 수집(Python), 백엔드 서버(Node.js), 프론트엔드 웹 서버 가동Block Volume: 리눅스 OS 구동 및 수집된 원시 데이터(CSV) 로컬 저장Database (Oracle XE): VM 내부에 구축된 Oracle DB 플러거블 데이터베이스(XEPDB1) 사용Network (VCN): Security List를 통해 백엔드(3000) 및 프론트엔드(8080) 포트 개방📊 파이프라인 아키텍처 (Workflow)graph TD
    A[World Bank Open API] -->|Python requests| B(Linux Block Volume : CSV)
    B -->|Oracle External Table| C[(Oracle Database XE)]
    C -->|SQL Select| D[Node.js Express API]
    D -->|JSON| E[HTML/JS Frontend]
    E -->|Chart.js & 통계 분석| F((사용자 웹 브라우저))

(참고: GitHub 마크다운에서 위 코드는 다이어그램으로 자동 렌더링됩니다. 과제 제출 시에는 기획서에 있던 이미지 캡처본을 함께 첨부하시기 바랍니다.)3. 데이터 흐름 상세 설명수집 (Collect): Python 스크립트(data_collection.py)를 통해 World Bank REST API를 호출하여 '합계출산율'과 'GDP 성장률' 원시 데이터를 수집합니다.저장 (Store): 수집된 JSON 응답을 Pandas를 이용해 병합 후 CSV 형태로 OCI VM의 Block Volume(/home/oracle/project)에 저장합니다.가공 (Process): * (DB 단) Oracle DB의 External Table을 생성하여 CSV를 읽어 들이고, 데이터 유실(쉼표 섞임 문제 등)을 방지하는 정제 과정을 거쳐 영구 테이블(global_data)로 적재(INSERT)합니다.(웹 단) Node.js 서버에서 쿼리한 데이터를 프론트엔드(JS)로 전달하고, 자바스크립트가 피어슨 상관계수 및 선형회귀 방정식을 동적으로 계산합니다.제공 (Serve): Node.js 백엔드 서버가 3000번 포트로 REST API를 제공하며, Chart.js와 Tailwind CSS로 구성된 프론트엔드(8080 포트)가 사용자에게 시각적 인사이트를 제공합니다.4. 설치 및 실행 방법Step 1: 데이터 수집# 필수 라이브러리 설치 및 파이썬 수집 스크립트 실행
pip3 install requests pandas
python3 data_collection.py

Step 2: 오라클 DB 적재-- 관리자(sysdba) 접속 후 디렉토리 생성 및 권한 부여
create or replace directory proj_dir as '/home/oracle/project';
grant read, write on directory proj_dir to [사용자계정];

-- 외부 테이블 생성 (CSV 연동) 및 영구 테이블 적재
create table global_data as select * from global_data_ext;

Step 3: 백엔드 서버 실행# Node 패키지 설치 및 서버 구동 (3000번 포트)
npm install express oracledb cors
node server.js

Step 4: 프론트엔드 웹 뷰어 실행# 새로운 터미널 세션에서 웹 서버 구동 (8080번 포트)
python3 -m http.server 8080
# 브라우저 접속: http://[OCI_VM_공인IP]:8080

5. 한계점 및 향후 개선 방향한계점 1 (자동화 부재): 현재 데이터 수집 스크립트는 수동으로 실행해야 합니다. World Bank 데이터 갱신 주기에 맞춰 Linux cron 스케줄러를 적용하여 연 1회 자동 수집되도록 개선할 필요가 있습니다.한계점 2 (Object Storage 미사용): 초기 기획과 달리 로컬 Block Volume에만 원본 데이터를 저장했습니다. 향후 OCI Object Storage API를 연동하여 안전한 클라우드 데이터 레이크(Data Lake)를 구축할 예정입니다.개선 방향: 현재 로컬 환경의 Oracle XE를 사용 중이나, 향후 확장성과 관리 편의성을 위해 OCI Autonomous Database(ADB)로 마이그레이션하여 완전 관리형 클라우드 데이터베이스를 경험해 보고자 합니다.
