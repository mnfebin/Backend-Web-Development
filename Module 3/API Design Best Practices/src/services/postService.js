const store = require('../data/postStore');

function listPosts(query = {}) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(2, Math.max(1, parseInt(query.limit) || 2));

  const allPosts = store.getAllPosts();

  const total = allPosts.length;
  const totalPages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const data = allPosts.slice(start, start + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages
    }
  };
}

function getPost(id) {
  return store.getPostById(id);
}

function createPost(body = {}) {
  return store.createPost({
    title: body.title,
    author: body.author
  });
}

function likePost(id) {
  const post = store.incrementLikes(id);

  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    err.code = 'POST_NOT_FOUND';
    throw err;
  }

  return post;
}

function explode() {
  const err = new Error('SQLITE_CONSTRAINT in posts table');
  err.statusCode = 500;
  throw err;
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  likePost,
  explode
};