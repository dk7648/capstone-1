import pandas as pd
import numpy as np
from pykalman import KalmanFilter
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib.pyplot as plt

# -----------------------------------
# 0. 데이터 오류 검출 함수
# -----------------------------------
def detect_data_errors(df):
    errs = []
    # 결측치
    if df.isnull().any().any():
        errs.append("결측치 발견")
    # 온도 범위
    if (df['평균기온(℃)'] < -30).any() or (df['평균기온(℃)'] > 50).any():
        errs.append("이상 기온값 발견")
    # 습도 범위
    if (df['평균습도(%rh)'] < 0).any() or (df['평균습도(%rh)'] > 100).any():
        errs.append("이상 습도값 발견")
    # 강수량 음수
    if (df['강수량(mm)'] < 0).any():
        errs.append("음수 강수량 발견")
    return errs

# 데이터 로드 및 전처리
df = pd.read_excel("C:\\Users\\KUCIS02\\Desktop\\data.xlsx", engine='openpyxl')
df['일시'] = pd.to_datetime(df['일시'])
df = df.drop(columns=['1시간최다강수량시각','최고기온시각','최저기온시각'])
df = df.dropna()

# 오류 있으면 중단
errors = detect_data_errors(df)
if errors:
    raise ValueError("데이터 오류: " + "; ".join(errors))

# 5~10월, 연도별 최대 생산량
df = df[df['일시'].dt.month.between(5,10)]
df['연도'] = df['일시'].dt.year
df['생산량'] = df.groupby('연도')['생산량'].transform('max')

yearly = df.groupby('연도').agg({
    '평균기온(℃)':'mean',
    '평균습도(%rh)':'mean',
    '강수량(mm)':'mean',
    '생산량':'mean'
}).reset_index()

# 학습/테스트 분리
train = yearly[:-1]
test  = yearly[-1:]
prev  = yearly[-2:-1]

X_tr = train[['평균기온(℃)','평균습도(%rh)','강수량(mm)']].values
y_tr = train['생산량'].values
X_te = test[['평균기온(℃)','평균습도(%rh)','강수량(mm)']].values
y_prev = prev['생산량'].iloc[0]

# 표준화
scaler = StandardScaler()
X_tr_s = scaler.fit_transform(X_tr)
X_te_s = scaler.transform(X_te)

# 선형 회귀 모델 (기준 예측)
reg = LinearRegression().fit(X_tr_s, y_tr)
reg_pred_te = reg.predict(X_te_s)[0]

# -----------------------------------
# SSM(Kalman) 설정
#  - 상태 1차원: 생산량
#  - transition_matrices = 0
#  - observation_matrices = 1
#  - transition_offset: intercept + coef·X_t
# -----------------------------------
kf = KalmanFilter(
    transition_matrices    = np.array([[0.]]),
    observation_matrices   = np.array([[1.]]),
    transition_covariance  = np.eye(1)*0.5,
    observation_covariance = np.array([[np.var(y_tr)]]),
    initial_state_mean     = np.array([y_tr[0]]),
    initial_state_covariance = np.eye(1)
)
# EM 최적화
kf = kf.em(y_tr.reshape(-1,1), n_iter=10)

# 칼만 필터링 (학습)
state_mean, state_cov = kf.initial_state_mean, kf.initial_state_covariance
kf_preds = []
for i in range(len(X_tr_s)):
    trans_off = reg.intercept_ + reg.coef_.dot(X_tr_s[i])
    state_mean, state_cov = kf.filter_update(
        filtered_state_mean      = state_mean,
        filtered_state_covariance= state_cov,
        transition_offset        = trans_off,
        observation              = y_tr[i]
    )
    kf_preds.append(state_mean[0])
kf_preds = np.array(kf_preds)

# LOOCV (간단 상대오차)
cv_errs = []
for idx in range(len(X_tr_s)):
    mask = np.arange(len(X_tr_s)) != idx
    reg_cv = LinearRegression().fit(X_tr_s[mask], y_tr[mask])
    pred = reg_cv.predict(X_tr_s[~mask])[0]
    cv_errs.append(abs(pred - y_tr[~mask][0]) / y_tr[~mask][0] * 100)
cv_err = np.mean(cv_errs)

# 테스트 예측 (칼만)
trans_off_te = reg.intercept_ + reg.coef_.dot(X_te_s[0])
pred_state, _ = kf.filter_update(
    filtered_state_mean      = state_mean,
    filtered_state_covariance= state_cov,
    transition_offset        = trans_off_te,
    observation              = None
)
kf_pred_te = pred_state[0]

# 변화율 계산 & 이상치 감지
change_kf  = (kf_pred_te - y_prev) / y_prev * 100
change_reg = (reg_pred_te - y_prev) / y_prev * 100

# 이례적 변화율 (>±50%) 경고, 회귀 예측으로 폴백
if abs(change_kf) > 50:
    print("⚠️ 칼만 예측 변화율이 비정상적입니다. 회귀 예측으로 대체합니다.")
    kf_pred_te = reg_pred_te
    change_kf  = change_reg


# 결과 출력
print(f"회귀 예측: {reg_pred_te:.2f} kg/ha  (전년 대비 {change_reg:+.2f}%)")
print(f"칼만 예측: {kf_pred_te:.2f} kg/ha  (전년 대비 {change_kf:+.2f}%)\n")

print("=== 학습 성능 (Kalman) ===")
print(f"MAE: {mean_absolute_error(y_tr, kf_preds):.2f}")
print(f"R² : {r2_score(y_tr, kf_preds):.2f}")
print(f"LOOCV 평균 상대오차: {cv_err:.2f}%")

# 잔차 이상치 연도 탐지
res = y_tr - kf_preds
anoms = train['연도'][np.abs(res) > 0.1*y_tr]
if not anoms.empty:
    print("\n⚠️ 이상치 연도 (오차>10%):", list(anoms.values))

# 시각화
plt.figure(figsize=(8,4))
plt.plot(train['연도'], y_tr,   '-o', label='Actual')
plt.plot(train['연도'], kf_preds,'-x', label='Kalman Pred')
plt.scatter(test['연도'], kf_pred_te, color='red', label='Test Pred')
plt.title("연도별 쌀 생산량 예측 비교")
plt.xlabel("연도"); plt.ylabel("생산량 (kg/ha)")
plt.axvline(test['연도'].iloc[0], color='gray', linestyle='--')
plt.legend(); plt.grid(True)
plt.show()
