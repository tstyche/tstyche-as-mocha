/**
 * @param {import("mocha").Runner} runner
 */
const testReporter = (runner) => {
  if (runner == null) {
    throw new Error("Did not receive a mocha Runner");
  }
};

export default testReporter;
