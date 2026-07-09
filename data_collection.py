import requests
import pandas as pd

# 1. World Bank API 설정 (지표 코드)
# SP.DYN.TFRT.IN : 합계출산율 (Fertility rate, total)
# NY.GDP.MKTP.KD.ZG : GDP 성장률 (GDP growth (annual %))
FERTILITY_INDICATOR = "SP.DYN.TFRT.IN"
GDP_GROWTH_INDICATOR = "NY.GDP.MKTP.KD.ZG"

def fetch_world_bank_data(indicator_code, column_name):
    print(f"🌍 [{column_name}] 데이터 수집 시작...")
    
    # API 요청 URL (per_page=20000으로 설정해 한 번에 많은 데이터를 가져옵니다)
    url = f"http://api.worldbank.org/v2/country/all/indicator/{indicator_code}?format=json&per_page=20000"
    
    response = requests.get(url)
    
    # 응답이 정상(200)인지 확인
    if response.status_code != 200:
        print("❌ API 호출 실패!")
        return None
        
    data_json = response.json()
    
    # World Bank API는 인덱스 1번에 실제 데이터 배열을 담아서 줍니다.
    records = data_json[1] 
    
    # 필요한 항목만 뽑아서 리스트로 만들기
    data_list = []
    for item in records:
        # 데이터 값이 없는(null) 경우는 제외
        if item['value'] is not None:
            data_list.append({
                'Country': item['country']['value'],
                'CountryCode': item['countryiso3code'],
                'Year': int(item['date']),
                column_name: float(item['value'])
            })
            
    # Pandas 데이터프레임으로 변환
    df = pd.DataFrame(data_list)
    print(f"✅ [{column_name}] 데이터 수집 완료! (총 {len(df)}건)")
    return df

# ==========================================
# 메인 실행 로직
# ==========================================
if __name__ == "__main__":
    # 2. 각각의 API를 호출하여 데이터프레임 생성
    df_fertility = fetch_world_bank_data(FERTILITY_INDICATOR, "Fertility_Rate")
    df_gdp = fetch_world_bank_data(GDP_GROWTH_INDICATOR, "GDP_Growth")

    # 3. 데이터 병합 (Merge)
    # 국가코드(CountryCode)와 연도(Year)를 기준으로 두 데이터를 합칩니다.
    print("🔄 데이터 병합(Merge) 진행 중...")
    
    # inner 병합을 통해 두 데이터가 모두 존재하는 연도/국가만 남깁니다.
    merged_df = pd.merge(df_fertility, df_gdp, on=['Country', 'CountryCode', 'Year'], how='inner')
    
    # 4. 간단한 전처리 (빈 국가코드 제거 - 대륙/지역 묶음 데이터 필터링)
    merged_df = merged_df[merged_df['CountryCode'] != ""]
    
    # 연도순, 국가순으로 정렬
    merged_df = merged_df.sort_values(by=['Country', 'Year']).reset_index(drop=True)
    
    # 5. 결과 확인 및 저장
    print("\n📊 병합된 최종 데이터 미리보기:")
    print(merged_df.head(10))
    print(f"\n최종 데이터 크기: {merged_df.shape}")
    
    # CSV 파일로 저장 (내일 오라클 클라우드로 넘길 파일입니다!)
    csv_filename = "global_fertility_gdp.csv"
    merged_df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
    print(f"\n💾 성공적으로 '{csv_filename}' 파일이 생성되었습니다!")
