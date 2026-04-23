// 全國地政事務所 / 縣市 / 鄉鎮代碼對照表
// 資料來源：內政部地政司 OpenAPI
//   https://openapi.land.moi.gov.tw/WEBAPI/LandQuery.ashx?mode=QueryCity
//   https://openapi.land.moi.gov.tw/WEBAPI/LandQuery.ashx?mode=QueryTown
//   https://openapi.land.moi.gov.tw/WEBAPI/LandQuery.ashx?mode=QueryUnit
// 取得時間：2026-04-23

export const CITIES = [
  {
    "code": "A",
    "name": "臺北市"
  },
  {
    "code": "B",
    "name": "臺中市"
  },
  {
    "code": "C",
    "name": "基隆市"
  },
  {
    "code": "D",
    "name": "臺南市"
  },
  {
    "code": "E",
    "name": "高雄市"
  },
  {
    "code": "F",
    "name": "新北市"
  },
  {
    "code": "G",
    "name": "宜蘭縣"
  },
  {
    "code": "H",
    "name": "桃園市"
  },
  {
    "code": "I",
    "name": "嘉義市"
  },
  {
    "code": "J",
    "name": "新竹縣"
  },
  {
    "code": "K",
    "name": "苗栗縣"
  },
  {
    "code": "M",
    "name": "南投縣"
  },
  {
    "code": "N",
    "name": "彰化縣"
  },
  {
    "code": "O",
    "name": "新竹市"
  },
  {
    "code": "P",
    "name": "雲林縣"
  },
  {
    "code": "Q",
    "name": "嘉義縣"
  },
  {
    "code": "T",
    "name": "屏東縣"
  },
  {
    "code": "U",
    "name": "花蓮縣"
  },
  {
    "code": "V",
    "name": "臺東縣"
  },
  {
    "code": "W",
    "name": "金門縣"
  },
  {
    "code": "X",
    "name": "澎湖縣"
  },
  {
    "code": "Z",
    "name": "連江縣"
  }
];

export const TOWNS = [
  {
    "cityCode": "A",
    "code": "01",
    "name": "松山區",
    "unitCode": "AD"
  },
  {
    "cityCode": "A",
    "code": "02",
    "name": "大安區",
    "unitCode": "AF"
  },
  {
    "cityCode": "A",
    "code": "03",
    "name": "中正區",
    "unitCode": "AA"
  },
  {
    "cityCode": "A",
    "code": "03",
    "name": "中正區",
    "unitCode": "AB"
  },
  {
    "cityCode": "A",
    "code": "05",
    "name": "萬華區",
    "unitCode": "AB"
  },
  {
    "cityCode": "A",
    "code": "09",
    "name": "大同區",
    "unitCode": "AB"
  },
  {
    "cityCode": "A",
    "code": "10",
    "name": "中山區",
    "unitCode": "AC"
  },
  {
    "cityCode": "A",
    "code": "11",
    "name": "文山區",
    "unitCode": "AA"
  },
  {
    "cityCode": "A",
    "code": "13",
    "name": "南港區",
    "unitCode": "AD"
  },
  {
    "cityCode": "A",
    "code": "14",
    "name": "內湖區",
    "unitCode": "AC"
  },
  {
    "cityCode": "A",
    "code": "15",
    "name": "士林區",
    "unitCode": "AE"
  },
  {
    "cityCode": "A",
    "code": "16",
    "name": "北投區",
    "unitCode": "AE"
  },
  {
    "cityCode": "A",
    "code": "17",
    "name": "信義區",
    "unitCode": "AD"
  },
  {
    "cityCode": "B",
    "code": "01",
    "name": "中區",
    "unitCode": "BA"
  },
  {
    "cityCode": "B",
    "code": "02",
    "name": "東區",
    "unitCode": "BA"
  },
  {
    "cityCode": "B",
    "code": "03",
    "name": "南區",
    "unitCode": "BA"
  },
  {
    "cityCode": "B",
    "code": "04",
    "name": "西區",
    "unitCode": "BA"
  },
  {
    "cityCode": "B",
    "code": "05",
    "name": "北區",
    "unitCode": "BB"
  },
  {
    "cityCode": "B",
    "code": "06",
    "name": "西屯區",
    "unitCode": "BC"
  },
  {
    "cityCode": "B",
    "code": "07",
    "name": "南屯區",
    "unitCode": "BC"
  },
  {
    "cityCode": "B",
    "code": "08",
    "name": "北屯區",
    "unitCode": "BB"
  },
  {
    "cityCode": "B",
    "code": "09",
    "name": "豐原區",
    "unitCode": "BD"
  },
  {
    "cityCode": "B",
    "code": "10",
    "name": "東勢區",
    "unitCode": "BG"
  },
  {
    "cityCode": "B",
    "code": "11",
    "name": "大甲區",
    "unitCode": "BE"
  },
  {
    "cityCode": "B",
    "code": "12",
    "name": "清水區",
    "unitCode": "BF"
  },
  {
    "cityCode": "B",
    "code": "13",
    "name": "沙鹿區",
    "unitCode": "BF"
  },
  {
    "cityCode": "B",
    "code": "14",
    "name": "梧棲區",
    "unitCode": "BF"
  },
  {
    "cityCode": "B",
    "code": "15",
    "name": "后里區",
    "unitCode": "BD"
  },
  {
    "cityCode": "B",
    "code": "16",
    "name": "神岡區",
    "unitCode": "BD"
  },
  {
    "cityCode": "B",
    "code": "17",
    "name": "潭子區",
    "unitCode": "BH"
  },
  {
    "cityCode": "B",
    "code": "18",
    "name": "大雅區",
    "unitCode": "BH"
  },
  {
    "cityCode": "B",
    "code": "19",
    "name": "新社區",
    "unitCode": "BG"
  },
  {
    "cityCode": "B",
    "code": "20",
    "name": "石岡區",
    "unitCode": "BG"
  },
  {
    "cityCode": "B",
    "code": "21",
    "name": "外埔區",
    "unitCode": "BE"
  },
  {
    "cityCode": "B",
    "code": "22",
    "name": "大安區",
    "unitCode": "BE"
  },
  {
    "cityCode": "B",
    "code": "23",
    "name": "烏日區",
    "unitCode": "BI"
  },
  {
    "cityCode": "B",
    "code": "24",
    "name": "大肚區",
    "unitCode": "BK"
  },
  {
    "cityCode": "B",
    "code": "25",
    "name": "龍井區",
    "unitCode": "BK"
  },
  {
    "cityCode": "B",
    "code": "26",
    "name": "霧峰區",
    "unitCode": "BI"
  },
  {
    "cityCode": "B",
    "code": "27",
    "name": "太平區",
    "unitCode": "BJ"
  },
  {
    "cityCode": "B",
    "code": "28",
    "name": "大里區",
    "unitCode": "BI"
  },
  {
    "cityCode": "B",
    "code": "29",
    "name": "和平區",
    "unitCode": "BG"
  },
  {
    "cityCode": "C",
    "code": "01",
    "name": "中正區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "02",
    "name": "七堵區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "03",
    "name": "暖暖區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "04",
    "name": "仁愛區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "05",
    "name": "中山區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "06",
    "name": "安樂區",
    "unitCode": "CD"
  },
  {
    "cityCode": "C",
    "code": "07",
    "name": "信義區",
    "unitCode": "CD"
  },
  {
    "cityCode": "D",
    "code": "01",
    "name": "東區",
    "unitCode": "DC"
  },
  {
    "cityCode": "D",
    "code": "02",
    "name": "南區",
    "unitCode": "DC"
  },
  {
    "cityCode": "D",
    "code": "04",
    "name": "北區",
    "unitCode": "DA"
  },
  {
    "cityCode": "D",
    "code": "06",
    "name": "安南區",
    "unitCode": "DB"
  },
  {
    "cityCode": "D",
    "code": "07",
    "name": "安平區",
    "unitCode": "DA"
  },
  {
    "cityCode": "D",
    "code": "08",
    "name": "中西區",
    "unitCode": "DA"
  },
  {
    "cityCode": "D",
    "code": "09",
    "name": "新營區",
    "unitCode": "DD"
  },
  {
    "cityCode": "D",
    "code": "10",
    "name": "鹽水區",
    "unitCode": "DD"
  },
  {
    "cityCode": "D",
    "code": "11",
    "name": "柳營區",
    "unitCode": "DD"
  },
  {
    "cityCode": "D",
    "code": "12",
    "name": "白河區",
    "unitCode": "DE"
  },
  {
    "cityCode": "D",
    "code": "13",
    "name": "後壁區",
    "unitCode": "DE"
  },
  {
    "cityCode": "D",
    "code": "14",
    "name": "東山區",
    "unitCode": "DE"
  },
  {
    "cityCode": "D",
    "code": "15",
    "name": "麻豆區",
    "unitCode": "DF"
  },
  {
    "cityCode": "D",
    "code": "16",
    "name": "下營區",
    "unitCode": "DF"
  },
  {
    "cityCode": "D",
    "code": "17",
    "name": "六甲區",
    "unitCode": "DF"
  },
  {
    "cityCode": "D",
    "code": "18",
    "name": "官田區",
    "unitCode": "DF"
  },
  {
    "cityCode": "D",
    "code": "19",
    "name": "大內區",
    "unitCode": "DF"
  },
  {
    "cityCode": "D",
    "code": "20",
    "name": "佳里區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "21",
    "name": "西港區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "22",
    "name": "七股區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "23",
    "name": "將軍區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "24",
    "name": "北門區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "25",
    "name": "學甲區",
    "unitCode": "DG"
  },
  {
    "cityCode": "D",
    "code": "26",
    "name": "新化區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "27",
    "name": "善化區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "28",
    "name": "新市區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "29",
    "name": "安定區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "30",
    "name": "山上區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "31",
    "name": "左鎮區",
    "unitCode": "DH"
  },
  {
    "cityCode": "D",
    "code": "32",
    "name": "仁德區",
    "unitCode": "DI"
  },
  {
    "cityCode": "D",
    "code": "33",
    "name": "歸仁區",
    "unitCode": "DI"
  },
  {
    "cityCode": "D",
    "code": "34",
    "name": "關廟區",
    "unitCode": "DI"
  },
  {
    "cityCode": "D",
    "code": "35",
    "name": "龍崎區",
    "unitCode": "DI"
  },
  {
    "cityCode": "D",
    "code": "36",
    "name": "玉井區",
    "unitCode": "DJ"
  },
  {
    "cityCode": "D",
    "code": "37",
    "name": "楠西區",
    "unitCode": "DJ"
  },
  {
    "cityCode": "D",
    "code": "38",
    "name": "南化區",
    "unitCode": "DJ"
  },
  {
    "cityCode": "D",
    "code": "39",
    "name": "永康區",
    "unitCode": "DK"
  },
  {
    "cityCode": "E",
    "code": "01",
    "name": "鹽埕區",
    "unitCode": "EA"
  },
  {
    "cityCode": "E",
    "code": "02",
    "name": "鼓山區",
    "unitCode": "EA"
  },
  {
    "cityCode": "E",
    "code": "03",
    "name": "左營區",
    "unitCode": "EE"
  },
  {
    "cityCode": "E",
    "code": "04",
    "name": "楠梓區",
    "unitCode": "EE"
  },
  {
    "cityCode": "E",
    "code": "05",
    "name": "三民區",
    "unitCode": "ED"
  },
  {
    "cityCode": "E",
    "code": "06",
    "name": "新興區",
    "unitCode": "EB"
  },
  {
    "cityCode": "E",
    "code": "07",
    "name": "前金區",
    "unitCode": "EA"
  },
  {
    "cityCode": "E",
    "code": "08",
    "name": "苓雅區",
    "unitCode": "EB"
  },
  {
    "cityCode": "E",
    "code": "09",
    "name": "前鎮區",
    "unitCode": "EC"
  },
  {
    "cityCode": "E",
    "code": "10",
    "name": "旗津區",
    "unitCode": "EA"
  },
  {
    "cityCode": "E",
    "code": "11",
    "name": "小港區",
    "unitCode": "EC"
  },
  {
    "cityCode": "E",
    "code": "12",
    "name": "鳳山區",
    "unitCode": "EG"
  },
  {
    "cityCode": "E",
    "code": "13",
    "name": "林園區",
    "unitCode": "EL"
  },
  {
    "cityCode": "E",
    "code": "14",
    "name": "大寮區",
    "unitCode": "EL"
  },
  {
    "cityCode": "E",
    "code": "15",
    "name": "大樹區",
    "unitCode": "EG"
  },
  {
    "cityCode": "E",
    "code": "16",
    "name": "大社區",
    "unitCode": "EI"
  },
  {
    "cityCode": "E",
    "code": "17",
    "name": "仁武區",
    "unitCode": "EI"
  },
  {
    "cityCode": "E",
    "code": "18",
    "name": "鳥松區",
    "unitCode": "EI"
  },
  {
    "cityCode": "E",
    "code": "19",
    "name": "岡山區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "20",
    "name": "橋頭區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "21",
    "name": "燕巢區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "22",
    "name": "田寮區",
    "unitCode": "EJ"
  },
  {
    "cityCode": "E",
    "code": "23",
    "name": "阿蓮區",
    "unitCode": "EJ"
  },
  {
    "cityCode": "E",
    "code": "24",
    "name": "路竹區",
    "unitCode": "EJ"
  },
  {
    "cityCode": "E",
    "code": "25",
    "name": "湖內區",
    "unitCode": "EJ"
  },
  {
    "cityCode": "E",
    "code": "26",
    "name": "茄萣區",
    "unitCode": "EJ"
  },
  {
    "cityCode": "E",
    "code": "27",
    "name": "永安區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "28",
    "name": "彌陀區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "29",
    "name": "梓官區",
    "unitCode": "EF"
  },
  {
    "cityCode": "E",
    "code": "30",
    "name": "旗山區",
    "unitCode": "EH"
  },
  {
    "cityCode": "E",
    "code": "31",
    "name": "美濃區",
    "unitCode": "EK"
  },
  {
    "cityCode": "E",
    "code": "32",
    "name": "六龜區",
    "unitCode": "EK"
  },
  {
    "cityCode": "E",
    "code": "33",
    "name": "甲仙區",
    "unitCode": "EH"
  },
  {
    "cityCode": "E",
    "code": "34",
    "name": "杉林區",
    "unitCode": "EH"
  },
  {
    "cityCode": "E",
    "code": "35",
    "name": "內門區",
    "unitCode": "EH"
  },
  {
    "cityCode": "E",
    "code": "36",
    "name": "茂林區",
    "unitCode": "EK"
  },
  {
    "cityCode": "E",
    "code": "37",
    "name": "桃源區",
    "unitCode": "EK"
  },
  {
    "cityCode": "E",
    "code": "38",
    "name": "那瑪夏區",
    "unitCode": "EH"
  },
  {
    "cityCode": "F",
    "code": "01",
    "name": "新莊區",
    "unitCode": "FB"
  },
  {
    "cityCode": "F",
    "code": "02",
    "name": "林口區",
    "unitCode": "FB"
  },
  {
    "cityCode": "F",
    "code": "03",
    "name": "五股區",
    "unitCode": "FB"
  },
  {
    "cityCode": "F",
    "code": "04",
    "name": "蘆洲區",
    "unitCode": "FG"
  },
  {
    "cityCode": "F",
    "code": "05",
    "name": "三重區",
    "unitCode": "FG"
  },
  {
    "cityCode": "F",
    "code": "06",
    "name": "泰山區",
    "unitCode": "FB"
  },
  {
    "cityCode": "F",
    "code": "07",
    "name": "新店區",
    "unitCode": "FC"
  },
  {
    "cityCode": "F",
    "code": "08",
    "name": "石碇區",
    "unitCode": "FC"
  },
  {
    "cityCode": "F",
    "code": "09",
    "name": "深坑區",
    "unitCode": "FC"
  },
  {
    "cityCode": "F",
    "code": "10",
    "name": "坪林區",
    "unitCode": "FC"
  },
  {
    "cityCode": "F",
    "code": "11",
    "name": "烏來區",
    "unitCode": "FC"
  },
  {
    "cityCode": "F",
    "code": "14",
    "name": "板橋區",
    "unitCode": "FA"
  },
  {
    "cityCode": "F",
    "code": "15",
    "name": "三峽區",
    "unitCode": "FI"
  },
  {
    "cityCode": "F",
    "code": "16",
    "name": "鶯歌區",
    "unitCode": "FI"
  },
  {
    "cityCode": "F",
    "code": "17",
    "name": "樹林區",
    "unitCode": "FI"
  },
  {
    "cityCode": "F",
    "code": "18",
    "name": "中和區",
    "unitCode": "FH"
  },
  {
    "cityCode": "F",
    "code": "19",
    "name": "土城區",
    "unitCode": "FA"
  },
  {
    "cityCode": "F",
    "code": "21",
    "name": "瑞芳區",
    "unitCode": "FF"
  },
  {
    "cityCode": "F",
    "code": "22",
    "name": "平溪區",
    "unitCode": "FF"
  },
  {
    "cityCode": "F",
    "code": "23",
    "name": "雙溪區",
    "unitCode": "FF"
  },
  {
    "cityCode": "F",
    "code": "24",
    "name": "貢寮區",
    "unitCode": "FF"
  },
  {
    "cityCode": "F",
    "code": "25",
    "name": "金山區",
    "unitCode": "FD"
  },
  {
    "cityCode": "F",
    "code": "26",
    "name": "萬里區",
    "unitCode": "FD"
  },
  {
    "cityCode": "F",
    "code": "27",
    "name": "淡水區",
    "unitCode": "FE"
  },
  {
    "cityCode": "F",
    "code": "28",
    "name": "汐止區",
    "unitCode": "FD"
  },
  {
    "cityCode": "F",
    "code": "30",
    "name": "三芝區",
    "unitCode": "FE"
  },
  {
    "cityCode": "F",
    "code": "31",
    "name": "石門區",
    "unitCode": "FE"
  },
  {
    "cityCode": "F",
    "code": "32",
    "name": "八里區",
    "unitCode": "FE"
  },
  {
    "cityCode": "F",
    "code": "33",
    "name": "永和區",
    "unitCode": "FH"
  },
  {
    "cityCode": "G",
    "code": "01",
    "name": "宜蘭市",
    "unitCode": "GB"
  },
  {
    "cityCode": "G",
    "code": "02",
    "name": "頭城鎮",
    "unitCode": "GB"
  },
  {
    "cityCode": "G",
    "code": "03",
    "name": "礁溪鄉",
    "unitCode": "GB"
  },
  {
    "cityCode": "G",
    "code": "04",
    "name": "壯圍鄉",
    "unitCode": "GB"
  },
  {
    "cityCode": "G",
    "code": "05",
    "name": "員山鄉",
    "unitCode": "GB"
  },
  {
    "cityCode": "G",
    "code": "06",
    "name": "羅東鎮",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "07",
    "name": "五結鄉",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "08",
    "name": "冬山鄉",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "09",
    "name": "蘇澳鎮",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "10",
    "name": "三星鄉",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "11",
    "name": "大同鄉",
    "unitCode": "GA"
  },
  {
    "cityCode": "G",
    "code": "12",
    "name": "南澳鄉",
    "unitCode": "GA"
  },
  {
    "cityCode": "H",
    "code": "01",
    "name": "桃園區",
    "unitCode": "HA"
  },
  {
    "cityCode": "H",
    "code": "02",
    "name": "大溪區",
    "unitCode": "HC"
  },
  {
    "cityCode": "H",
    "code": "03",
    "name": "中壢區",
    "unitCode": "HB"
  },
  {
    "cityCode": "H",
    "code": "04",
    "name": "楊梅區",
    "unitCode": "HD"
  },
  {
    "cityCode": "H",
    "code": "05",
    "name": "蘆竹區",
    "unitCode": "HE"
  },
  {
    "cityCode": "H",
    "code": "06",
    "name": "大園區",
    "unitCode": "HE"
  },
  {
    "cityCode": "H",
    "code": "07",
    "name": "龜山區",
    "unitCode": "HH"
  },
  {
    "cityCode": "H",
    "code": "08",
    "name": "八德區",
    "unitCode": "HF"
  },
  {
    "cityCode": "H",
    "code": "09",
    "name": "龍潭區",
    "unitCode": "HC"
  },
  {
    "cityCode": "H",
    "code": "10",
    "name": "平鎮區",
    "unitCode": "HG"
  },
  {
    "cityCode": "H",
    "code": "11",
    "name": "新屋區",
    "unitCode": "HD"
  },
  {
    "cityCode": "H",
    "code": "12",
    "name": "觀音區",
    "unitCode": "HB"
  },
  {
    "cityCode": "H",
    "code": "13",
    "name": "復興區",
    "unitCode": "HC"
  },
  {
    "cityCode": "I",
    "code": "01",
    "name": "嘉義市",
    "unitCode": "IA"
  },
  {
    "cityCode": "J",
    "code": "02",
    "name": "竹東鎮",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "03",
    "name": "關西鎮",
    "unitCode": "JB"
  },
  {
    "cityCode": "J",
    "code": "04",
    "name": "新埔鎮",
    "unitCode": "JB"
  },
  {
    "cityCode": "J",
    "code": "05",
    "name": "竹北市",
    "unitCode": "JB"
  },
  {
    "cityCode": "J",
    "code": "06",
    "name": "湖口鄉",
    "unitCode": "JD"
  },
  {
    "cityCode": "J",
    "code": "08",
    "name": "橫山鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "09",
    "name": "新豐鄉",
    "unitCode": "JD"
  },
  {
    "cityCode": "J",
    "code": "10",
    "name": "芎林鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "11",
    "name": "寶山鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "12",
    "name": "北埔鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "13",
    "name": "峨眉鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "14",
    "name": "尖石鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "J",
    "code": "15",
    "name": "五峰鄉",
    "unitCode": "JC"
  },
  {
    "cityCode": "K",
    "code": "01",
    "name": "苗栗市",
    "unitCode": "KB"
  },
  {
    "cityCode": "K",
    "code": "02",
    "name": "苑裡鎮",
    "unitCode": "KC"
  },
  {
    "cityCode": "K",
    "code": "03",
    "name": "通霄鎮",
    "unitCode": "KC"
  },
  {
    "cityCode": "K",
    "code": "04",
    "name": "公館鄉",
    "unitCode": "KB"
  },
  {
    "cityCode": "K",
    "code": "05",
    "name": "銅鑼鄉",
    "unitCode": "KE"
  },
  {
    "cityCode": "K",
    "code": "06",
    "name": "三義鄉",
    "unitCode": "KE"
  },
  {
    "cityCode": "K",
    "code": "07",
    "name": "西湖鄉",
    "unitCode": "KE"
  },
  {
    "cityCode": "K",
    "code": "08",
    "name": "頭屋鄉",
    "unitCode": "KB"
  },
  {
    "cityCode": "K",
    "code": "09",
    "name": "竹南鎮",
    "unitCode": "KD"
  },
  {
    "cityCode": "K",
    "code": "10",
    "name": "頭份巿",
    "unitCode": "KF"
  },
  {
    "cityCode": "K",
    "code": "11",
    "name": "造橋鄉",
    "unitCode": "KD"
  },
  {
    "cityCode": "K",
    "code": "12",
    "name": "後龍鎮",
    "unitCode": "KD"
  },
  {
    "cityCode": "K",
    "code": "13",
    "name": "三灣鄉",
    "unitCode": "KF"
  },
  {
    "cityCode": "K",
    "code": "14",
    "name": "南庄鄉",
    "unitCode": "KF"
  },
  {
    "cityCode": "K",
    "code": "15",
    "name": "大湖鄉",
    "unitCode": "KA"
  },
  {
    "cityCode": "K",
    "code": "16",
    "name": "卓蘭鎮",
    "unitCode": "KA"
  },
  {
    "cityCode": "K",
    "code": "17",
    "name": "獅潭鄉",
    "unitCode": "KA"
  },
  {
    "cityCode": "K",
    "code": "18",
    "name": "泰安鄉",
    "unitCode": "KA"
  },
  {
    "cityCode": "M",
    "code": "01",
    "name": "南投市",
    "unitCode": "MA"
  },
  {
    "cityCode": "M",
    "code": "02",
    "name": "埔里鎮",
    "unitCode": "MC"
  },
  {
    "cityCode": "M",
    "code": "03",
    "name": "草屯鎮",
    "unitCode": "MB"
  },
  {
    "cityCode": "M",
    "code": "04",
    "name": "竹山鎮",
    "unitCode": "MD"
  },
  {
    "cityCode": "M",
    "code": "05",
    "name": "集集鎮",
    "unitCode": "ME"
  },
  {
    "cityCode": "M",
    "code": "06",
    "name": "名間鄉",
    "unitCode": "MA"
  },
  {
    "cityCode": "M",
    "code": "07",
    "name": "鹿谷鄉",
    "unitCode": "MD"
  },
  {
    "cityCode": "M",
    "code": "08",
    "name": "中寮鄉",
    "unitCode": "MA"
  },
  {
    "cityCode": "M",
    "code": "09",
    "name": "魚池鄉",
    "unitCode": "MC"
  },
  {
    "cityCode": "M",
    "code": "10",
    "name": "國姓鄉",
    "unitCode": "MC"
  },
  {
    "cityCode": "M",
    "code": "11",
    "name": "水里鄉",
    "unitCode": "ME"
  },
  {
    "cityCode": "M",
    "code": "12",
    "name": "信義鄉",
    "unitCode": "ME"
  },
  {
    "cityCode": "M",
    "code": "13",
    "name": "仁愛鄉",
    "unitCode": "MC"
  },
  {
    "cityCode": "N",
    "code": "01",
    "name": "彰化市",
    "unitCode": "NA"
  },
  {
    "cityCode": "N",
    "code": "02",
    "name": "鹿港鎮",
    "unitCode": "NC"
  },
  {
    "cityCode": "N",
    "code": "03",
    "name": "和美鎮",
    "unitCode": "NB"
  },
  {
    "cityCode": "N",
    "code": "04",
    "name": "北斗鎮",
    "unitCode": "NF"
  },
  {
    "cityCode": "N",
    "code": "05",
    "name": "員林市",
    "unitCode": "ND"
  },
  {
    "cityCode": "N",
    "code": "06",
    "name": "溪湖鎮",
    "unitCode": "NH"
  },
  {
    "cityCode": "N",
    "code": "07",
    "name": "田中鎮",
    "unitCode": "NE"
  },
  {
    "cityCode": "N",
    "code": "08",
    "name": "二林鎮",
    "unitCode": "NG"
  },
  {
    "cityCode": "N",
    "code": "09",
    "name": "線西鄉",
    "unitCode": "NB"
  },
  {
    "cityCode": "N",
    "code": "10",
    "name": "伸港鄉",
    "unitCode": "NB"
  },
  {
    "cityCode": "N",
    "code": "11",
    "name": "福興鄉",
    "unitCode": "NC"
  },
  {
    "cityCode": "N",
    "code": "12",
    "name": "秀水鄉",
    "unitCode": "NA"
  },
  {
    "cityCode": "N",
    "code": "13",
    "name": "花壇鄉",
    "unitCode": "NA"
  },
  {
    "cityCode": "N",
    "code": "14",
    "name": "芬園鄉",
    "unitCode": "NA"
  },
  {
    "cityCode": "N",
    "code": "15",
    "name": "大村鄉",
    "unitCode": "ND"
  },
  {
    "cityCode": "N",
    "code": "16",
    "name": "埔鹽鄉",
    "unitCode": "NH"
  },
  {
    "cityCode": "N",
    "code": "17",
    "name": "埔心鄉",
    "unitCode": "NH"
  },
  {
    "cityCode": "N",
    "code": "18",
    "name": "永靖鄉",
    "unitCode": "ND"
  },
  {
    "cityCode": "N",
    "code": "19",
    "name": "社頭鄉",
    "unitCode": "NE"
  },
  {
    "cityCode": "N",
    "code": "20",
    "name": "二水鄉",
    "unitCode": "NE"
  },
  {
    "cityCode": "N",
    "code": "21",
    "name": "田尾鄉",
    "unitCode": "NF"
  },
  {
    "cityCode": "N",
    "code": "22",
    "name": "埤頭鄉",
    "unitCode": "NF"
  },
  {
    "cityCode": "N",
    "code": "23",
    "name": "芳苑鄉",
    "unitCode": "NG"
  },
  {
    "cityCode": "N",
    "code": "24",
    "name": "大城鄉",
    "unitCode": "NG"
  },
  {
    "cityCode": "N",
    "code": "25",
    "name": "竹塘鄉",
    "unitCode": "NG"
  },
  {
    "cityCode": "N",
    "code": "26",
    "name": "溪州鄉",
    "unitCode": "NF"
  },
  {
    "cityCode": "O",
    "code": "01",
    "name": "新竹市",
    "unitCode": "OA"
  },
  {
    "cityCode": "P",
    "code": "01",
    "name": "斗六市",
    "unitCode": "PA"
  },
  {
    "cityCode": "P",
    "code": "02",
    "name": "斗南鎮",
    "unitCode": "PB"
  },
  {
    "cityCode": "P",
    "code": "03",
    "name": "虎尾鎮",
    "unitCode": "PD"
  },
  {
    "cityCode": "P",
    "code": "04",
    "name": "西螺鎮",
    "unitCode": "PC"
  },
  {
    "cityCode": "P",
    "code": "05",
    "name": "土庫鎮",
    "unitCode": "PD"
  },
  {
    "cityCode": "P",
    "code": "06",
    "name": "北港鎮",
    "unitCode": "PE"
  },
  {
    "cityCode": "P",
    "code": "07",
    "name": "古坑鄉",
    "unitCode": "PA"
  },
  {
    "cityCode": "P",
    "code": "08",
    "name": "大埤鄉",
    "unitCode": "PB"
  },
  {
    "cityCode": "P",
    "code": "09",
    "name": "莿桐鄉",
    "unitCode": "PA"
  },
  {
    "cityCode": "P",
    "code": "10",
    "name": "林內鄉",
    "unitCode": "PA"
  },
  {
    "cityCode": "P",
    "code": "11",
    "name": "二崙鄉",
    "unitCode": "PC"
  },
  {
    "cityCode": "P",
    "code": "12",
    "name": "崙背鄉",
    "unitCode": "PC"
  },
  {
    "cityCode": "P",
    "code": "13",
    "name": "麥寮鄉",
    "unitCode": "PF"
  },
  {
    "cityCode": "P",
    "code": "14",
    "name": "東勢鄉",
    "unitCode": "PF"
  },
  {
    "cityCode": "P",
    "code": "15",
    "name": "褒忠鄉",
    "unitCode": "PD"
  },
  {
    "cityCode": "P",
    "code": "16",
    "name": "台西鄉",
    "unitCode": "PF"
  },
  {
    "cityCode": "P",
    "code": "17",
    "name": "元長鄉",
    "unitCode": "PE"
  },
  {
    "cityCode": "P",
    "code": "18",
    "name": "四湖鄉",
    "unitCode": "PE"
  },
  {
    "cityCode": "P",
    "code": "19",
    "name": "口湖鄉",
    "unitCode": "PE"
  },
  {
    "cityCode": "P",
    "code": "20",
    "name": "水林鄉",
    "unitCode": "PE"
  },
  {
    "cityCode": "Q",
    "code": "02",
    "name": "朴子市",
    "unitCode": "QB"
  },
  {
    "cityCode": "Q",
    "code": "03",
    "name": "布袋鎮",
    "unitCode": "QB"
  },
  {
    "cityCode": "Q",
    "code": "04",
    "name": "大林鎮",
    "unitCode": "QC"
  },
  {
    "cityCode": "Q",
    "code": "05",
    "name": "民雄鄉",
    "unitCode": "QC"
  },
  {
    "cityCode": "Q",
    "code": "06",
    "name": "溪口鄉",
    "unitCode": "QC"
  },
  {
    "cityCode": "Q",
    "code": "07",
    "name": "新港鄉",
    "unitCode": "QC"
  },
  {
    "cityCode": "Q",
    "code": "08",
    "name": "六腳鄉",
    "unitCode": "QB"
  },
  {
    "cityCode": "Q",
    "code": "09",
    "name": "東石鄉",
    "unitCode": "QB"
  },
  {
    "cityCode": "Q",
    "code": "10",
    "name": "義竹鄉",
    "unitCode": "QB"
  },
  {
    "cityCode": "Q",
    "code": "11",
    "name": "鹿草鄉",
    "unitCode": "QD"
  },
  {
    "cityCode": "Q",
    "code": "12",
    "name": "太保市",
    "unitCode": "QD"
  },
  {
    "cityCode": "Q",
    "code": "13",
    "name": "水上鄉",
    "unitCode": "QD"
  },
  {
    "cityCode": "Q",
    "code": "14",
    "name": "中埔鄉",
    "unitCode": "QD"
  },
  {
    "cityCode": "Q",
    "code": "15",
    "name": "竹崎鄉",
    "unitCode": "QE"
  },
  {
    "cityCode": "Q",
    "code": "16",
    "name": "梅山鄉",
    "unitCode": "QE"
  },
  {
    "cityCode": "Q",
    "code": "17",
    "name": "番路鄉",
    "unitCode": "QE"
  },
  {
    "cityCode": "Q",
    "code": "18",
    "name": "大埔鄉",
    "unitCode": "QD"
  },
  {
    "cityCode": "Q",
    "code": "20",
    "name": "阿里山鄉",
    "unitCode": "QE"
  },
  {
    "cityCode": "T",
    "code": "01",
    "name": "屏東巿",
    "unitCode": "TA"
  },
  {
    "cityCode": "T",
    "code": "02",
    "name": "潮州鎮",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "03",
    "name": "東港鎮",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "04",
    "name": "恆春鎮",
    "unitCode": "TE"
  },
  {
    "cityCode": "T",
    "code": "05",
    "name": "萬丹鄉",
    "unitCode": "TA"
  },
  {
    "cityCode": "T",
    "code": "06",
    "name": "長治鄉",
    "unitCode": "TA"
  },
  {
    "cityCode": "T",
    "code": "07",
    "name": "麟洛鄉",
    "unitCode": "TA"
  },
  {
    "cityCode": "T",
    "code": "08",
    "name": "九如鄉",
    "unitCode": "TA"
  },
  {
    "cityCode": "T",
    "code": "09",
    "name": "里港鄉",
    "unitCode": "TB"
  },
  {
    "cityCode": "T",
    "code": "10",
    "name": "埔鄉",
    "unitCode": "TB"
  },
  {
    "cityCode": "T",
    "code": "11",
    "name": "高樹鄉",
    "unitCode": "TB"
  },
  {
    "cityCode": "T",
    "code": "12",
    "name": "萬巒鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "13",
    "name": "內埔鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "14",
    "name": "竹田鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "15",
    "name": "新埤鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "16",
    "name": "枋寮鄉",
    "unitCode": "TF"
  },
  {
    "cityCode": "T",
    "code": "17",
    "name": "新園鄉",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "18",
    "name": "崁頂鄉",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "19",
    "name": "林邊鄉",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "20",
    "name": "南州鄉",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "21",
    "name": "佳冬鄉",
    "unitCode": "TF"
  },
  {
    "cityCode": "T",
    "code": "22",
    "name": "琉球鄉",
    "unitCode": "TD"
  },
  {
    "cityCode": "T",
    "code": "23",
    "name": "車城鄉",
    "unitCode": "TE"
  },
  {
    "cityCode": "T",
    "code": "24",
    "name": "滿州鄉",
    "unitCode": "TE"
  },
  {
    "cityCode": "T",
    "code": "25",
    "name": "枋山鄉",
    "unitCode": "TF"
  },
  {
    "cityCode": "T",
    "code": "26",
    "name": "三地門鄉",
    "unitCode": "TB"
  },
  {
    "cityCode": "T",
    "code": "27",
    "name": "霧台鄉",
    "unitCode": "TB"
  },
  {
    "cityCode": "T",
    "code": "28",
    "name": "瑪家鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "29",
    "name": "泰武鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "30",
    "name": "來義鄉",
    "unitCode": "TC"
  },
  {
    "cityCode": "T",
    "code": "31",
    "name": "春日鄉",
    "unitCode": "TF"
  },
  {
    "cityCode": "T",
    "code": "32",
    "name": "獅子鄉",
    "unitCode": "TF"
  },
  {
    "cityCode": "T",
    "code": "33",
    "name": "牡丹鄉",
    "unitCode": "TE"
  },
  {
    "cityCode": "U",
    "code": "01",
    "name": "花蓮市",
    "unitCode": "UA"
  },
  {
    "cityCode": "U",
    "code": "02",
    "name": "光復鄉",
    "unitCode": "UB"
  },
  {
    "cityCode": "U",
    "code": "03",
    "name": "玉里鎮",
    "unitCode": "UC"
  },
  {
    "cityCode": "U",
    "code": "04",
    "name": "新城鄉",
    "unitCode": "UA"
  },
  {
    "cityCode": "U",
    "code": "05",
    "name": "吉安鄉",
    "unitCode": "UA"
  },
  {
    "cityCode": "U",
    "code": "06",
    "name": "壽豐鄉",
    "unitCode": "UA"
  },
  {
    "cityCode": "U",
    "code": "07",
    "name": "鳳林鎮",
    "unitCode": "UB"
  },
  {
    "cityCode": "U",
    "code": "08",
    "name": "豐濱鄉",
    "unitCode": "UB"
  },
  {
    "cityCode": "U",
    "code": "09",
    "name": "瑞穗鄉",
    "unitCode": "UC"
  },
  {
    "cityCode": "U",
    "code": "10",
    "name": "富里鄉",
    "unitCode": "UC"
  },
  {
    "cityCode": "U",
    "code": "11",
    "name": "秀林鄉",
    "unitCode": "UA"
  },
  {
    "cityCode": "U",
    "code": "12",
    "name": "萬榮鄉",
    "unitCode": "UB"
  },
  {
    "cityCode": "U",
    "code": "13",
    "name": "卓溪鄉",
    "unitCode": "UC"
  },
  {
    "cityCode": "V",
    "code": "01",
    "name": "台東市",
    "unitCode": "VA"
  },
  {
    "cityCode": "V",
    "code": "02",
    "name": "成功鎮",
    "unitCode": "VB"
  },
  {
    "cityCode": "V",
    "code": "03",
    "name": "關山鎮",
    "unitCode": "VC"
  },
  {
    "cityCode": "V",
    "code": "04",
    "name": "卑南鄉",
    "unitCode": "VA"
  },
  {
    "cityCode": "V",
    "code": "05",
    "name": "大武鄉",
    "unitCode": "VD"
  },
  {
    "cityCode": "V",
    "code": "06",
    "name": "太麻里鄉",
    "unitCode": "VD"
  },
  {
    "cityCode": "V",
    "code": "07",
    "name": "東河鄉",
    "unitCode": "VB"
  },
  {
    "cityCode": "V",
    "code": "08",
    "name": "長濱鄉",
    "unitCode": "VB"
  },
  {
    "cityCode": "V",
    "code": "09",
    "name": "鹿野鄉",
    "unitCode": "VC"
  },
  {
    "cityCode": "V",
    "code": "10",
    "name": "池上鄉",
    "unitCode": "VC"
  },
  {
    "cityCode": "V",
    "code": "11",
    "name": "綠島鄉",
    "unitCode": "VA"
  },
  {
    "cityCode": "V",
    "code": "12",
    "name": "延平鄉",
    "unitCode": "VC"
  },
  {
    "cityCode": "V",
    "code": "13",
    "name": "海端鄉",
    "unitCode": "VC"
  },
  {
    "cityCode": "V",
    "code": "14",
    "name": "達仁鄉",
    "unitCode": "VD"
  },
  {
    "cityCode": "V",
    "code": "15",
    "name": "金峯鄉",
    "unitCode": "VD"
  },
  {
    "cityCode": "V",
    "code": "16",
    "name": "蘭嶼鄉",
    "unitCode": "VA"
  },
  {
    "cityCode": "W",
    "code": "01",
    "name": "金湖鎮",
    "unitCode": "WA"
  },
  {
    "cityCode": "W",
    "code": "02",
    "name": "金沙鎮",
    "unitCode": "WA"
  },
  {
    "cityCode": "W",
    "code": "03",
    "name": "金城鎮",
    "unitCode": "WA"
  },
  {
    "cityCode": "W",
    "code": "04",
    "name": "金寧鄉",
    "unitCode": "WA"
  },
  {
    "cityCode": "W",
    "code": "05",
    "name": "烈嶼鄉",
    "unitCode": "WA"
  },
  {
    "cityCode": "W",
    "code": "06",
    "name": "烏坵鄉",
    "unitCode": "WA"
  },
  {
    "cityCode": "X",
    "code": "01",
    "name": "馬公市",
    "unitCode": "XA"
  },
  {
    "cityCode": "X",
    "code": "02",
    "name": "湖西鄉",
    "unitCode": "XA"
  },
  {
    "cityCode": "X",
    "code": "03",
    "name": "白沙鄉",
    "unitCode": "XA"
  },
  {
    "cityCode": "X",
    "code": "04",
    "name": "西嶼鄉",
    "unitCode": "XA"
  },
  {
    "cityCode": "X",
    "code": "05",
    "name": "望安鄉",
    "unitCode": "XA"
  },
  {
    "cityCode": "X",
    "code": "06",
    "name": "七美鄉",
    "unitCode": "XA"
  },
  {
    "cityCode": "Z",
    "code": "01",
    "name": "南竿鄉",
    "unitCode": "ZA"
  },
  {
    "cityCode": "Z",
    "code": "02",
    "name": "北竿鄉",
    "unitCode": "ZA"
  },
  {
    "cityCode": "Z",
    "code": "03",
    "name": "莒光鄉",
    "unitCode": "ZA"
  },
  {
    "cityCode": "Z",
    "code": "04",
    "name": "東引鄉",
    "unitCode": "ZA"
  }
];

export const UNITS = [
  {
    "cityCode": "A",
    "code": "AA",
    "name": "古亭地政事務所"
  },
  {
    "cityCode": "A",
    "code": "AB",
    "name": "建成地政事務所"
  },
  {
    "cityCode": "A",
    "code": "AC",
    "name": "中山地政事務所"
  },
  {
    "cityCode": "A",
    "code": "AD",
    "name": "松山地政事務所"
  },
  {
    "cityCode": "A",
    "code": "AE",
    "name": "士林地政事務所"
  },
  {
    "cityCode": "A",
    "code": "AF",
    "name": "大安地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BA",
    "name": "中山地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BB",
    "name": "中正地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BC",
    "name": "中興地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BD",
    "name": "豐原地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BE",
    "name": "大甲地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BF",
    "name": "清水地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BG",
    "name": "東勢地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BH",
    "name": "雅潭地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BI",
    "name": "大里地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BJ",
    "name": "太平地政事務所"
  },
  {
    "cityCode": "B",
    "code": "BK",
    "name": "龍井地政事務所"
  },
  {
    "cityCode": "C",
    "code": "CD",
    "name": "基隆市地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DA",
    "name": "臺南地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DB",
    "name": "安南地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DC",
    "name": "東南地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DD",
    "name": "鹽水地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DE",
    "name": "白河地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DF",
    "name": "麻豆地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DG",
    "name": "佳里地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DH",
    "name": "新化地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DI",
    "name": "歸仁地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DJ",
    "name": "玉井地政事務所"
  },
  {
    "cityCode": "D",
    "code": "DK",
    "name": "永康地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EA",
    "name": "鹽埕地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EB",
    "name": "新興地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EC",
    "name": "前鎮地政事務所"
  },
  {
    "cityCode": "E",
    "code": "ED",
    "name": "三民地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EE",
    "name": "楠梓地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EF",
    "name": "岡山地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EG",
    "name": "鳳山地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EH",
    "name": "旗山地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EI",
    "name": "仁武地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EJ",
    "name": "路竹地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EK",
    "name": "美濃地政事務所"
  },
  {
    "cityCode": "E",
    "code": "EL",
    "name": "大寮地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FA",
    "name": "板橋地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FB",
    "name": "新莊地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FC",
    "name": "新店地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FD",
    "name": "汐止地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FE",
    "name": "淡水地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FF",
    "name": "瑞芳地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FG",
    "name": "三重地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FH",
    "name": "中和地政事務所"
  },
  {
    "cityCode": "F",
    "code": "FI",
    "name": "樹林地政事務所"
  },
  {
    "cityCode": "G",
    "code": "GA",
    "name": "羅東地政事務所"
  },
  {
    "cityCode": "G",
    "code": "GB",
    "name": "宜蘭地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HA",
    "name": "桃園地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HB",
    "name": "中壢地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HC",
    "name": "大溪地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HD",
    "name": "楊梅地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HE",
    "name": "蘆竹地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HF",
    "name": "八德地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HG",
    "name": "平鎮地政事務所"
  },
  {
    "cityCode": "H",
    "code": "HH",
    "name": "龜山地政事務所"
  },
  {
    "cityCode": "I",
    "code": "IA",
    "name": "嘉義市地政事務所"
  },
  {
    "cityCode": "J",
    "code": "JB",
    "name": "竹北地政事務所"
  },
  {
    "cityCode": "J",
    "code": "JC",
    "name": "竹東地政事務所"
  },
  {
    "cityCode": "J",
    "code": "JD",
    "name": "新湖地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KA",
    "name": "大湖地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KB",
    "name": "苗栗地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KC",
    "name": "通霄地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KD",
    "name": "竹南地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KE",
    "name": "銅鑼地政事務所"
  },
  {
    "cityCode": "K",
    "code": "KF",
    "name": "頭份地政事務所"
  },
  {
    "cityCode": "M",
    "code": "MA",
    "name": "南投地政事務所"
  },
  {
    "cityCode": "M",
    "code": "MB",
    "name": "草屯地政事務所"
  },
  {
    "cityCode": "M",
    "code": "MC",
    "name": "埔里地政事務所"
  },
  {
    "cityCode": "M",
    "code": "MD",
    "name": "竹山地政事務所"
  },
  {
    "cityCode": "M",
    "code": "ME",
    "name": "水里地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NA",
    "name": "彰化地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NB",
    "name": "和美地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NC",
    "name": "鹿港地政事務所"
  },
  {
    "cityCode": "N",
    "code": "ND",
    "name": "員林地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NE",
    "name": "田中地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NF",
    "name": "北斗地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NG",
    "name": "二林地政事務所"
  },
  {
    "cityCode": "N",
    "code": "NH",
    "name": "溪湖地政事務所"
  },
  {
    "cityCode": "O",
    "code": "OA",
    "name": "新竹市地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PA",
    "name": "斗六地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PB",
    "name": "斗南地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PC",
    "name": "西螺地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PD",
    "name": "虎尾地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PE",
    "name": "北港地政事務所"
  },
  {
    "cityCode": "P",
    "code": "PF",
    "name": "台西地政事務所"
  },
  {
    "cityCode": "Q",
    "code": "QB",
    "name": "朴子地政事務所"
  },
  {
    "cityCode": "Q",
    "code": "QC",
    "name": "大林地政事務所"
  },
  {
    "cityCode": "Q",
    "code": "QD",
    "name": "水上地政事務所"
  },
  {
    "cityCode": "Q",
    "code": "QE",
    "name": "竹崎地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TA",
    "name": "屏東地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TB",
    "name": "里港地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TC",
    "name": "潮州地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TD",
    "name": "東港地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TE",
    "name": "恆春地政事務所"
  },
  {
    "cityCode": "T",
    "code": "TF",
    "name": "枋寮地政事務所"
  },
  {
    "cityCode": "U",
    "code": "UA",
    "name": "花蓮地政事務所"
  },
  {
    "cityCode": "U",
    "code": "UB",
    "name": "鳳林地政事務所"
  },
  {
    "cityCode": "U",
    "code": "UC",
    "name": "玉里地政事務所"
  },
  {
    "cityCode": "V",
    "code": "VA",
    "name": "台東地政事務所"
  },
  {
    "cityCode": "V",
    "code": "VB",
    "name": "成功地政事務所"
  },
  {
    "cityCode": "V",
    "code": "VC",
    "name": "關山地政事務所"
  },
  {
    "cityCode": "V",
    "code": "VD",
    "name": "太麻里地政事務所"
  },
  {
    "cityCode": "W",
    "code": "WA",
    "name": "金門縣地政局"
  },
  {
    "cityCode": "X",
    "code": "XA",
    "name": "澎湖地政事務所"
  },
  {
    "cityCode": "Z",
    "code": "ZA",
    "name": "連江縣地政局"
  }
];

// ===== Helper =====
export function getCities() { return CITIES; }

export function getTownsByCity(cityCode) {
  if (!cityCode) return [];
  return TOWNS.filter(t => t.cityCode === cityCode);
}

export function getUnitsByCity(cityCode) {
  if (!cityCode) return [];
  return UNITS.filter(u => u.cityCode === cityCode);
}

export function getUnitByTown(cityCode, townCode) {
  const town = TOWNS.find(t => t.cityCode === cityCode && t.code === townCode);
  if (!town) return null;
  return UNITS.find(u => u.cityCode === cityCode && u.code === town.unitCode) || null;
}

export function getCityName(code) {
  const c = CITIES.find(x => x.code === code); return c ? c.name : "";
}

export function getTownName(cityCode, townCode) {
  const t = TOWNS.find(x => x.cityCode === cityCode && x.code === townCode);
  return t ? t.name : "";
}

export function getUnitName(cityCode, unitCode) {
  const u = UNITS.find(x => x.cityCode === cityCode && x.code === unitCode);
  return u ? u.name : "";
}
