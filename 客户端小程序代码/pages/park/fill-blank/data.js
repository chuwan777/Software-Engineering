// 转换后的JSON数据（已添加poem、blanks和difficulty字段）
module.exports = [
  // 简单难度（★☆☆☆☆）
  {
    "id": 1,
    "imageUrl": "http://127.0.0.1:3000/deal/d6ca7bcb0a46f21f0cc6e1e8fe246b600d33ae9f.webp",
    "title": "静夜思",
    "author": "李白",
    "rating": "★★☆☆☆",
    "content": "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
    "blankPositions": [1, 11],
    "correctAnswer": "明望",
    "poem": "床前___月光，疑是地上霜。举头___明月，低头思故乡。",
    "blanks": ["明", "望"],
    "difficulty": "easy"
  },
  {
    "id": 2,
    "imageUrl": "http://127.0.0.1:3000/deal/242dd42a2834349bd4a12e9bc1ea15ce36d3be0d.webp",
    "title": "春晓",
    "author": "孟浩然",
    "rating": "★☆☆☆☆",
    "content": "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
    "blankPositions": [3, 15],
    "correctAnswer": "觉风",
    "poem": "春眠不___晓，处处闻啼鸟。夜来___雨声，花落知多少。",
    "blanks": ["觉", "风"],
    "difficulty": "easy"
  },
  {
    "id": 5,
    "imageUrl": "http://127.0.0.1:3000/deal/R-C.jpg",
    "title": "咏鹅",
    "author": "骆宾王",
    "rating": "★☆☆☆☆",
    "content": "鹅，鹅，鹅，曲项向天歌。白毛浮绿水，红掌拨清波。",
    "blankPositions": [4, 10],
    "correctAnswer": "项浮",
    "poem": "鹅，鹅，鹅，曲___向天歌。白毛___绿水，红掌拨清波。",
    "blanks": ["项", "浮"],
    "difficulty": "easy"
  },
  {
    "id": 7,
    "imageUrl": "http://127.0.0.1:3000/deal/OIP-C (1).webp",
    "title": "登鹳雀楼",
    "author": "王之涣",
    "rating": "★★☆☆☆",
    "content": "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
    "blankPositions": [1, 13],
    "correctAnswer": "日穷",
    "poem": "白___依山尽，黄河入海流。欲___千里目，更上一层楼。",
    "blanks": ["日", "穷"],
    "difficulty": "easy"
  },
  {
    "id": 8,
    "imageUrl": "http://127.0.0.1:3000/deal/R-C (2).jpg",
    "title": "相思",
    "author": "王维",
    "rating": "★★☆☆☆",
    "content": "红豆生南国，春来发几枝。愿君多采撷，此物最相思。",
    "blankPositions": [3, 15],
    "correctAnswer": "豆采",
    "poem": "红___生南国，春来发几枝。愿君多___撷，此物最相思。",
    "blanks": ["豆", "采"],
    "difficulty": "easy"
  },

  // 中等难度（★★★☆☆）
  {
    "id": 3,
    "imageUrl": "http://127.0.0.1:3000/deal/view.jpg",
    "title": "望庐山瀑布",
    "author": "李白",
    "rating": "★★★☆☆",
    "content": "日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。",
    "blankPositions": [7, 25],
    "correctAnswer": "烟流",
    "poem": "日照香炉生紫___，遥看瀑布挂前川。飞___直下三千尺，疑是银河落九天。",
    "blanks": ["烟", "流"],
    "difficulty": "medium"
  },
  {
    "id": 4,
    "imageUrl": "http://127.0.0.1:3000/deal/OIP-C.webp",
    "title": "元日",
    "author": "王安石",
    "rating": "★★☆☆☆",
    "content": "爆竹声中一岁除，春风送暖入屠苏。千门万户曈曈日，总把新桃换旧符。",
    "blankPositions": [5, 21],
    "correctAnswer": "岁曈",
    "poem": "爆竹声中一___除，春风送暖入屠苏。千门万户___曈日，总把新桃换旧符。",
    "blanks": ["岁", "曈"],
    "difficulty": "medium"
  },
  {
    "id": 6,
    "imageUrl": "http://127.0.0.1:3000/deal/R-C (1).jpg",
    "title": "江雪",
    "author": "柳宗元",
    "rating": "★★★☆☆",
    "content": "千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。",
    "blankPositions": [3, 11],
    "correctAnswer": "鸟蓑",
    "poem": "千山___飞绝，万径人踪灭。孤舟___笠翁，独钓寒江雪。",
    "blanks": ["鸟", "蓑"],
    "difficulty": "medium"
  },
  {
    "id": 9,
    "imageUrl": "http://127.0.0.1:3000/deal/R-C (3).jpg",
    "title": "小池",
    "author": "杨万里",
    "rating": "★★☆☆☆",
    "content": "泉眼无声惜细流，树阴照水爱晴柔。小荷才露尖尖角，早有蜻蜓立上头。",
    "blankPositions": [7, 25],
    "correctAnswer": "惜尖",
    "poem": "泉眼无声___细流，树阴照水爱晴柔。小荷才露___尖角，早有蜻蜓立上头。",
    "blanks": ["惜", "尖"],
    "difficulty": "medium"
  },
  {
    "id": 10,
    "imageUrl": "http://127.0.0.1:3000/deal/R-C (4).jpg",
    "title": "村居",
    "author": "高鼎",
    "rating": "★★☆☆☆",
    "content": "草长莺飞二月天，拂堤杨柳醉春烟。儿童散学归来早，忙趁东风放纸鸢。",
    "blankPositions": [3, 19],
    "correctAnswer": "莺杨",
    "poem": "草长___飞二月天，拂堤___柳醉春烟。儿童散学归来早，忙趁东风放纸鸢。",
    "blanks": ["莺", "杨"],
    "difficulty": "medium"
  },

  // 新增题目 - 中等难度
  {
    "id": 11,
    "imageUrl": "",
    "title": "悯农（其一）",
    "author": "李绅",
    "rating": "★★☆☆☆",
    "content": "春种一粒粟，秋收万颗子。四海无闲田，农夫犹饿死。",
    "blankPositions": [3, 15],
    "correctAnswer": "粒犹",
    "poem": "春种一___粟，秋收万颗子。四海无闲田，农夫___饿死。",
    "blanks": ["粒", "犹"],
    "difficulty": "medium"
  },
  {
    "id": 12,
    "imageUrl": "",
    "title": "悯农（其二）",
    "author": "李绅",
    "rating": "★★☆☆☆",
    "content": "锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。",
    "blankPositions": [3, 17],
    "correctAnswer": "锄餐",
    "poem": "___禾日当午，汗滴禾下土。谁知盘中___，粒粒皆辛苦。",
    "blanks": ["锄", "餐"],
    "difficulty": "medium"
  },

  // 困难难度（★★★★☆）
  {
    "id": 13,
    "imageUrl": "",
    "title": "送元二使安西",
    "author": "王维",
    "rating": "★★★★☆",
    "content": "渭城朝雨浥轻尘，客舍青青柳色新。劝君更尽一杯酒，西出阳关无故人。",
    "blankPositions": [5, 25],
    "correctAnswer": "浥尽",
    "poem": "渭城朝雨___轻尘，客舍青青柳色新。劝君更___一杯酒，西出阳关无故人。",
    "blanks": ["浥", "尽"],
    "difficulty": "hard"
  },
  {
    "id": 14,
    "imageUrl": "",
    "title": "九月九日忆山东兄弟",
    "author": "王维",
    "rating": "★★★★☆",
    "content": "独在异乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍插茱萸少一人。",
    "blankPositions": [7, 25],
    "correctAnswer": "异插",
    "poem": "独在___乡为异客，每逢佳节倍思亲。遥知兄弟登高处，遍___茱萸少一人。",
    "blanks": ["异", "插"],
    "difficulty": "hard"
  },
  {
    "id": 15,
    "imageUrl": "",
    "title": "赋得古原草送别",
    "author": "白居易",
    "rating": "★★★★☆",
    "content": "离离原上草，一岁一枯荣。野火烧不尽，春风吹又生。",
    "blankPositions": [1, 13],
    "correctAnswer": "离尽",
    "poem": "___离原上草，一岁一枯荣。野火___不尽，春风吹又生。",
    "blanks": ["离", "烧"],
    "difficulty": "hard"
  }
]
