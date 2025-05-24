const humantime = () => {
  const time = new Date();
  const pad = (n) => (n < 10 ? "0" + n : n);
  const humantime = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(
    time.getSeconds()
  )}`;
  return humantime;
};

const log = (str, ...rest) => {
  console.log(`[${humantime()}][info]${str || ""}`, ...rest);
};
const error = (str, ...rest) => {
  console.log(`[${humantime()}][error]${str || ""}`, ...rest);
};

module.exports = {
  humantime,
  log,
  error,
};
