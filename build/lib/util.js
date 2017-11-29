export default {
  promisifyStream(stream) {
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', resolve);
    });
  }
};