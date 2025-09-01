const fs = require("fs");


function toBigInt(value, base) {
  const digits = value.toLowerCase();
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = 0n;

  for (let c of digits) {
    const idx = chars.indexOf(c);
    if (idx === -1) throw new Error(`Invalid character '${c}' in value.`);
    const v = BigInt(idx);
    if (v >= BigInt(base)) {
      throw new Error(`Invalid digit '${c}' for base ${base}`);
    }
    result = result * BigInt(base) + v;
  }
  return result;
}


function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function lagrangeAtZero(shares, k) {
  const points = shares.slice(0, k);
  let num = 0n;
  let den = 1n;

  for (let i = 0; i < points.length; i++) {
    const [xi, yi] = points[i];
    let termNum = yi;
    let termDen = 1n;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const [xj] = points[j];
      termNum *= -xj;        
      termDen *= (xi - xj);  
    }

    const newNum = num * termDen + termNum * den;
    const newDen = den * termDen;
    const g = gcd(newNum, newDen);
    num = newNum / g;
    den = newDen / g;
  }

  if (den === 0n) throw new Error("Zero denominator encountered");
  return num / den;
}

function processFile(filename) {
  const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
  const n = data.keys.n;
  const k = data.keys.k;

  let shares = [];
  for (let key of Object.keys(data)) {
    if (key === "keys") continue;
    const x = BigInt(key);
    const base = parseInt(data[key].base, 10);
    const y = toBigInt(data[key].value, base);
    shares.push([x, y]);
  }

  console.log("\n====================================");
  console.log("File:", filename);
  console.log("n =", n, "k =", k);
  console.log("Shares used (x,y):");
  for (let [x, y] of shares.slice(0, k)) {
    console.log(`(${x.toString()}, ${y.toString()})`);
  }

  const C = lagrangeAtZero(shares, k);
  console.log("Constant C =", C.toString());
  console.log("====================================\n");
}


let files = process.argv.slice(2);
if (files.length === 0) {
  files = ["testcase1.json", "testcase2.json"];
}

for (let f of files) {
  if (!fs.existsSync(f)) {
    console.error(`File not found: ${f}`);
    continue;
  }
  processFile(f);
}