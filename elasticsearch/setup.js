const client = require('./client');

async function createIndices() {
  await client.indices.create({
    index: 'emails',
    body: {
      mappings: {
        properties: {
          userId: { type: 'keyword' },
          subject: { type: 'text' },
          body: { type: 'text' },
        },
      },
    },
  });

  await client.indices.create({
    index: 'mailboxes',
    body: {
      mappings: {
        properties: {
          userId: { type: 'keyword' },
          mailboxName: { type: 'text' },
        },
      },
    },
  });
}

createIndices().catch(console.log);
