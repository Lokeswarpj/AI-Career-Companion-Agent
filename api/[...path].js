import handler from './index.js';

export default async function catchAllHandler(req, res) {
  return handler(req, res);
}

