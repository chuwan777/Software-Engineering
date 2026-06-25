// 通用游戏数据管理文件
// 包含所有游戏的诗句数据和配置信息

// 诗句数据 - 按作者和标题组织
const poemData = {
  // 李白
  "李白": {
    "静夜思": {
      content: "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
      verses: ["床前明月光", "疑是地上霜", "举头望明月", "低头思故乡"],
      difficulty: "easy"
    },
    "望庐山瀑布": {
      content: "日照香炉生紫烟，遥看瀑布挂前川。飞流直下三千尺，疑是银河落九天。",
      verses: ["日照香炉生紫烟", "遥看瀑布挂前川", "飞流直下三千尺", "疑是银河落九天"],
      difficulty: "medium"
    }
  },
  
  // 王之涣
  "王之涣": {
    "登鹳雀楼": {
      content: "白日依山尽，黄河入海流。欲穷千里目，更上一层楼。",
      verses: ["白日依山尽", "黄河入海流", "欲穷千里目", "更上一层楼"],
      difficulty: "easy"
    }
  },
  
  // 孟浩然
  "孟浩然": {
    "春晓": {
      content: "春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。",
      verses: ["春眠不觉晓", "处处闻啼鸟", "夜来风雨声", "花落知多少"],
      difficulty: "easy"
    }
  },
  
  // 杜甫
  "杜甫": {
    "春夜喜雨": {
      content: "好雨知时节，当春乃发生。随风潜入夜，润物细无声。",
      verses: ["好雨知时节", "当春乃发生", "随风潜入夜", "润物细无声"],
      difficulty: "medium"
    },
    "绝句": {
      content: "两个黄鹂鸣翠柳，一行白鹭上青天。窗含西岭千秋雪，门泊东吴万里船。",
      verses: ["两个黄鹂鸣翠柳", "一行白鹭上青天", "窗含西岭千秋雪", "门泊东吴万里船"],
      difficulty: "hard"
    }
  },
  
  // 王维
  "王维": {
    "鹿柴": {
      content: "空山不见人，但闻人语响。返景入深林，复照青苔上。",
      verses: ["空山不见人", "但闻人语响", "返景入深林", "复照青苔上"],
      difficulty: "medium"
    },
    "相思": {
      content: "红豆生南国，春来发几枝。愿君多采撷，此物最相思。",
      verses: ["红豆生南国", "春来发几枝", "愿君多采撷", "此物最相思"],
      difficulty: "easy"
    }
  }
};

// 诗词填空游戏数据
const fillBlankData = {
  // 按难度分级的填空题
  easy: [
    {
      id: 1,
      poem: "床前明月光",
      author: "李白",
      title: "静夜思",
      blanks: ["明"],
      blankIndices: [2],
      hint: "表示夜晚的天体",
      difficulty: "easy"
    },
    {
      id: 2,
      poem: "疑是地上霜",
      author: "李白",
      title: "静夜思",
      blanks: ["霜"],
      blankIndices: [3],
      hint: "一种天气现象后的产物",
      difficulty: "easy"
    },
    {
      id: 3,
      poem: "举头望明月",
      author: "李白",
      title: "静夜思",
      blanks: ["望"],
      blankIndices: [2],
      hint: "与'低'相反",
      difficulty: "easy"
    },
    {
      id: 4,
      poem: "低头思故乡",
      author: "李白",
      title: "静夜思",
      blanks: ["乡"],
      blankIndices: [4],
      hint: "出生或长期居住的地方",
      difficulty: "easy"
    },
    {
      id: 5,
      poem: "春眠不觉晓",
      author: "孟浩然",
      title: "春晓",
      blanks: ["春"],
      blankIndices: [0],
      hint: "一年的第一季",
      difficulty: "easy"
    },
    {
      id: 6,
      poem: "处处闻啼鸟",
      author: "孟浩然",
      title: "春晓",
      blanks: ["鸟"],
      blankIndices: [3],
      hint: "一种会飞的动物",
      difficulty: "easy"
    }
  ],
  
  medium: [
    {
      id: 7,
      poem: "白日依山尽",
      author: "王之涣",
      title: "登鹳雀楼",
      blanks: ["白", "尽"],
      blankIndices: [0, 3],
      hint: "太阳的颜色，完尽",
      difficulty: "medium"
    },
    {
      id: 8,
      poem: "黄河入海流",
      author: "王之涣",
      title: "登鹳雀楼",
      blanks: ["河", "流"],
      blankIndices: [1, 4],
      hint: "中国第二长河，流动",
      difficulty: "medium"
    },
    {
      id: 9,
      poem: "欲穷千里目",
      author: "王之涣",
      title: "登鹳雀楼",
      blanks: ["穷", "里"],
      blankIndices: [1, 3],
      hint: "穷尽，距离单位",
      difficulty: "medium"
    }
  ],
  
  hard: [
    {
      id: 10,
      poem: "日照香炉生紫烟",
      author: "李白",
      title: "望庐山瀑布",
      blanks: ["照", "生", "烟"],
      blankIndices: [1, 3, 5],
      hint: "照射，产生，烟雾",
      difficulty: "hard"
    },
    {
      id: 11,
      poem: "遥看瀑布挂前川",
      author: "李白",
      title: "望庐山瀑布",
      blanks: ["看", "川"],
      blankIndices: [1, 5],
      hint: "远远地，河流",
      difficulty: "hard"
    }
  ]
};

// 意象配对游戏数据
const imageMatchingData = [
  {
    id: 1,
    poem: "床前明月光，疑是地上霜。",
    author: "李白",
    title: "静夜思",
    imagePairs: [
      { type: "poem", content: "床前", meaning: "卧室的床前" },
      { type: "poem", content: "明月", meaning: "明亮的月亮" },
      { type: "poem", content: "地上", meaning: "地面上" },
      { type: "poem", content: "霜", meaning: "夜晚地面上的白色结晶" },
      { type: "meaning", content: "卧室窗边", matching: "床前" },
      { type: "meaning", content: "明亮的月色", matching: "明月" },
      { type: "meaning", content: "寒冷的地面", matching: "地上" },
      { type: "meaning", content: "白色的冰晶", matching: "霜" }
    ],
    correctPairs: ["床前-卧室窗边", "明月-明亮的月色", "地上-寒冷的地面", "霜-白色的冰晶"]
  },
  {
    id: 2,
    poem: "春眠不觉晓，处处闻啼鸟。",
    author: "孟浩然",
    title: "春晓",
    imagePairs: [
      { type: "poem", content: "春眠", meaning: "春天的睡眠" },
      { type: "poem", content: "不觉", meaning: "没有察觉" },
      { type: "poem", content: "晓", meaning: "天亮" },
      { type: "poem", content: "啼鸟", meaning: "鸣叫的鸟儿" },
      { type: "meaning", content: "春天熟睡", matching: "春眠" },
      { type: "meaning", content: "没有醒来", matching: "不觉" },
      { type: "meaning", content: "早晨时分", matching: "晓" },
      { type: "meaning", content: "鸟儿歌唱", matching: "啼鸟" }
    ],
    correctPairs: ["春眠-春天熟睡", "不觉-没有醒来", "晓-早晨时分", "啼鸟-鸟儿歌唱"]
  }
];

// 连字成诗游戏数据
const connectWordsData = [
  {
    correctPoem: "床前明月光",
    shuffledWords: ["明", "月", "光", "床", "前"],
    author: "李白",
    title: "静夜思"
  },
  {
    correctPoem: "疑是地上霜",
    shuffledWords: ["疑", "是", "地", "上", "霜"],
    author: "李白",
    title: "静夜思"
  },
  {
    correctPoem: "举头望明月",
    shuffledWords: ["举", "头", "望", "明", "月"],
    author: "李白",
    title: "静夜思"
  },
  {
    correctPoem: "低头思故乡",
    shuffledWords: ["低", "头", "思", "故", "乡"],
    author: "李白",
    title: "静夜思"
  },
  {
    correctPoem: "白日依山尽",
    shuffledWords: ["白", "日", "依", "山", "尽"],
    author: "王之涣",
    title: "登鹳雀楼"
  },
  {
    correctPoem: "黄河入海流",
    shuffledWords: ["黄", "河", "入", "海", "流"],
    author: "王之涣",
    title: "登鹳雀楼"
  },
  {
    correctPoem: "欲穷千里目",
    shuffledWords: ["欲", "穷", "千", "里", "目"],
    author: "王之涣",
    title: "登鹳雀楼"
  },
  {
    correctPoem: "更上一层楼",
    shuffledWords: ["更", "上", "一", "层", "楼"],
    author: "王之涣",
    title: "登鹳雀楼"
  },
  {
    correctPoem: "春眠不觉晓",
    shuffledWords: ["春", "眠", "不", "觉", "晓"],
    author: "孟浩然",
    title: "春晓"
  },
  {
    correctPoem: "处处闻啼鸟",
    shuffledWords: ["处", "处", "闻", "啼", "鸟"],
    author: "孟浩然",
    title: "春晓"
  },
  {
    correctPoem: "夜来风雨声",
    shuffledWords: ["夜", "来", "风", "雨", "声"],
    author: "孟浩然",
    title: "春晓"
  },
  {
    correctPoem: "花落知多少",
    shuffledWords: ["花", "落", "知", "多", "少"],
    author: "孟浩然",
    title: "春晓"
  }
];

// 游戏配置
const gameConfig = {
  // 诗词填空游戏配置
  fillBlank: {
    maxAttempts: 3,           // 每道题最大尝试次数
    hintCooldown: 5,          // 提示冷却时间（秒）
    difficultyLevels: {
      easy: { baseScore: 100, timeLimit: 30 },
      medium: { baseScore: 200, timeLimit: 45 },
      hard: { baseScore: 300, timeLimit: 60 }
    }
  },
  
  // 意象配对游戏配置
  imageMatching: {
    maxRounds: 3,             // 游戏回合数
    baseScore: 100,           // 基础分数
    timeBonus: 20,            // 时间奖励系数
    accuracyBonus: 30,        // 准确率奖励系数
    maxHints: 2               // 每回合最大提示次数
  },
  
  // 连字成诗游戏配置
  connectWords: {
    baseScore: 100,           // 基础分数
    timePenalty: 1,           // 每秒扣分数
    hintPenalty: 20,          // 提示扣分数
    maxHints: 2,              // 最大提示次数
    consecutiveBonus: 10      // 连续答对奖励分数
  }
};

// 工具函数
const utils = {
  // 随机打乱数组
  shuffleArray: function(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },
  
  // 获取指定难度的题目
  getQuestionsByDifficulty: function(data, difficulty) {
    return data[difficulty] || [];
  },
  
  // 随机获取一道题目
  getRandomQuestion: function(data, difficulty = null) {
    let questions;
    if (difficulty) {
      questions = data[difficulty];
    } else {
      // 合并所有难度的题目
      questions = Object.values(data).flat();
    }
    return questions[Math.floor(Math.random() * questions.length)];
  }
};

// 导出数据和工具
module.exports = {
  poemData,
  fillBlankData,
  imageMatchingData,
  connectWordsData,
  gameConfig,
  utils
};
