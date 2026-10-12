const prisma = require('../db/prisma');

function toId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function applicationError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function translateDatabaseError(error) {
  if (error.code === 'P2002') {
    throw applicationError('A record with these values already exists', 409);
  }
  if (error.code === 'P2003') {
    throw applicationError('The related record does not exist', 409);
  }
  throw error;
}

async function findAll() {
  return prisma.post.findMany({ orderBy: { id: 'asc' } });
}

async function findById(value) {
  const id = toId(value);
  if (id === null) return null;
  return prisma.post.findUnique({ where: { id } });
}

async function create(fields) {
  const authorId = Number(fields.authorId);
  if (!Number.isSafeInteger(authorId) || authorId <= 0) {
    throw applicationError('The related record does not exist', 409);
  }

  try {
    return await prisma.post.create({
      data: {
        title: fields.title,
        body: fields.body || '',
        authorId,
      },
    });
  } catch (error) {
    translateDatabaseError(error);
  }
}

async function update(value, patch) {
  const id = toId(value);
  if (id === null) return null;

  const data = {};
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.body !== undefined) data.body = patch.body;

  try {
    return await prisma.post.update({ where: { id }, data });
  } catch (error) {
    if (error.code === 'P2025') return null;
    translateDatabaseError(error);
  }
}

async function remove(value) {
  const id = toId(value);
  if (id === null) return false;
  const result = await prisma.post.deleteMany({ where: { id } });
  return result.count > 0;
}

module.exports = { findAll, findById, create, update, remove };
