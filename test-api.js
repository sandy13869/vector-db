const http = require("http");

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: { "Content-Type": "application/json" }
    };

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log("\n=== Health Check ===");
  console.log(await request("GET", "/api/health"));

  console.log("\n=== Zvec Status ===");
  console.log(await request("GET", "/api/health/zvec"));

  console.log("\n=== Query (top 3) ===");
  const qv = Array(768).fill(0).map(() => Math.random());
  console.log(await request("POST", "/api/documents/query", {
    collectionName: "documents", queryVector: qv, topk: 3
  }));

  console.log("\n=== Fetch doc_1 ===");
  console.log(await request("GET", "/api/documents/fetch/doc_1?collectionName=documents"));

  console.log("\n=== Stats ===");
  console.log(await request("GET", "/api/documents/stats?collectionName=documents"));

  console.log("\n=== Swagger Docs available ===");
  console.log((await request("GET", "/api-docs")).substring ? "OK - HTML page" : "OK");
}

main().catch(console.error);