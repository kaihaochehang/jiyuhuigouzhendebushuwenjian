const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 初始化Supabase
const { createClient } = require('@supabase/supabase-js');
let supabase;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase环境变量未设置，部分功能可能无法使用');
    supabase = null;
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('Supabase初始化失败:', error);
  supabase = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// CORS - 添加生产环境域名
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.0.126:3000',
    'https://jiyuhuigouzhendebushuwenjian.vercel.app'
  ],
  credentials: true
}));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 数据库连接
const db = require('./index');

// 同步数据库（仅验证连接，不修改表结构）
if (db.sequelize) {
  db.sequelize.authenticate().then(() => {
    console.log('数据库连接成功');
  }).catch(err => {
    console.error('数据库连接失败:', err);
  });
} else {
  console.warn('数据库未初始化，部分功能可能无法使用');
}

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/transaction', require('./routes/transaction'));
app.use('/api/announcement', require('./routes/announcement'));

// 前端路由 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动定时任务
require('./cron/jobs');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://192.168.0.126:${PORT}`);
  console.log(`外部访问: http://0.0.0.0:${PORT}`);
});

module.exports = app;
