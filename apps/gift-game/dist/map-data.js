export const MAP_VIEWS = Object.freeze({
  all: { label: '全图', subtitle: '中国与周边 · 日本也在这里', bounds: [69, 5, 148, 55], image: './assets/atlas-all.svg' },
  jiangsu: { label: '江苏', subtitle: '华东', bounds: [114.4, 31.3, 122.7, 36.2], image: './assets/atlas-jiangsu.svg' },
  hunan: { label: '湖南', subtitle: '华中', bounds: [106.45, 24.3, 117.05, 31], image: './assets/atlas-hunan.svg' },
  fujian: { label: '福建', subtitle: '东南沿海', bounds: [114.35, 22.6, 121.75, 27.4], image: './assets/atlas-fujian.svg' },
  pearl: { label: '珠三角', subtitle: '华南', bounds: [112.2, 21.7, 115.0, 23.6], image: './assets/atlas-pearl.svg' },
  hainan: { label: '海南岛', subtitle: '华南海岛', bounds: [107.1, 17.3, 112.55, 21], image: './assets/atlas-hainan.svg' },
  kansai: { label: '日本关西', subtitle: '日本', bounds: [134.49, 34.25, 136.36, 35.35], image: './assets/atlas-kansai.svg' },
  zhejiang: { label: '杭州湾', subtitle: '华东', bounds: [118.05, 28.8, 122.9, 31.8], image: './assets/atlas-zhejiang.svg' },
});

// Keep IDs and order stable within this version of the atlas progress.
export const MAP_STOPS = Object.freeze([
  { id: 'xuzhou', name: '徐州', note: '江苏 · 中国', lon: 117.18, lat: 34.27, view: 'jiangsu' },
  { id: 'lianyungang', name: '连云港', note: '江苏 · 中国', lon: 119.22, lat: 34.60, view: 'jiangsu' },
  { id: 'changsha', name: '长沙', note: '湖南 · 中国', lon: 112.94, lat: 28.23, view: 'hunan' },
  { id: 'xiamen', name: '厦门', note: '福建 · 中国', lon: 118.08, lat: 24.48, view: 'fujian' },
  { id: 'quanzhou', name: '泉州', note: '福建 · 中国', lon: 118.59, lat: 24.91, view: 'fujian' },
  { id: 'guangzhou', name: '广州', note: '广东 · 中国', lon: 113.26, lat: 23.13, view: 'pearl' },
  { id: 'shenzhen', name: '深圳', note: '广东 · 中国', lon: 114.06, lat: 22.55, view: 'pearl' },
  { id: 'hongkong', name: '香港', note: '中国香港', lon: 114.17, lat: 22.28, view: 'pearl' },
  { id: 'macao', name: '澳门', note: '中国澳门', lon: 113.54, lat: 22.20, view: 'pearl' },
  { id: 'hainan', name: '海南', note: '三亚 · 海南岛', lon: 109.51, lat: 18.25, view: 'hainan' },
  { id: 'osaka', name: '大阪', note: '关西 · 日本', lon: 135.50, lat: 34.69, view: 'kansai' },
  { id: 'kyoto', name: '京都', note: '关西 · 日本', lon: 135.77, lat: 35.01, view: 'kansai' },
  { id: 'kobe', name: '神户', note: '关西 · 日本', lon: 135.20, lat: 34.69, view: 'kansai' },
  { id: 'nara', name: '奈良', note: '关西 · 日本', lon: 135.81, lat: 34.69, view: 'kansai' },
  { id: 'uji', name: '宇治', note: '关西 · 日本', lon: 135.81, lat: 34.89, view: 'kansai' },
  { id: 'hangzhou', name: '杭州', note: '浙江 · 中国', lon: 120.16, lat: 30.25, view: 'zhejiang' },
  { id: 'shaoxing', name: '绍兴', note: '浙江 · 中国', lon: 120.58, lat: 30.00, view: 'zhejiang' },
]);

export function mapPoint(place, viewId) {
  const [west, south, east, north] = MAP_VIEWS[viewId].bounds;
  return { x: (place.lon - west) / (east - west) * 1200, y: (north - place.lat) / (north - south) * 860 };
}

const city = (name, lon, lat) => ({ name, lon, lat });

// Destination cities and other major cities share the same marker style.
// The map never marks which of these cities belong to a photo.
export const MAP_CITIES = Object.freeze({
  all: [
    city('乌鲁木齐', 87.62, 43.82), city('拉萨', 91.14, 29.65), city('西宁', 101.78, 36.62),
    city('兰州', 103.84, 36.06), city('西安', 108.94, 34.34), city('成都', 104.07, 30.67),
    city('重庆', 106.55, 29.56), city('昆明', 102.71, 25.04), city('贵阳', 106.63, 26.65),
    city('南宁', 108.37, 22.82), city('哈尔滨', 126.64, 45.76), city('沈阳', 123.43, 41.80),
    city('北京', 116.40, 39.90), city('天津', 117.20, 39.12), city('济南', 117.12, 36.65),
    city('郑州', 113.63, 34.75), city('南京', 118.80, 32.06), city('上海', 121.47, 31.23),
    city('武汉', 114.31, 30.59), city('杭州', 120.16, 30.25), city('长沙', 112.94, 28.23),
    city('福州', 119.30, 26.08), city('厦门', 118.08, 24.48), city('广州', 113.26, 23.13),
    city('深圳', 114.06, 22.55), city('海口', 110.20, 20.04), city('三亚', 109.51, 18.25),
    city('台北', 121.56, 25.03), city('首尔', 126.98, 37.57), city('大阪', 135.50, 34.69),
    city('东京', 139.69, 35.68),
  ],
  jiangsu: [
    city('徐州', 117.18, 34.27), city('连云港', 119.22, 34.60), city('南京', 118.80, 32.06),
    city('苏州', 120.62, 31.32), city('无锡', 120.30, 31.57), city('常州', 119.95, 31.79),
    city('南通', 120.89, 31.98), city('扬州', 119.42, 32.39), city('盐城', 120.16, 33.35),
    city('淮安', 119.02, 33.61), city('宿迁', 118.28, 33.96), city('合肥', 117.23, 31.82),
    city('济南', 117.12, 36.65), city('青岛', 120.38, 36.07),
  ],
  hunan: [
    city('长沙', 112.94, 28.23), city('株洲', 113.13, 27.83), city('湘潭', 112.94, 27.83),
    city('岳阳', 113.13, 29.37), city('常德', 111.70, 29.03), city('益阳', 112.36, 28.55),
    city('衡阳', 112.57, 26.89), city('郴州', 113.01, 25.78), city('永州', 111.61, 26.42),
    city('邵阳', 111.47, 27.24), city('怀化', 110.00, 27.57), city('张家界', 110.48, 29.13),
  ],
  fujian: [
    city('厦门', 118.08, 24.48), city('泉州', 118.59, 24.91), city('福州', 119.30, 26.08),
    city('漳州', 117.65, 24.51), city('莆田', 119.01, 25.43), city('宁德', 119.53, 26.66),
    city('三明', 117.64, 26.27), city('龙岩', 117.02, 25.08), city('汕头', 116.68, 23.35),
  ],
  pearl: [
    city('广州', 113.26, 23.13), city('深圳', 114.06, 22.55), city('香港', 114.17, 22.28),
    city('澳门', 113.54, 22.20), city('珠海', 113.58, 22.27), city('佛山', 113.12, 23.02),
    city('东莞', 113.75, 23.02), city('中山', 113.39, 22.52), city('惠州', 114.42, 23.11),
    city('江门', 113.08, 22.58), city('肇庆', 112.47, 23.05),
  ],
  hainan: [
    city('三亚', 109.51, 18.25), city('海口', 110.20, 20.04), city('文昌', 110.75, 19.61),
    city('琼海', 110.47, 19.25), city('万宁', 110.39, 18.80), city('陵水', 110.04, 18.51),
    city('五指山', 109.52, 18.78), city('儋州', 109.58, 19.52), city('东方', 108.64, 19.10),
  ],
  kansai: [
    city('大阪', 135.50, 34.69), city('京都', 135.77, 35.01), city('神户', 135.20, 34.69),
    city('奈良', 135.81, 34.69), city('宇治', 135.81, 34.89), city('大津', 135.86, 35.02),
    city('西宫', 135.34, 34.74), city('尼崎', 135.41, 34.73), city('堺', 135.48, 34.57),
    city('枚方', 135.65, 34.81), city('明石', 134.99, 34.64),
  ],
  zhejiang: [
    city('杭州', 120.16, 30.25), city('绍兴', 120.58, 30.00), city('宁波', 121.55, 29.87),
    city('嘉兴', 120.75, 30.75), city('湖州', 120.09, 30.89), city('金华', 119.65, 29.08),
    city('义乌', 120.07, 29.31), city('舟山', 122.20, 30.00), city('上海', 121.47, 31.23),
  ],
});
