import ee
import pandas as pd
from datetime import datetime

# GEE 초기화
ee.Initialize()

# 고흥군 중심 좌표
goheung_lat = 34.6070
goheung_lon = 127.2875
point = ee.Geometry.Point([goheung_lon, goheung_lat])

# 날짜 설정
start_date = '2016-01-01'
end_date = '2025-01-01'

# Sentinel-2 NDVI 계산 함수
def calc_ndvi(image):
    ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
    return image.addBands(ndvi).select('NDVI').copyProperties(image, ['system:time_start'])

# Sentinel-2 이미지 컬렉션 필터링 및 NDVI 추가
collection = (
    ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
    .filterBounds(point)
    .filterDate(start_date, end_date)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(calc_ndvi)
)

# NDVI 시간별 값 추출
def extract_feature(image):
    stat = image.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=point,
        scale=10,
        maxPixels=1e9
    )
    date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd')
    return ee.Feature(None, {'date': date, 'NDVI': stat.get('NDVI')})

features = collection.map(extract_feature).getInfo()

# 결과 → DataFrame 변환
ndvi_data = []
for f in features['features']:
    props = f['properties']
    ndvi_data.append({
        'date': props['date'],
        'NDVI': props['NDVI']
    })

df = pd.DataFrame(ndvi_data)
df['date'] = pd.to_datetime(df['date'])

# 저장
df.to_csv('NDVI_Goheung.csv', index=False)
print("NDVI 데이터 저장 완료: NDVI_Goheung.csv")