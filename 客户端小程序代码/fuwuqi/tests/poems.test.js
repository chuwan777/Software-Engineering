const request = require('supertest');
const app = require('../index');
const chai = require('chai');
const fs = require('fs');
const path = require('path');

const expect = chai.expect;
const userPoemsFilePath = path.join(__dirname, '../data/user-poems.json');

// 保存原始数据，用于测试后恢复
let originalUserPoemsData = [];

// 在所有测试开始前保存原始数据
before(() => {
  const data = fs.readFileSync(userPoemsFilePath, 'utf8');
  originalUserPoemsData = JSON.parse(data).data;
});

// 在所有测试结束后恢复原始数据
after(() => {
  fs.writeFileSync(userPoemsFilePath, JSON.stringify({ data: originalUserPoemsData }, null, 2));
});

// 测试诗歌分类API
describe('Poem Categories API', () => {
  it('should get all poem categories', (done) => {
    request(app)
      .get('/api/poem-categories')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.be.an('array');
        done();
      });
  });
});

// 测试用户诗歌API
describe('User Poems API', () => {
  let testPoemId = null;
  
  it('should get user poems list', (done) => {
    request(app)
      .get('/api/my-poems')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        expect(res.body.data.list).to.be.an('array');
        done();
      });
  });
  
  it('should add a new poem', (done) => {
    const newPoem = {
      title: '测试诗歌',
      content: '这是一首测试诗歌的内容。',
      category: 'test',
      tags: ['测试', '单元测试']
    };
    
    request(app)
      .post('/api/my-poems')
      .send(newPoem)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.title).to.equal(newPoem.title);
        testPoemId = res.body.data.id;
        done();
      });
  });
  
  it('should fail to add a poem without required fields', (done) => {
    const invalidPoem = {
      title: '', // 空标题
      content: '这是一首无效的测试诗歌。',
      category: 'test'
    };
    
    request(app)
      .post('/api/my-poems')
      .send(invalidPoem)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('标题、内容和分类不能为空');
        done();
      });
  });
  
  it('should get a specific poem detail', (done) => {
    if (!testPoemId) return done(new Error('Test poem ID not found'));
    
    request(app)
      .get(`/api/my-poems/${testPoemId}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        expect(res.body.data.id).to.equal(testPoemId);
        done();
      });
  });
  
  it('should update a poem', (done) => {
    if (!testPoemId) return done(new Error('Test poem ID not found'));
    
    const updatedPoem = {
      title: '更新后的测试诗歌',
      content: '这是更新后的测试诗歌内容。',
      category: 'test',
      tags: ['测试', '更新']
    };
    
    request(app)
      .put(`/api/my-poems/${testPoemId}`)
      .send(updatedPoem)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        expect(res.body.data.title).to.equal(updatedPoem.title);
        expect(res.body.data.content).to.equal(updatedPoem.content);
        done();
      });
  });
  
  it('should fail to update a poem without required fields', (done) => {
    if (!testPoemId) return done(new Error('Test poem ID not found'));
    
    const invalidPoem = {
      title: '', // 空标题
      content: '这是一首无效的测试诗歌。',
      category: 'test'
    };
    
    request(app)
      .put(`/api/my-poems/${testPoemId}`)
      .send(invalidPoem)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('标题、内容和分类不能为空');
        done();
      });
  });
  
  it('should delete a poem', (done) => {
    if (!testPoemId) return done(new Error('Test poem ID not found'));
    
    request(app)
      .delete(`/api/my-poems/${testPoemId}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.true;
        done();
      });
  });
  
  it('should fail to get a non-existent poem', (done) => {
    request(app)
      .get('/api/my-poems/999999')
      .expect(404)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('诗歌不存在');
        done();
      });
  });
});
