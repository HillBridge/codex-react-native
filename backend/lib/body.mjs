const MAX_BODY_BYTES = 16 * 1024;

export async function readJsonBody(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) {
    throw new HttpError(400, 'BAD_REQUEST', '请求必须使用 application/json。');
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      throw new HttpError(400, 'BAD_REQUEST', '请求体过大。');
    }

    chunks.push(chunk);
  }

  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Body must be an object.');
    }

    return value;
  } catch {
    throw new HttpError(400, 'BAD_REQUEST', '请求体必须是合法 JSON 对象。');
  }
}

export class HttpError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
