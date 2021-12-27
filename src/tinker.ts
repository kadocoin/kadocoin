import level from 'level';
const balancesDB = level('balancesdb');

const address = '0x4Ff299F604391989b36d13D24Ce4247b0EC7964a';

const get = (key: string) =>
  new Promise(resolve => {
    balancesDB.get(key, (err, value) => {
      if (err) resolve(err);
      resolve(value);
    });
  });

(async function test() {
  const res = await get(address);
  console.log({ res });
})();
