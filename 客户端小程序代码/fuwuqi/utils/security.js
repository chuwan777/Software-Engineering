/**
 * 安全工具模块
 */

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} - 是否有效
 */
const validatePhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {Object} - { valid: boolean, message: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: '密码不能为空' };
  }
  if (password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位' };
  }
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' };
  }
  // 可以添加更多密码强度要求，如包含数字、字母、特殊字符等
  return { valid: true, message: '密码验证通过' };
};

/**
 * 验证验证码格式
 * @param {string} code - 验证码
 * @returns {boolean} - 是否有效
 */
const validateVerifyCode = (code) => {
  if (!code) return false;
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
};

/**
 * 过滤用户输入，防止XSS攻击
 * @param {any} input - 输入内容
 * @returns {any} - 过滤后的内容
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // 替换HTML特殊字符
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  } else if (Array.isArray(input)) {
    // 处理数组
    return input.map(item => sanitizeInput(item));
  } else if (typeof input === 'object' && input !== null) {
    // 处理对象
    const sanitizedObj = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitizedObj[key] = sanitizeInput(input[key]);
      }
    }
    return sanitizedObj;
  }
  return input;
};

/**
 * 验证个人信息数据
 * @param {Object} profile - 个人信息
 * @returns {Object} - { valid: boolean, message: string, data: Object }
 */
const validateProfile = (profile) => {
  if (!profile) {
    return { valid: false, message: '个人信息不能为空' };
  }
  
  // 过滤输入
  const sanitizedProfile = sanitizeInput(profile);
  
  // 验证必填字段
  const requiredFields = ['username', 'gender', 'avatar'];
  for (const field of requiredFields) {
    if (!sanitizedProfile[field]) {
      return { valid: false, message: `${field}字段不能为空` };
    }
  }
  
  // 验证性别字段
  if (!['male', 'female'].includes(sanitizedProfile.gender)) {
    return { valid: false, message: '性别字段值无效' };
  }
  
  // 验证技能标签
  if (sanitizedProfile.skills && Array.isArray(sanitizedProfile.skills)) {
    // 确保技能标签数量合理
    if (sanitizedProfile.skills.length > 10) {
      return { valid: false, message: '技能标签数量不能超过10个' };
    }
  }
  
  return { valid: true, message: '验证通过', data: sanitizedProfile };
};

/**
 * 生成随机验证码
 * @param {number} length - 验证码长度
 * @returns {string} - 验证码
 */
const generateVerifyCode = (length = 6) => {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = {
  validatePhone,
  validatePassword,
  validateVerifyCode,
  sanitizeInput,
  validateProfile,
  generateVerifyCode
};
