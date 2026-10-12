require('dotenv').config();

const prisma = require('../src/db/prisma');

async function main() {
  const name = 'Threadbase seed author';
  const existingAuthor = await prisma.user.findFirst({ where: { name } });
  const author = existingAuthor || await prisma.user.create({ data: { name } });
  const posts = [
    { title: 'First post', body: 'The contract survives storage changes.' },
    { title: 'Second post', body: 'Migrations record database design.' },
  ];

  for (const post of posts) {
    const existingPost = await prisma.post.findFirst({
      where: { authorId: author.id, title: post.title },
    });
    if (!existingPost) {
      await prisma.post.create({ data: { ...post, authorId: author.id } });
    }
  }
}

main()
  .catch((error) => {
    console.error('Database seeding failed. Check DATABASE_URL and database availability.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
