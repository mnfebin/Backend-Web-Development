exports.castVote = async (postId, userId) => {
  const post = await postsRepo.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

<<<<<<< HEAD
  const existingVote = await votesRepo.find(postId, userId);
=======
  const existingVote = await votesRepo.findByPostAndUser(postId, userId);
>>>>>>> 6b1b4cc (Domain Rules & Work Flow)

  if (existingVote) {
    throw new AppError('You have already voted on this post', 409);
  }

  return votesRepo.insert(postId, userId);
};