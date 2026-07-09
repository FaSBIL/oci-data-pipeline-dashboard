🌍 OCI 기반 글로벌 통계 데이터 파이프라인 구축
[GitHub Repository Link](https://github.com/FaSBIL/oci-data-pipeline-dashboard)

피지컬AI 부트캠프 최종평가 과제 > 프로젝트명: 글로벌 출산율 및 경제성장률 상관관계 분석 대시보드

1. 서비스 소개 및 사용 시나리오

본 프로젝트는 "국가의 경제 성장(GDP)과 출산율 하락 간의 상관관계가 전 세계적인 보편적 현상인가?"라는 가설을 검증하기 위해 기획되었습니다. World Bank의 공공 데이터를 수집하여 클라우드 환경에서 가공 및 적재하고, 실시간 선형회귀 분석이 가능한 대시보드를 제공합니다.

사용 시나리오:

글로벌 트렌드 파악: 사용자는 '타임랩스' 버튼을 클릭하여 1980년대부터 2020년까지 전 세계 국가들이 고성장/저출산 등 4가지 클러스터로 어떻게 이동하는지 시각적으로 확인합니다.

국가별 심층 분석: 드롭다운에서 특정 국가(예: Korea, Rep.)를 선택하면 과거부터 현재까지의 추세를 확인하고, 시스템이 자동으로 계산한 상관계수(R, R²) 기반의 AI 인사이트 리포트를 읽어볼 수 있습니다.

2. 아키텍처 설명 및 OCI 리소스

본 프로젝트는 Oracle Cloud Infrastructure(OCI)를 기반으로 데이터 수집부터 서비스 제공까지의 전체 파이프라인을 구축했습니다.

🛠 사용된 OCI 리소스

Compute (Linux VM): 데이터 자동 수집(Python+Cron), 백엔드 서버(Node.js), 프론트엔드 웹 서버 가동

Block Volume: 리눅스 OS 구동 및 수집된 원시 데이터(CSV) 로컬 저장 및 보존

Database (Oracle XE): VM 내부에 구축된 Oracle DB 플러거블 데이터베이스(XEPDB1) 사용

Network (VCN): Security List를 통해 백엔드(3000) 및 프론트엔드(8080) 포트 개방

📊 파이프라인 아키텍처 (Workflow)

graph TD
    A[World Bank Open API] -->|Python requests / 예외처리| B(Linux Block Volume : CSV)
    B -->|Oracle External Table| C[(Oracle Database XE)]
    C -->|SQL Select| D[Node.js Express API]
    D -->|JSON| E[HTML/JS Frontend]
    E -->|Chart.js & 실시간 통계 분석| F((사용자 웹 브라우저))
    
    subgraph "Automation (Linux Cron)"
    B -.->|주기적 스케줄링 실행| A
    end


3. 데이터 흐름 상세 설명

수집 (Collect): Python 스크립트(data_collection.py)를 통해 World Bank API를 호출합니다. Try-Except 구문을 통해 네트워크 지연 및 API 오류에 대한 예외 처리를 구현하여 안정성을 확보했습니다.

저장 (Store): Pandas를 이용해 데이터를 병합하고, OCI VM의 Block Volume(/home/opc/project/)에 CSV 형태로 저장합니다.

가공 (Process): * (스케줄링/자동화) 리눅스 cron을 활용하여 매주 데이터 수집 파이프라인(run_pipeline.sh)이 자동으로 동작하도록 자동화 로직을 구현했습니다.

(DB/웹) Oracle DB External Table을 통해 쉼표 섞임 등의 데이터를 정제하고 영구 적재합니다. Node.js가 제공한 데이터를 받아 자바스크립트가 피어슨 상관계수 및 선형회귀를 동적으로 가공합니다.

제공 (Serve): Node.js 서버(3000포트) 기반 REST API와 Chart.js+Tailwind CSS 프론트엔드(8080포트)를 통해 대시보드 형태로 사용자에게 인사이트를 제공합니다.

4. 설치 및 실행 방법

Step 1: 자동화된 데이터 수집 (Cron 설정)

# 필수 라이브러리 설치
pip3 install requests pandas

# 쉘 스크립트 실행 권한 부여
chmod +x run_pipeline.sh

# Cron 스케줄러 등록 (매주 월요일 새벽 2시 자동 수집)
crontab -e
# 아래 내용 추가: 0 2 * * 1 /home/opc/project/run_pipeline.sh >> /home/opc/project/pipeline.log 2>&1


Step 2: 오라클 DB 적재

-- 관리자(sysdba) 접속 후 디렉토리 생성 및 권한 부여
create or replace directory proj_dir as '/home/opc/project';
grant read, write on directory proj_dir to [사용자계정];

-- 외부 테이블 생성 (CSV 연동) 및 영구 테이블 적재
create table global_data as select * from global_data_ext;


Step 3: 백엔드 서버 실행

# Node 패키지 설치 및 서버 구동 (3000번 포트)
npm install express oracledb cors
node server.js


Step 4: 프론트엔드 웹 뷰어 실행

# 새로운 터미널 세션에서 웹 서버 구동 (8080번 포트)
python3 -m http.server 8080
# 브라우저 접속: http://[OCI_VM_공인IP]:8080


5. 한계점 및 향후 개선 방향

한계점 (Object Storage 미사용): 초기 기획과 달리 로컬 Block Volume에만 원본 데이터를 저장했습니다. 이는 단일 장애점(SPOF)이 될 수 있습니다.

향후 개선 방향 (클라우드 네이티브 고도화): 1. 수집된 CSV 파일을 로컬뿐만 아니라 OCI Object Storage API를 연동하여 업로드함으로써 안전한 클라우드 데이터 레이크(Data Lake)를 구축할 예정입니다.
2. 현재 로컬 환경의 Oracle XE를 사용 중이나, 향후 확장성과 관리 편의성을 위해 OCI Autonomous Database(ADB)로 마이그레이션하여 완전 관리형 클라우드 데이터베이스를 경험해 보고자 합니다.

### 💡 파이프라인 운영 팁 (Troubleshooting)
- **로그 확인:** 데이터가 제대로 수집되었는지 확인하려면 `cat /home/opc/project/pipeline.log` 명령어를 사용하세요.
- **DB 연동 에러:** 오라클 External Table 사용 시 CSV 파일의 인코딩이 UTF-8인지, 데이터 구분자(쉼표) 처리가 정확한지 확인하시기 바랍니다.
- **자동화 확인:** `crontab -l` 명령으로 스케줄이 정상 등록되어 있는지 언제든 확인할 수 있습니다.

※ 실제 운영 환경에서는 DB 계정과 비밀번호를 코드에 직접 작성하지 않고 환경변수(.env)로 관리해야 합니다.