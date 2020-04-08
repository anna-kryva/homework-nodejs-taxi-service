module.exports = (level, information) => {
  const result = {
    timestamp: Date.now(),
    level,
    information,
  };

  return console.log(JSON.stringify(result));
};
