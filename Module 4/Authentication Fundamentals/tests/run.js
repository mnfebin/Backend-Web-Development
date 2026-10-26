const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const databaseUrl = 'file:../tests/test.db';
const databasePath = path.join(__dirname, 'test.db');
const env = { ...process.env, DATABASE_URL: databaseUrl };
const prismaCliPath = require.resolve('prisma/build/index.js', {
  paths: [projectRoot],
});

function runPrisma(args) {
  const result = spawnSync(
    process.execPath,
    [prismaCliPath, ...args, '--schema', schemaPath],
    { cwd: projectRoot, env, encoding: 'utf8' }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Prisma command failed');
  }
}

function request(server, { method = 'GET', path: requestPath, body }) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: requestPath,
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    if (body !== undefined) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  runPrisma(['generate']);
  runPrisma(['db', 'push', '--force-reset']);

  process.env.DATABASE_URL = databaseUrl;
  const app = require('../src/app');
  const prisma = require('../src/db/prisma');
  const server = http.createServer(app);

  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });

    const invalidInput = await request(server, {
      method: 'POST',
      path: '/auth/register',
      body: { name: ' ', email: 'person@example.com', password: 'secret' },
    });
    assert.equal(invalidInput.status, 400);
    assert.equal(invalidInput.body.error.code, 'INVALID_INPUT');

    const registered = await request(server, {
      method: 'POST',
      path: '/auth/register',
      body: {
        name: ' Sam ',
        email: '  SAM@example.com ',
        password: 'correct horse battery staple',
      },
    });
    assert.equal(registered.status, 201);
    assert.deepEqual(Object.keys(registered.body).sort(), ['email', 'id', 'name']);
    assert.deepEqual(registered.body, {
      id: 1,
      name: 'Sam',
      email: 'sam@example.com',
    });

    const storedUser = await prisma.user.findUnique({
      where: { email: 'sam@example.com' },
    });
    assert.ok(storedUser.passwordHash.startsWith('$2'));
    assert.notEqual(storedUser.passwordHash, 'correct horse battery staple');

    const duplicate = await request(server, {
      method: 'POST',
      path: '/auth/register',
      body: {
        name: 'Sam Again',
        email: 'sam@example.com',
        password: 'another password',
      },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'EMAIL_ALREADY_EXISTS');

    const login = await request(server, {
      method: 'POST',
      path: '/auth/login',
      body: {
        email: ' SAM@example.com ',
        password: 'correct horse battery staple',
      },
    });
    assert.equal(login.status, 200);
    assert.deepEqual(login.body, registered.body);

    const wrongPassword = await request(server, {
      method: 'POST',
      path: '/auth/login',
      body: { email: 'sam@example.com', password: 'wrong password' },
    });
    const unknownEmail = await request(server, {
      method: 'POST',
      path: '/auth/login',
      body: { email: 'nobody@example.com', password: 'wrong password' },
    });
    const credentialsError = {
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    };
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.deepEqual(wrongPassword.body, credentialsError);
    assert.deepEqual(unknownEmail.body, credentialsError);

    const malformedJson = await request(server, {
      method: 'POST',
      path: '/auth/login',
      body: '{"email":',
    });
    assert.equal(malformedJson.status, 400);
    assert.equal(malformedJson.body.error.code, 'INVALID_INPUT');

    console.log('All authentication tests passed.');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await prisma.$disconnect();
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-journal`, { force: true });
  }
}

runTests().catch((error) => {
  console.error('Authentication tests failed:', error.message);
  process.exitCode = 1;
});
