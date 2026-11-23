// The Robust Reading Competition site (rrc.cvc.uab.es) sends its certificate without the intermediate that signed
// it, HARICA’s "GEANT TLS RSA 1" (checked 2026-11-23). Node, and curl built on OpenSSL as on GitHub’s Linux runners,
// don’t download a missing intermediate, so they can’t build the chain, and DocVQA and DUDE failed from 2026-11-18. The
// intermediate below is the one the certificate itself points to (http://crt.harica.gr/HARICA-GEANT-TLS-R1.cer,
// SHA-256 5B:67:8D:C4:40:95:A5:28:95:B6:3B:31:F2:72:27:F4:B3:6C:3E:34:74:91:BF:2B:FA:69:18:37:A5:FB:8C:79, valid to
// 2039). It is only the missing link: verification stays on, and the chain must still end at a root Node trusts
// (HARICA TLS RSA Root CA 2021). Never disable certificate verification.
import { execFile } from 'node:child_process';
import { lookup as dnsLookup, Resolver } from 'node:dns';
import { request } from 'node:https';
import type { LookupFunction } from 'node:net';
import { rootCertificates } from 'node:tls';
import { promisify } from 'node:util';
import { bodyHooks, fetchText } from '../util.ts';
const exec = promisify(execFile);
const UA = 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)';

const GEANT_TLS_RSA_1 = `-----BEGIN CERTIFICATE-----
MIIGBTCCA+2gAwIBAgIQFNV782kiKCGaVWf6kWUbIjANBgkqhkiG9w0BAQsFADBs
MQswCQYDVQQGEwJHUjE3MDUGA1UECgwuSGVsbGVuaWMgQWNhZGVtaWMgYW5kIFJl
c2VhcmNoIEluc3RpdHV0aW9ucyBDQTEkMCIGA1UEAwwbSEFSSUNBIFRMUyBSU0Eg
Um9vdCBDQSAyMDIxMB4XDTI1MDEwMzExMTUwMFoXDTM5MTIzMTExMTQ1OVowYDEL
MAkGA1UEBhMCR1IxNzA1BgNVBAoMLkhlbGxlbmljIEFjYWRlbWljIGFuZCBSZXNl
YXJjaCBJbnN0aXR1dGlvbnMgQ0ExGDAWBgNVBAMMD0dFQU5UIFRMUyBSU0EgMTCC
AaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAKEEaZSzEzznAPk8IEa17GSG
yJzPTj4cwRY7/vcq2BPT5+IRGxQtaCdgLXIEl2cdPdIkj2eyakFmgMjAtyeju8V8
dRayQCD/bWjJ7thDlowgLljQaXirxnYbT8bzRHAhCZqBakYgi5KWw9dANLyDHGpX
UdY259ab0lWEaFE5Uu6IzQSMJOAy4l/Twym8GUiy0qMDEBFSlm31C9BXpdHKKAlh
vIjMiKoDeTWl5vZaLB2MMRGY1yW2ftPgIP0/MkX1uFITlvHmmMTngxplH1nybEIJ
FiwHg1KiLk1TprcZgeO2gxE5Lz3wTFWrsUlAzrh5xWmscWkjNi/4BpeuiT5+NExF
czboLnXOfjuci/7bsnPi1/aZN/iKNbJRnngFoLaKVMmqCS7Xo34f+BITatryQZFE
u2oDKExQGlxDBCfYMLgLucX/onpLzUSgeQITNLx6i5tGGbUYH+9Dy3GI66L/5tPj
qzlOsydki8ZYGE5SBJeWCZ2IrhUe0WzZ2b6Zhk6JAQIDAQABo4IBLTCCASkwEgYD
VR0TAQH/BAgwBgEB/wIBADAfBgNVHSMEGDAWgBQKSCOmYKSSCjPqk1vFV+olTb0S
7jBNBggrBgEFBQcBAQRBMD8wPQYIKwYBBQUHMAKGMWh0dHA6Ly9jcnQuaGFyaWNh
LmdyL0hBUklDQS1UTFMtUm9vdC0yMDIxLVJTQS5jZXIwEQYDVR0gBAowCDAGBgRV
HSAAMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATBCBgNVHR8EOzA5MDeg
NaAzhjFodHRwOi8vY3JsLmhhcmljYS5nci9IQVJJQ0EtVExTLVJvb3QtMjAyMS1S
U0EuY3JsMB0GA1UdDgQWBBSGAXI/jKlw4jEGUxbOAV9becg8OzAOBgNVHQ8BAf8E
BAMCAYYwDQYJKoZIhvcNAQELBQADggIBABkssjQzYrOo4GMsKegaChP16yNe6Sck
cWBymM455R2rMeuQ3zlxUNOEt+KUfgueOA2urp4j6TlPbs/XxpwuN3I1f09Luk5b
+ZgRXM7obE6ZLTerVQWKoTShyl34R2XlK8pEy7+67Ht4lcJzt+K6K5gEuoPSGQDP
ef+fUfmXrFcgBMcMbtfDb9dubFKNZZxo5nAXiqhFMOIyByag3H+tOTuH8zuId9pH
RDsUpAIHJ9/W2WBfLcKav7IKRlNBRD/sPBy903J9WHPKwl8kQSDA+aa7XCYk7bJt
Eyf+7GM9F5cZ7+YyknXqnv/rtQEkTKZdQo5Us18VFe9qqj94tXbLdk7PejJYNB4O
Zlli44Ld7rtqfFlUych7gIxFOmiyxMQQYrYmUi+74lEZvfoNhuref0CupuKpz6O3
dLv6kO9T10uNdDBoBQTkge3UzHafTIe3R2o3ujXKUGPwyc9m7/FETyKLUCwSU/5O
AVOeBCU8QtkKKjM8AmbpKpe3pHWcyq3R7B3LmIALkMPTydyDfxen65IDqREbVq8N
xjhkJThUz40JqOlN6uqKqeDISj/IoucYwsqW24AlO7ZzNmohQmMi8ep23H4hBSh0
GBTe2XvkuzaNf92syK8l2HzO+13GLCjzYLTPvXTO9UpK8DGyfGZOuamuwbAnbNpE
3RfjV9IaUQGJ
-----END CERTIFICATE-----
`;

// Some resolvers (Quad9, and the one on a maintainer's Mac, on 2026-11-23) answer rrc.cvc.uab.es with a CNAME to
// rrc-red.cvc.uab.es, which doesn't exist, while all six uab.es name servers, Google and Cloudflare answer
// 158.109.8.55. When the system resolver fails, ask Google and Cloudflare. TLS still checks the name.
const publicDns = new Resolver();
publicDns.setServers(['8.8.8.8', '1.1.1.1']);
const lookup: LookupFunction = (host, options, callback) =>
  dnsLookup(host, options, (error, address, family) => {
    if (!error) return callback(null, address, family);
    publicDns.resolve4(host, (e, addresses) => {
      if (e || !addresses.length) return callback(error, address, family);
      if (options.all) return (callback as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, addresses.map((a) => ({ address: a, family: 4 })));
      callback(null, addresses[0], 4);
    });
  });

/** The page over HTTPS with Node's trusted roots plus the intermediate RRC leaves out. */
function withIntermediate(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(url, { ca: [...rootCertificates, GEANT_TLS_RSA_1], headers: { 'user-agent': UA }, timeout: 40_000, lookup }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`${res.statusCode} ${url}`));
        return;
      }
      res.setEncoding('utf8');
      let body = '';
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => {
        for (const hook of bodyHooks) hook(url, body);
        resolve(body);
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error(`timed out after 40 s: ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

export async function rrcPage(url: string): Promise<string> {
  if (new URL(url).hostname !== 'rrc.cvc.uab.es') throw new Error('Unexpected RRC host');
  try { return await fetchText(url, {}, 1, 40_000); }
  catch (error) {
    try {
      const body = await withIntermediate(url);
      if (body.includes('<table')) return body;
    } catch { /* fall through to curl, which uses the system trust store */ }
    const { stdout } = await exec('curl', ['--fail', '--silent', '--show-error', '--max-time', '40', '--user-agent', UA, url],
      {maxBuffer: 8 * 1024 * 1024});
    if (!stdout.includes('<table')) throw error;
    return stdout;
  }
}
