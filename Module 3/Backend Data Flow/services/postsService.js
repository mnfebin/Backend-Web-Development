exports.editPost = async (postId, userId, changes) => {
  const post = await repo.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorId !== userId) {
    throw new AppError('You can only edit your own post', 403);
  }

<<<<<<< HEAD
  const ageMs = Date.now() - post.createdAt;

  if (ageMs > EDIT_WINDOW_MS) {
=======
  const now = Date.now();
  const createdAt = new Date(post.createdAt).getTime();

  if (now - createdAt > EDIT_WINDOW_MS) {
>>>>>>> 6b1b4cc (Domain Rules & Work Flow)
    throw new AppError('Post can no longer be edited', 403);
  }

  return repo.update(postId, changes);
};