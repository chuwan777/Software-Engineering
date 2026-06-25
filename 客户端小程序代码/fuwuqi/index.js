// 导入依赖模块
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // 解决跨域问题

// 创建Express实例
const app = express();

// 配置中间件（整合两个文件的中间件配置）
app.use(cors()); // 允许跨域请求
app.use(bodyParser.json()); // 处理JSON请求体
app.use(express.static(path.join(__dirname, 'public')));

// 确保data目录存在（用户信息存储目录）
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 读取分页数据文件（data.json）
let data = [];
try {
  const jsonStr = fs.readFileSync('./data.json', { encoding: 'utf8' });
  data = JSON.parse(jsonStr);
} catch (error) {
  console.warn('data.json文件不存在或解析失败，分页接口将返回空数据');
  data = [];
}

// 读取古诗数据文件（poems.json）
let poemsData = [];
try {
  const poemsFilePath = path.join(__dirname, 'data', 'poems.json');
  const poemsJsonStr = fs.readFileSync(poemsFilePath, { encoding: 'utf8' });
  poemsData = JSON.parse(poemsJsonStr).data || [];
} catch (error) {
  console.warn('poems.json文件不存在或解析失败，古诗接口将返回空数据', error.message);
  poemsData = [];
}

// 读取用户诗歌数据文件（user-poems.json）
let userPoemsData = [];
const userPoemsFilePath = path.join(__dirname, 'data', 'user-poems.json');

try {
  const userPoemsJsonStr = fs.readFileSync(userPoemsFilePath, { encoding: 'utf8' });
  userPoemsData = JSON.parse(userPoemsJsonStr).data || [];
} catch (error) {
  console.warn('user-poems.json文件不存在或解析失败，将使用默认数据', error.message);
  // 默认诗歌分类
  userPoemsData = [];
}

// 读取用户数据文件（users.json）
let usersData = [];
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// 读取用户数据
function readUsersData() {
  try {
    const usersJsonStr = fs.readFileSync(usersFilePath, { encoding: 'utf8' });
    usersData = JSON.parse(usersJsonStr).data || [];
  } catch (error) {
    console.warn('users.json文件不存在或解析失败，将创建新的用户数据文件', error.message);
    usersData = [];
    writeUsersData(); // 创建空的用户数据文件
  }
}

// 保存用户数据
function writeUsersData() {
  try {
    const usersJsonStr = JSON.stringify({ data: usersData }, null, 2);
    fs.writeFileSync(usersFilePath, usersJsonStr, { encoding: 'utf8' });
  } catch (error) {
    console.error('保存用户数据失败', error.message);
  }
}

// 初始化读取用户数据
readUsersData();

// 添加用户数据示例（如果需要）
if (usersData.length === 0) {
  // 可以在这里添加初始测试用户
  writeUsersData();
}

// 默认诗歌分类
const defaultCategories = [
    { id: 1, name: '唐诗' },
    { id: 2, name: '宋词' },
    { id: 3, name: '元曲' },
    { id: 4, name: '现代诗' },
    { id: 5, name: '其他' }
  ];
  
  // 默认诗歌数据
  userPoemsData = [
    {
      id: 1,
      title: '春夜喜雨',
      content: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。',
      category: '唐诗',
      tags: ['春雨', '春天'],
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      title: '静夜思',
      content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
      category: '唐诗',
      tags: ['月亮', '思乡'],
      createdAt: '2024-01-16T14:20:00Z'
    }
  ];
  
  // 保存默认数据到文件
  fs.writeFileSync(userPoemsFilePath, JSON.stringify({ data: userPoemsData }));

// 诗歌分类数据
const poemCategories = [
  { id: 1, name: '唐诗' },
  { id: 2, name: '宋词' },
  { id: 3, name: '元曲' },
  { id: 4, name: '现代诗' },
  { id: 5, name: '其他' }
];

// ==================== 认证中间件 ====================
// 认证中间件
const authenticate = (req, res, next) => {
  // 从请求头获取令牌
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  
  // 验证令牌是否存在
  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问，请先登录' });
  }
  
  // 验证令牌格式（匹配登录接口生成的令牌格式）
  const tokenPattern = /^mock_jwt_token_(wechat_)?\d+_\d+$/;
  if (!tokenPattern.test(token)) {
    return res.status(401).json({ success: false, message: '无效的令牌' });
  }
  
  // 检查令牌是否为有效格式
  // 实际项目中应该解析并验证JWT令牌的签名、过期时间等
  // 这里为了演示，只验证令牌格式和生成时间
  const tokenParts = token.split('_');
  
  if (tokenParts.length < 5) {
    return res.status(401).json({ success: false, message: '无效的令牌' });
  }
  
  // 从令牌中获取用户ID和时间戳
  let userIdIndex;
  if (tokenParts[3] === 'wechat') {
    // 微信令牌格式: mock_jwt_token_wechat_userId_timestamp
    userIdIndex = 4;
  } else {
    // 普通令牌格式: mock_jwt_token_userId_timestamp
    userIdIndex = 3;
  }
  
  const userId = parseInt(tokenParts[userIdIndex]);
  const timestampStr = tokenParts[tokenParts.length - 1];
  const timestamp = parseInt(timestampStr);
  
  if (isNaN(timestamp) || isNaN(userId)) {
    return res.status(401).json({ success: false, message: '无效的令牌' });
  }
  
  // 检查令牌是否过期（7天有效期）
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (now - timestamp > sevenDays) {
    return res.status(401).json({ success: false, message: '令牌已过期，请重新登录' });
  }
  
  // 设置用户ID
  req.userId = userId;
  
  // 认证通过，继续处理请求
  next();
};

// ==================== 原有接口 ====================

// 1. 分页数据接口
app.get('/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  // 使用 slice() 代替 splice()，避免修改原数组
  const pageData = data.slice(start, end);
  
  res.setHeader('X-Total-Count', data.length);
  res.send(pageData);
});

// 2. 古诗数据接口
app.get('/api/poems', (req, res) => {
  try {
    // 获取查询参数
    const { page = 1, pageSize = 10, dynasty, category, search } = req.query;
    
    // 筛选数据
    let filteredPoems = [...poemsData];
    
    // 按朝代筛选
    if (dynasty) {
      filteredPoems = filteredPoems.filter(poem => poem.dynasty === dynasty);
    }
    
    // 按分类筛选
    if (category) {
      filteredPoems = filteredPoems.filter(poem => poem.category === category);
    }
    
    // 按关键词搜索
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPoems = filteredPoems.filter(poem => 
        poem.title.toLowerCase().includes(searchLower) ||
        poem.author.toLowerCase().includes(searchLower) ||
        poem.content.toLowerCase().includes(searchLower)
      );
    }
    
    // 分页处理
    const total = filteredPoems.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedPoems = filteredPoems.slice(start, start + parseInt(pageSize));
    
    // 返回结果
    res.json({
      success: true,
      data: {
        list: paginatedPoems,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: '获取古诗数据成功'
    });
  } catch (error) {
    console.error('获取古诗数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取古诗数据失败',
      error: error.message
    });
  }
});

// 4. 古诗分类接口
app.get('/api/poems/categories', (req, res) => {
  try {
    // 获取所有分类
    const categories = [...new Set(poemsData.map(poem => poem.category))];
    
    // 获取所有朝代
    const dynasties = [...new Set(poemsData.map(poem => poem.dynasty))];
    
    res.json({
      success: true,
      data: {
        categories,
        dynasties
      },
      message: '获取古诗分类成功'
    });
  } catch (error) {
    console.error('获取古诗分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取古诗分类失败',
      error: error.message
    });
  }
});

// 5. 首页推荐古诗接口（前10首）
app.get('/api/poems/recommend', (req, res) => {
  try {
    const recommendPoems = poemsData.slice(0, 10);
    
    res.json({
      success: true,
      data: recommendPoems,
      message: '获取推荐古诗成功'
    });
  } catch (error) {
    console.error('获取推荐古诗失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐古诗失败',
      error: error.message
    });
  }
});

// 3. 获取用户学习历史接口 - 需要认证
app.get('/api/poems/history', authenticate, (req, res) => {
  const userId = req.userId;
  const userProgress = getUserLearningProgress(userId);
  
  // 获取学习过的诗歌详情
  const learnedPoems = userProgress.learnedPoems.map(poemId => {
    const poem = poemsData.find(p => p.id === poemId);
    return poem ? {
      id: poem.id,
      title: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      date: new Date().toISOString().split('T')[0] // 模拟学习日期
    } : null;
  }).filter(poem => poem !== null);
  
  res.json({
    success: true,
    data: learnedPoems
  });
});

// 4. 古诗详情接口
app.get('/api/poems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const poem = poemsData.find(p => p.id === parseInt(id));
    
    if (poem) {
      res.json({
        success: true,
        data: poem,
        message: '获取古诗详情成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '古诗不存在'
      });
    }
  } catch (error) {
    console.error('获取古诗详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取古诗详情失败',
      error: error.message
    });
  }
});

// ==================== 我的诗库相关接口 ====================

// 1. 获取诗歌分类
app.get('/api/poem-categories', (req, res) => {
  try {
    res.json({
      success: true,
      data: poemCategories,
      message: '获取诗歌分类成功'
    });
  } catch (error) {
    console.error('获取诗歌分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗歌分类失败',
      error: error.message
    });
  }
});

// 2. 获取用户诗歌列表
app.get('/api/my-poems', (req, res) => {
  try {
    // 获取查询参数
    const { page = 1, pageSize = 10, category, search } = req.query;
    
    // 筛选数据
    let filteredPoems = [...userPoemsData];
    
    // 按分类筛选
    if (category) {
      filteredPoems = filteredPoems.filter(poem => poem.category === category);
    }
    
    // 按关键词搜索
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPoems = filteredPoems.filter(poem => 
        poem.title.toLowerCase().includes(searchLower) ||
        poem.content.toLowerCase().includes(searchLower)
      );
    }
    
    // 分页处理
    const total = filteredPoems.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedPoems = filteredPoems.slice(start, start + parseInt(pageSize));
    
    // 返回结果
    res.json({
      success: true,
      data: {
        list: paginatedPoems,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: '获取诗歌列表成功'
    });
  } catch (error) {
    console.error('获取诗歌列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗歌列表失败',
      error: error.message
    });
  }
});

// 3. 获取诗歌详情
app.get('/api/my-poems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const poem = userPoemsData.find(p => p.id === parseInt(id));
    
    if (poem) {
      res.json({
        success: true,
        data: poem,
        message: '获取诗歌详情成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '诗歌不存在'
      });
    }
  } catch (error) {
    console.error('获取诗歌详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取诗歌详情失败',
      error: error.message
    });
  }
});

// 4. 添加诗歌
app.post('/api/my-poems', (req, res) => {
  try {
    const { title, content, category, tags = [] } = req.body;
    
    // 导入安全工具
    const { sanitizeInput } = require('./utils/security');
    
    // 过滤输入
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);
    const sanitizedCategory = sanitizeInput(category);
    const sanitizedTags = sanitizeInput(tags);
    
    // 验证参数
    if (!sanitizedTitle || !sanitizedContent || !sanitizedCategory) {
      return res.status(400).json({
        success: false,
        message: '标题、内容和分类不能为空'
      });
    }
    
    // 验证标题长度
    if (sanitizedTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: '标题长度不能超过100个字符'
      });
    }
    
    // 验证内容长度
    if (sanitizedContent.length > 2000) {
      return res.status(400).json({
        success: false,
        message: '内容长度不能超过2000个字符'
      });
    }
    
    // 验证标签数量
    if (Array.isArray(sanitizedTags) && sanitizedTags.length > 10) {
      return res.status(400).json({
        success: false,
        message: '标签数量不能超过10个'
      });
    }
    
    // 生成新诗歌ID
    const maxId = userPoemsData.length > 0 ? Math.max(...userPoemsData.map(p => p.id)) : 0;
    const newPoem = {
      id: maxId + 1,
      title: sanitizedTitle,
      content: sanitizedContent,
      category: sanitizedCategory,
      tags: Array.isArray(sanitizedTags) ? sanitizedTags : [sanitizedTags],
      createdAt: new Date().toISOString()
    };
    
    // 添加到数组
    userPoemsData.push(newPoem);
    
    // 保存到文件
    fs.writeFileSync(userPoemsFilePath, JSON.stringify({ data: userPoemsData }));
    
    res.json({
      success: true,
      data: newPoem,
      message: '添加诗歌成功'
    });
  } catch (error) {
    console.error('添加诗歌失败:', error);
    res.status(500).json({
      success: false,
      message: '添加诗歌失败',
      error: error.message
    });
  }
});

// 5. 编辑诗歌
app.put('/api/my-poems/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags = [] } = req.body;
    
    // 验证ID
    const poemId = parseInt(id);
    if (isNaN(poemId)) {
      return res.status(400).json({
        success: false,
        message: '诗歌ID无效'
      });
    }
    
    // 导入安全工具
    const { sanitizeInput } = require('./utils/security');
    
    // 过滤输入
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedContent = sanitizeInput(content);
    const sanitizedCategory = sanitizeInput(category);
    const sanitizedTags = sanitizeInput(tags);
    
    // 验证参数
    if (!sanitizedTitle || !sanitizedContent || !sanitizedCategory) {
      return res.status(400).json({
        success: false,
        message: '标题、内容和分类不能为空'
      });
    }
    
    // 验证标题长度
    if (sanitizedTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: '标题长度不能超过100个字符'
      });
    }
    
    // 验证内容长度
    if (sanitizedContent.length > 2000) {
      return res.status(400).json({
        success: false,
        message: '内容长度不能超过2000个字符'
      });
    }
    
    // 验证标签数量
    if (Array.isArray(sanitizedTags) && sanitizedTags.length > 10) {
      return res.status(400).json({
        success: false,
        message: '标签数量不能超过10个'
      });
    }
    
    // 查找诗歌
    const poemIndex = userPoemsData.findIndex(p => p.id === poemId);
    
    if (poemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '诗歌不存在'
      });
    }
    
    // 更新诗歌
    const updatedPoem = {
      ...userPoemsData[poemIndex],
      title: sanitizedTitle,
      content: sanitizedContent,
      category: sanitizedCategory,
      tags: Array.isArray(sanitizedTags) ? sanitizedTags : [sanitizedTags]
    };
    
    userPoemsData[poemIndex] = updatedPoem;
    
    // 保存到文件
    fs.writeFileSync(userPoemsFilePath, JSON.stringify({ data: userPoemsData }));
    
    res.json({
      success: true,
      data: updatedPoem,
      message: '编辑诗歌成功'
    });
  } catch (error) {
    console.error('编辑诗歌失败:', error);
    res.status(500).json({
      success: false,
      message: '编辑诗歌失败',
      error: error.message
    });
  }
});

// 6. 删除诗歌
app.delete('/api/my-poems/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证ID
    const poemId = parseInt(id);
    if (isNaN(poemId)) {
      return res.status(400).json({
        success: false,
        message: '诗歌ID无效'
      });
    }
    
    // 查找诗歌
    const poemIndex = userPoemsData.findIndex(p => p.id === poemId);
    
    if (poemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '诗歌不存在'
      });
    }
    
    // 删除诗歌
    userPoemsData.splice(poemIndex, 1);
    
    // 保存到文件
    fs.writeFileSync(userPoemsFilePath, JSON.stringify({ data: userPoemsData }));
    
    res.json({
      success: true,
      message: '删除诗歌成功'
    });
  } catch (error) {
    console.error('删除诗歌失败:', error);
    res.status(500).json({
      success: false,
      message: '删除诗歌失败',
      error: error.message
    });
  }
});

// ==================== 原有接口 ====================

// 2. 用户信息接口
// 辅助函数：获取用户学习进度
function getUserLearningProgress(userId) {
  const learningProgressPath = path.join(dataDir, 'user-learning-progress.json');
  let learningProgressData = { data: [] };
  
  try {
    const data = fs.readFileSync(learningProgressPath, 'utf8');
    learningProgressData = JSON.parse(data);
  } catch (error) {
    console.error('读取学习进度文件失败:', error);
  }
  
  let userProgress = learningProgressData.data.find(p => p.userId === userId);
  
  if (!userProgress) {
    userProgress = {
      userId: userId,
      learnedPoems: [],
      masteryRate: 0,
      streakDays: 0,
      lastLearnDate: null,
      totalPoems: 0
    };
    learningProgressData.data.push(userProgress);
    fs.writeFileSync(learningProgressPath, JSON.stringify(learningProgressData, null, 2));
  }
  
  return userProgress;
}

// 辅助函数：更新用户学习进度
function updateUserLearningProgress(userId, poemId) {
  const learningProgressPath = path.join(dataDir, 'user-learning-progress.json');
  let learningProgressData = { data: [] };
  
  try {
    const data = fs.readFileSync(learningProgressPath, 'utf8');
    learningProgressData = JSON.parse(data);
  } catch (error) {
    console.error('读取学习进度文件失败:', error);
  }
  
  let userProgress = learningProgressData.data.find(p => p.userId === userId);
  
  if (!userProgress) {
    userProgress = {
      userId: userId,
      learnedPoems: [poemId],
      masteryRate: 0,
      streakDays: 0,
      lastLearnDate: null,
      totalPoems: 0
    };
    learningProgressData.data.push(userProgress);
  } else {
    // 如果已经学习过这首诗，不重复添加
    if (!userProgress.learnedPoems.includes(poemId)) {
      userProgress.learnedPoems.push(poemId);
    }
  }
  
  // 更新学习进度统计
  const totalPoems = data.length; // 使用全局data变量获取总诗数
  userProgress.totalPoems = totalPoems;
  userProgress.masteryRate = totalPoems > 0 ? Math.round((userProgress.learnedPoems.length / totalPoems) * 100) : 0;
  
  // 更新连续学习天数
  const today = new Date().toISOString().split('T')[0];
  if (userProgress.lastLearnDate === today) {
    // 今天已经学习过了，不增加连续天数
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (userProgress.lastLearnDate === yesterdayStr) {
      // 昨天学习过，连续天数+1
      userProgress.streakDays += 1;
    } else if (userProgress.lastLearnDate) {
      // 断更了，重置连续天数
      userProgress.streakDays = 1;
    } else {
      // 第一次学习
      userProgress.streakDays = 1;
    }
    
    // 更新最后学习日期
    userProgress.lastLearnDate = today;
  }
  
  // 保存更新后的学习进度
  fs.writeFileSync(learningProgressPath, JSON.stringify(learningProgressData, null, 2));
  
  return userProgress;
}

// 标记学习完成的API
app.post('/api/learn/complete', authenticate, (req, res) => {
  try {
    const userId = req.userId;
    const { poemId } = req.body;
    
    if (!poemId) {
      return res.status(400).json({
        success: false,
        message: '缺少诗歌ID'
      });
    }
    
    // 更新学习进度
    const updatedProgress = updateUserLearningProgress(userId, poemId);
    
    res.json({
      success: true,
      message: '学习进度更新成功',
      data: updatedProgress
    });
  } catch (error) {
    console.error('更新学习进度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新学习进度失败',
      error: error.message
    });
  }
});

// 获取用户信息 (原接口) - 需要认证
app.get('/api/profile', authenticate, (req, res) => {
  const userId = req.userId;
  // 获取用户对应的配置文件
  const filePath = path.join(dataDir, `profile_${userId}.json`);
  fs.readFile(filePath, 'utf8', (error, data) => {
    res.setHeader("Content-Type", "application/json;charset=utf-8");
    let profileData = {};
    
    if (error) {
      // 返回默认用户信息
      // 查找用户基本信息
      const user = usersData.find(u => u.id === userId);
      profileData = {
        name: user ? user.nickname : "用户",
        gender: [{ name: "小男孩", value: "0", checked: true }],
        skills: [{ name: "唐诗", value: "tang", checked: true }]
      };
    } else {
      try {
        profileData = JSON.parse(data);
      } catch (parseError) {
        // 查找用户基本信息
        const user = usersData.find(u => u.id === userId);
        profileData = {
          name: user ? user.nickname : "用户",
          gender: [{ name: "小男孩", value: "0", checked: true }],
          skills: [{ name: "唐诗", value: "tang", checked: true }]
        };
      }
    }
    
    // 获取真实的学习进度数据
    const userProgress = getUserLearningProgress(userId);
    
    // 计算用户徽章
    const masteryRate = userProgress.masteryRate;
    const learnedPoems = userProgress.learnedPoems.length;
    const streakDays = userProgress.streakDays;
    const totalPoems = userProgress.totalPoems;
    
    // 生成与 /api/user/badges 接口一致的徽章数据
    const availableBadges = [
      {
        name: "启蒙学者",
        description: "完成你的第一首古诗学习",
        icon: "🥇",
        earned: learnedPoems >= 1
      },
      {
        name: "诗词爱好者",
        description: "学习进度达到33%",
        icon: "📚",
        earned: masteryRate >= 33
      },
      {
        name: "诗词达人",
        description: "学习进度达到66%",
        icon: "🎤",
        earned: masteryRate >= 66
      },
      {
        name: "诗词大师",
        description: "完成所有古诗学习",
        icon: "🏆",
        earned: masteryRate >= 100
      },
      {
        name: "坚持学习",
        description: "连续学习3天",
        icon: "🔥",
        earned: streakDays >= 3
      }
    ];
    
    // 筛选出已获得的徽章
    const earnedBadges = availableBadges.filter(badge => badge.earned);
    
    // 添加学习进度数据和其他用户数据
    const userData = {
      success: true,
      data: {
        name: profileData.name || "用户",
        level: "LV1 入门学者",
        avatar: "/images/avatar.png",
        learnedPoems: userProgress.learnedPoems.length,
        totalPoems: userProgress.totalPoems,
        masteryRate: userProgress.masteryRate,
        streakDays: userProgress.streakDays,
        badgesCount: earnedBadges.length,
        badges: earnedBadges,
        collectionCount: 0, // 这里可以添加收藏数量的统计
        recordings: recordingsData.filter(recording => recording.userId === userId).map(recording => ({ name: recording.title })),
        ...profileData
      }
    };
    
    res.json(userData);
  });
});



// 获取用户徽章 - 需要认证
app.get('/api/user/badges', authenticate, (req, res) => {
  const userId = req.userId;
  const userProgress = getUserLearningProgress(userId);
  
  // 根据用户进度生成徽章
  const masteryRate = userProgress.masteryRate;
  const totalPoems = userProgress.totalPoems;
  const learnedPoems = userProgress.learnedPoems.length;
  
  // 徽章列表
  const availableBadges = [
    {
      name: '启蒙学者',
      description: '完成第一首古诗学习',
      icon: '🥇',
      earned: learnedPoems >= 1
    },
    {
      name: '诗词爱好者',
      description: '学习进度达到33%',
      icon: '📚',
      earned: masteryRate >= 33
    },
    {
      name: '诗词达人',
      description: '学习进度达到66%',
      icon: '🎤',
      earned: masteryRate >= 66
    },
    {
      name: '诗词大师',
      description: '学习进度达到100%',
      icon: '🏆',
      earned: masteryRate >= 100
    },
    {
      name: '坚持学习',
      description: '连续学习3天',
      icon: '🔥',
      earned: userProgress.streakDays >= 3
    }
  ];
  
  res.json({
    success: true,
    data: availableBadges
  });
});

// 获取用户信息 (新接口，兼容客户端调用) - 需要认证
app.get('/api/user/info', authenticate, (req, res) => {
  const userId = req.userId;
  // 获取用户对应的配置文件
  const filePath = path.join(dataDir, `profile_${userId}.json`);
  fs.readFile(filePath, 'utf8', (error, data) => {
    if (error) {
      // 返回默认用户信息
      // 查找用户基本信息
      const user = usersData.find(u => u.id === userId);
      res.json({ success: true, data: {
        name: user ? user.nickname : "用户",
        gender: [{ name: "小男孩", value: "0", checked: true }],
        skills: [{ name: "唐诗", value: "tang", checked: true }]
      } });
    } else {
      res.setHeader("Content-Type", "application/json;charset=utf-8");
      try {
        const profileData = JSON.parse(data);
        res.json({ success: true, data: profileData });
      } catch (parseError) {
        // 查找用户基本信息
        const user = usersData.find(u => u.id === userId);
        res.json({ success: true, data: {
          name: user ? user.nickname : "用户",
          gender: [{ name: "小男孩", value: "0", checked: true }],
          skills: [{ name: "唐诗", value: "tang", checked: true }]
        } });
      }
    }
  });
});

// ==================== 认证相关接口 ====================

// 用于存储验证码（实际项目中应该使用Redis等存储）
const verifyCodes = {};

// 发送验证码
app.post('/api/auth/send-code', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.json({ success: false, message: '手机号不能为空' });
  }

  // 验证手机号格式
  const { validatePhone, generateVerifyCode } = require('./utils/security');
  if (!validatePhone(phone)) {
    return res.json({ success: false, message: '手机号格式不正确' });
  }

  // 生成随机验证码
  const code = generateVerifyCode(); // 随机生成6位数字验证码
  
  // 存储验证码，有效期5分钟
  verifyCodes[phone] = {
    code,
    expireTime: Date.now() + 5 * 60 * 1000
  };

  console.log(`发送验证码到手机号 ${phone}，验证码：${code}`);
  
  // 返回成功
  res.json({ success: true, message: '验证码发送成功' });
});

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  // 导入安全工具
  const { validatePassword, sanitizeInput } = require('./utils/security');
  
  // 过滤输入
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedPassword = sanitizeInput(password);
  
  // 验证参数
  if (!sanitizedUsername || !sanitizedPassword) {
    return res.json({ success: false, message: '用户名和密码不能为空' });
  }

  // 验证用户名长度
  if (sanitizedUsername.length < 2 || sanitizedUsername.length > 20) {
    return res.json({ success: false, message: '用户名长度必须在2-20个字符之间' });
  }

  // 验证密码强度
  const passwordValidation = validatePassword(sanitizedPassword);
  if (!passwordValidation.valid) {
    return res.json({ success: false, message: passwordValidation.message });
  }

  // 检查用户名是否已存在
  const existingUser = usersData.find(user => user.username === sanitizedUsername);
  if (existingUser) {
    return res.json({ success: false, message: '该用户名已被注册' });
  }

  // 生成唯一用户ID
  const userId = Math.max(...usersData.map(user => user.id), 0) + 1;
  
  // 创建新用户
  const newUser = {
    id: userId,
    username: sanitizedUsername,
    password: sanitizedPassword, // 在实际项目中应该加密存储密码
    nickname: sanitizedUsername,
    avatar: '',
    createdAt: new Date().toISOString()
  };

  // 保存用户到数据文件
  usersData.push(newUser);
  writeUsersData();

  // 生成模拟的JWT令牌，包含用户ID
  const token = `mock_jwt_token_${newUser.id}_${Date.now()}`;
  
  // 返回用户信息（不包含密码）
  const userInfo = {
    id: newUser.id,
    username: newUser.username,
    nickname: newUser.nickname,
    avatar: newUser.avatar,
    createdAt: newUser.createdAt
  };

  // 返回注册成功
  res.json({
    success: true,
    data: {
      token,
      userInfo
    },
    message: '注册成功'
  });
});

// 账号密码登录
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 导入安全工具
  const { validatePassword, sanitizeInput } = require('./utils/security');
  
  // 过滤输入
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedPassword = sanitizeInput(password);
  
  // 验证参数
  if (!sanitizedUsername || !sanitizedPassword) {
    return res.json({ success: false, message: '账号和密码不能为空' });
  }

  // 验证账号格式
  if (sanitizedUsername.length < 2 || sanitizedUsername.length > 50) {
    return res.json({ success: false, message: '账号格式不正确' });
  }

  // 查找用户
  const user = usersData.find(u => u.username === sanitizedUsername);
  if (!user) {
    return res.json({ success: false, message: '该账号未注册' });
  }

  // 验证密码
  if (user.password !== sanitizedPassword) {
    return res.json({ success: false, message: '密码错误' });
  }

  // 生成模拟的JWT令牌，包含用户ID
  const token = `mock_jwt_token_${user.id}_${Date.now()}`;
  
  // 准备用户信息（不包含密码）
  const userInfo = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    createdAt: user.createdAt
  };

  // 返回登录成功
  res.json({
    success: true,
    data: {
      token,
      userInfo
    },
    message: '登录成功'
  });
});

// 微信登录
app.post('/api/auth/wechat', (req, res) => {
  const { userInfo, code } = req.body;
  
  // 验证参数
  if (!userInfo || !code) {
    return res.json({ success: false, message: '参数不正确' });
  }

  // 模拟微信登录流程
  // 实际项目中应该调用微信官方接口验证code并获取openid
  const openid = `mock_openid_${Date.now()}`;
  
  // 生成模拟的JWT令牌，包含用户ID
  const token = `mock_jwt_token_wechat_${2}_${Date.now()}`;

  // 返回登录成功
  res.json({
    success: true,
    data: {
      token,
      userInfo: {
        id: 2,
        openid,
        nickname: userInfo.nickName || '微信用户',
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 0,
        createdAt: new Date().toISOString()
      }
    },
    message: '微信登录成功'
  });
});

// 验证令牌
app.get('/api/auth/validate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  
  // 简单验证令牌是否存在
  if (!token) {
    return res.json({ success: false, message: '令牌不存在' });
  }

  // 实际项目中应该解析并验证JWT令牌
  res.json({ success: true, message: '令牌有效' });
});

// 刷新令牌
app.post('/api/auth/refresh', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  
  // 简单验证令牌是否存在
  if (!token) {
    return res.json({ success: false, message: '令牌不存在' });
  }

  // 生成新令牌
  const newToken = `mock_jwt_token_refreshed_${Date.now()}`;
  
  res.json({ 
    success: true, 
    data: { token: newToken },
    message: '令牌刷新成功'
  });
});

// 保存用户信息
// 导入安全工具
const { validateProfile } = require('./utils/security');

// 保存用户信息 - 需要认证
app.post('/api/profile', authenticate, (req, res) => {
  // 验证和过滤个人信息数据
  const validation = validateProfile(req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }
  
  const userId = req.userId;
  // 为每个用户创建独立的配置文件
  const filePath = path.join(dataDir, `profile_${userId}.json`);
  fs.writeFile(filePath, JSON.stringify(validation.data, null, 2), (error) => {
    if (error) {
      console.log('保存失败:', error);
      res.status(500).json({ success: false, message: '保存失败' });
    } else {
      res.json({ success: true, message: '保存成功', data: validation.data });
    }
  });
});

// ==================== 古诗填空游戏接口 ====================

/**
 * 生成带空格的诗句内容
 * @param {string} originalContent - 原始诗句
 * @param {number[]} blankPositions - 需要挖空的字符索引数组
 * @returns {Array<Object>} - 包含 'text' 和 'blank' 类型的数组
 */
const generateContentWithBlanks = (originalContent, blankPositions) => {
  const contentArray = [];
  let lastIndex = 0;
  
  const sortedBlanks = [...blankPositions].sort((a, b) => a - b);

  for (let i = 0; i < sortedBlanks.length; i++) {
    const pos = sortedBlanks[i];
    if (pos > lastIndex) {
      contentArray.push({
        type: 'text',
        value: originalContent.substring(lastIndex, pos)
      });
    }
    contentArray.push({
      type: 'blank',
      index: i
    });
    lastIndex = pos + 1;
  }

  if (lastIndex < originalContent.length) {
    contentArray.push({
      type: 'text',
      value: originalContent.substring(lastIndex)
    });
  }

  return contentArray;
};

// 获取填空题目接口
app.get('/api/games/fill-blank', (req, res) => {
  try {
    const poems = data;
    
    if (poems.length === 0) {
      return res.status(500).json({
        success: false,
        message: "题库为空"
      });
    }

    const randomIndex = Math.floor(Math.random() * poems.length);
    const selectedPoem = poems[randomIndex];

    if (!selectedPoem.blankPositions || !selectedPoem.correctAnswer) {
      return res.status(500).json({
        success: false,
        message: "所选诗歌缺少填空配置（blankPositions或correctAnswer）"
      });
    }

    const contentWithBlanks = generateContentWithBlanks(
      selectedPoem.content,
      selectedPoem.blankPositions
    );

    res.json({
      success: true,
      data: {
        poemTitle: selectedPoem.title,
        author: selectedPoem.author,
        contentWithBlanks: contentWithBlanks,
        blanksCount: selectedPoem.blankPositions.length,
        correctAnswer: selectedPoem.correctAnswer
      }
    });
  } catch (error) {
    console.error("Error in fill-blank game API:", error);
    res.status(500).json({
      success: false,
      message: "获取题目失败"
    });
  }
});

// ==================== 录音相关接口 ====================
// 读取录音数据文件（recordings.json）
let recordingsData = [];
const recordingsFilePath = path.join(__dirname, 'data', 'recordings.json');

// 初始化录音数据
function initRecordingsData() {
  try {
    const recordingsJsonStr = fs.readFileSync(recordingsFilePath, { encoding: 'utf8' });
    recordingsData = JSON.parse(recordingsJsonStr).data || [];
  } catch (error) {
    console.warn('recordings.json文件不存在或解析失败，将使用默认数据', error.message);
    // 默认录音数据
    recordingsData = [];
    // 保存默认数据到文件
    saveRecordingsData();
  }
}

// 保存录音数据到文件
function saveRecordingsData() {
  try {
    const recordingsJsonStr = JSON.stringify({ data: recordingsData }, null, 2);
    fs.writeFileSync(recordingsFilePath, recordingsJsonStr, { encoding: 'utf8' });
  } catch (error) {
    console.error('保存录音数据失败', error.message);
  }
}

// 初始化录音数据
initRecordingsData();

// 获取录音列表
app.get('/api/recordings', authenticate, (req, res) => {
  try {
    // 模拟根据用户ID过滤录音
    const userRecordings = recordingsData.filter(recording => recording.userId === req.userId);
    res.json({
      success: true,
      data: userRecordings,
      message: '获取录音列表成功'
    });
  } catch (error) {
    console.error('获取录音列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取录音列表失败'
    });
  }
});

// 获取录音详情
app.get('/api/recordings/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const recording = recordingsData.find(r => r.id === id && r.userId === req.userId);
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: '录音不存在'
      });
    }
    
    res.json({
      success: true,
      data: recording,
      message: '获取录音详情成功'
    });
  } catch (error) {
    console.error('获取录音详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取录音详情失败'
    });
  }
});

// 保存录音
app.post('/api/recordings', authenticate, (req, res) => {
  try {
    const recordingData = req.body;
    
    // 生成唯一ID（使用时间戳+随机数）
    const newRecording = {
      id: `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: req.userId,
      title: recordingData.title || '未命名录音',
      duration: recordingData.duration || 0,
      url: recordingData.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加到录音列表
    recordingsData.push(newRecording);
    // 保存到文件
    saveRecordingsData();
    
    res.json({
      success: true,
      data: newRecording,
      message: '保存录音成功'
    });
  } catch (error) {
    console.error('保存录音失败:', error);
    res.status(500).json({
      success: false,
      message: '保存录音失败'
    });
  }
});

// 删除录音
app.delete('/api/recordings/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = recordingsData.length;
    
    // 过滤掉要删除的录音
    recordingsData = recordingsData.filter(r => !(r.id === id && r.userId === req.userId));
    
    if (recordingsData.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: '录音不存在'
      });
    }
    
    // 保存到文件
    saveRecordingsData();
    
    res.json({
      success: true,
      message: '删除录音成功'
    });
  } catch (error) {
    console.error('删除录音失败:', error);
    res.status(500).json({
      success: false,
      message: '删除录音失败'
    });
  }
});

// ==========================================================

// 简单测试接口
app.get('/test', (req, res) => {
  res.json({ success: true, message: '测试接口正常工作' });
});

// 用户注册测试接口
app.post('/api/auth/register-test', (req, res) => {
  const { phone, username, password } = req.body;
  console.log('收到注册测试请求:', req.body);
  res.json({
    success: true,
    data: {
      token: `test_token_${Date.now()}`,
      userInfo: { id: 1, phone, username }
    },
    message: '注册测试成功'
  });
});

// 监听3000端口（整合两个文件的启动日志信息）
app.listen(3000, () => {
  console.log('合并后的服务器启动成功，地址为：http://127.0.0.1:3000');
  console.log('访问静态资源：http://127.0.0.1:3000/文件名');
  console.log('支持的接口：');
  console.log('1. 分页接口：GET /data?page=1&pageSize=10');
  console.log('2. 用户信息接口：GET /api/profile | POST /api/profile');
  console.log('3. 古诗填空接口：GET /api/games/fill-blank');
  console.log('4. 录音相关接口：GET/POST/DELETE /api/recordings');
  console.log('5. 测试接口：GET /test');
  console.log('6. 注册测试接口：POST /api/auth/register-test');
});

// 导出app实例用于测试
module.exports = app;