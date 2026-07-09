#!/bin/bash

# ==============================================================================
# 데이터 파이프라인 자동화 스크립트
# 용도: crontab에 등록하여 주기적으로 데이터를 수집하고 결과를 기록합니다.
# ==============================================================================

# 프로젝트 디렉토리 설정
PROJECT_DIR="/home/opc/project"
LOG_FILE="$PROJECT_DIR/pipeline.log"

echo "========================================" >> $LOG_FILE
echo "🚀 파이프라인 실행 시작: $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

# 1. 파이썬 가상환경이 있다면 여기서 활성화 (현재는 기본 환경 사용)
cd $PROJECT_DIR

# 2. 데이터 수집 스크립트 실행
python3 data_collection.py >> $LOG_FILE 2>&1

# 실행 결과 체크
if [ $? -eq 0 ]; then
    echo "✅ 데이터 수집 및 CSV 적재 완료: $(date)" >> $LOG_FILE
else
    echo "❌ 파이프라인 실행 중 오류 발생: $(date)" >> $LOG_FILE
fi
echo "" >> $LOG_FILE
