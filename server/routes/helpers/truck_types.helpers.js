module.exports = (type) => {
  switch (type) {
    case 'SPRINTER':
      return [
        width = 300,
        length = 250,
        height = 170,
        payload = 1700,
      ];
    case 'SMALL STRAIGHT':
      return [
        width = 500,
        length = 250,
        height = 170,
        payload = 2500,
      ];
    case 'LARGE STRAIGHT':
      return [
        width = 700,
        length = 350,
        height = 200,
        payload = 4000,
      ];
    default:
      return [
        width = 300,
        length = 250,
        height = 170,
        payload = 1700,
      ];
  }
};
