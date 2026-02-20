import ApexCharts from "apexcharts";
import type { ApexOptions } from "apexcharts";
import "./style.css";

type MatlabAnalysisResult = {
  timestamp: string[];
  vibrationRms: number[];
  vibrationSpectrum: { frequencyBand: string; amplitude: number }[];
  anomalyProbability: { zone: string; probability: number }[];
  qualityBreakdown: { category: string; ratio: number }[];
  modelScore: { metric: string; value: number; target: number }[];
};

// MATLAB 스크립트가 생성했다고 가정한 결과(JSON 변환본)
const matlabResult: MatlabAnalysisResult = {
  timestamp: [
    "09:00",
    "09:10",
    "09:20",
    "09:30",
    "09:40",
    "09:50",
    "10:00",
    "10:10",
    "10:20",
    "10:30",
    "10:40",
    "10:50",
  ],
  vibrationRms: [1.8, 2.1, 2.4, 2.6, 2.9, 3.2, 3.5, 3.3, 3.1, 2.8, 2.6, 2.5],
  vibrationSpectrum: [
    { frequencyBand: "0~100Hz", amplitude: 0.7 },
    { frequencyBand: "100~200Hz", amplitude: 1.2 },
    { frequencyBand: "200~300Hz", amplitude: 1.9 },
    { frequencyBand: "300~400Hz", amplitude: 1.4 },
    { frequencyBand: "400~500Hz", amplitude: 0.9 },
  ],
  anomalyProbability: [
    { zone: "프레스", probability: 14 },
    { zone: "용접", probability: 37 },
    { zone: "도장", probability: 26 },
    { zone: "조립", probability: 18 },
    { zone: "검사", probability: 9 },
  ],
  qualityBreakdown: [
    { category: "정상", ratio: 78 },
    { category: "재작업", ratio: 12 },
    { category: "폐기", ratio: 10 },
  ],
  modelScore: [
    { metric: "F1", value: 0.91, target: 0.9 },
    { metric: "Precision", value: 0.94, target: 0.9 },
    { metric: "Recall", value: 0.88, target: 0.9 },
    { metric: "AUC", value: 0.96, target: 0.92 },
  ],
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app element not found");

app.innerHTML = `
  <main class="page">
    <header class="hero">
      <h1>MATLAB + ApexCharts 분석 대시보드</h1>
      <p>
        MATLAB에서 신호 처리/이상 탐지 모델을 실행해 JSON으로 전달된 결과를 프론트엔드에서 시각화한 예시입니다.
      </p>
    </header>

    <section class="kpi-grid">
      <article class="kpi-card">
        <span>최근 RMS</span>
        <strong>${matlabResult.vibrationRms.at(-1)} g</strong>
      </article>
      <article class="kpi-card">
        <span>최대 이상 확률</span>
        <strong>${Math.max(...matlabResult.anomalyProbability.map((x) => x.probability))}%</strong>
      </article>
      <article class="kpi-card">
        <span>정상품 비중</span>
        <strong>${matlabResult.qualityBreakdown[0].ratio}%</strong>
      </article>
      <article class="kpi-card">
        <span>모델 평균 점수</span>
        <strong>${(
          matlabResult.modelScore.reduce((sum, item) => sum + item.value, 0) /
          matlabResult.modelScore.length
        ).toFixed(2)}</strong>
      </article>
    </section>

    <section class="chart-grid">
      <article class="chart-card"><h2>진동 RMS 추세</h2><div id="rmsChart"></div></article>
      <article class="chart-card"><h2>주파수 대역 스펙트럼</h2><div id="spectrumChart"></div></article>
      <article class="chart-card"><h2>공정별 이상 확률</h2><div id="anomalyChart"></div></article>
      <article class="chart-card"><h2>품질 분류 비율</h2><div id="qualityChart"></div></article>
      <article class="chart-card full"><h2>모델 성능 vs 목표치</h2><div id="modelChart"></div></article>
    </section>
  </main>
`;

const sharedChart: ApexOptions = {
  chart: {
    toolbar: { show: false },
    fontFamily: "Pretendard, system-ui, sans-serif",
  },
  theme: {
    palette: "palette2",
  },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth" },
};

const render = (selector: string, options: ApexOptions) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`${selector} element not found`);
  new ApexCharts(el, options).render();
};

render("#rmsChart", {
  ...sharedChart,
  chart: { ...sharedChart.chart, type: "line", height: 280 },
  series: [{ name: "RMS(g)", data: matlabResult.vibrationRms }],
  xaxis: { categories: matlabResult.timestamp },
  yaxis: { title: { text: "RMS(g)" } },
});

render("#spectrumChart", {
  ...sharedChart,
  chart: { ...sharedChart.chart, type: "bar", height: 280 },
  plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
  series: [{ name: "진폭", data: matlabResult.vibrationSpectrum.map((x) => x.amplitude) }],
  xaxis: { categories: matlabResult.vibrationSpectrum.map((x) => x.frequencyBand) },
});

render("#anomalyChart", {
  ...sharedChart,
  chart: { ...sharedChart.chart, type: "radar", height: 280 },
  series: [{ name: "이상 확률(%)", data: matlabResult.anomalyProbability.map((x) => x.probability) }],
  xaxis: { categories: matlabResult.anomalyProbability.map((x) => x.zone) },
  yaxis: { max: 40 },
});

render("#qualityChart", {
  ...sharedChart,
  chart: { ...sharedChart.chart, type: "donut", height: 280 },
  labels: matlabResult.qualityBreakdown.map((x) => x.category),
  series: matlabResult.qualityBreakdown.map((x) => x.ratio),
  legend: { position: "bottom" },
});

render("#modelChart", {
  ...sharedChart,
  chart: { ...sharedChart.chart, type: "line", height: 320 },
  stroke: { width: [0, 3], curve: "straight" },
  series: [
    {
      name: "실측",
      type: "column",
      data: matlabResult.modelScore.map((x) => Number(x.value.toFixed(2))),
    },
    {
      name: "목표",
      type: "line",
      data: matlabResult.modelScore.map((x) => Number(x.target.toFixed(2))),
    },
  ],
  xaxis: { categories: matlabResult.modelScore.map((x) => x.metric) },
  yaxis: { min: 0.7, max: 1 },
});
