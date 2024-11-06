import * as https from "https";

async function run(): Promise<string> {
  const uri = "##URL##";
  const token = "##TOKEN##";
  const version = "##VERSION##";

  const result = await createOidcToken(uri, token, version);

  return JSON.stringify({
    version: 1,
    success: result?.oidcToken != undefined,
    token_type: "urn:ietf:params:oauth:token-type:jwt",
    id_token: result?.oidcToken || {},
  })
}

interface OidcToken {
  oidcToken: string;
}

function createOidcToken(url: string, token: string, version?: string): Promise<OidcToken> {
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json" + (version ? `;api-version=${version}` : ""),
    },
    timeout: 10000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const statusCode = res.statusCode || 0;
      if (statusCode < 200 || statusCode > 299) {
        return reject(new Error(`Unexpected HTTP response status code. StatusCode=${res.statusCode}`))
      }

      var buf: any[] = [];
      res.on('data', (chunk) => {
        buf.push(chunk);
      })

      res.on('end', () => {
        const response = Buffer.concat(buf).toString();
        try {
          const obj: OidcToken = JSON.parse(response);
          resolve(obj);
        } catch (e) {
          reject(e);
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request time out'))
    })

    req.end()
  })
}

run().then(
  obj => process.stdout.write(obj),
  reason => {
    console.error(reason);
    process.exit(1);
  });