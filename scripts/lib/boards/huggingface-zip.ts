// Read small author result files inside public Hugging Face ZIP archives through HTTP ranges.
// This avoids downloading the full inference logs. ZIP data is never executed or extracted to disk.
import { inflateRawSync } from 'node:zlib';
const UA='benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)';
let lastRequest=0;
export interface ZipEntry {name:string;method:number;size:number;compressed:number;offset:number}
export async function hfZipRange(url:string,range:string):Promise<Buffer> {
 if(!url.startsWith('https://huggingface.co/datasets/'))throw new Error('Expected a public Hugging Face dataset URL');
 for(let attempt=0;attempt<3;attempt++) {
  await new Promise(r=>setTimeout(r,Math.max(0,2100-(Date.now()-lastRequest))));lastRequest=Date.now();
  const res=await fetch(url,{headers:{'user-agent':UA,range:`bytes=${range}`},signal:AbortSignal.timeout(60000)});
  if(res.status===429 || res.status>=500) {
   const delay=Number(res.headers.get('retry-after'));
   await new Promise(r=>setTimeout(r,Math.max(5000,Number.isFinite(delay)?delay*1000:5000)));continue;
  }
  if(res.status!==206)throw new Error(`Hugging Face ZIP range returned ${res.status}`);
  const b=Buffer.from(await res.arrayBuffer());
  if(b.length>2_000_000)throw new Error('Hugging Face ZIP range too large');
  const requested=range.match(/^(\d+)-(\d+)$/),received=res.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if(!received || (requested && (received[1]!==requested[1] || Number(received[2])>Number(requested[2]))))throw new Error('Hugging Face ZIP range mismatch');
  return b;
 }
 throw new Error('Hugging Face ZIP range retries exhausted');
}
export async function hfZipEntries(url:string):Promise<ZipEntry[]> {
 let b=await hfZipRange(url,'-65536');const end=b.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
 if(end<0)throw new Error('ZIP end record missing');
 const count=b.readUInt16LE(end+10),size=b.readUInt32LE(end+12),offset=b.readUInt32LE(end+16);
 if(count===65535 || size===0xffffffff || offset===0xffffffff)throw new Error('ZIP64 archives are not supported');
 b=size>end?await hfZipRange(url,`${offset}-${offset+size-1}`):b.subarray(end-size,end);
 const entries:ZipEntry[]=[];
 for(let i=0;i<b.length;) {
  if(b.readUInt32LE(i)!==0x02014b50)throw new Error('ZIP central directory changed');
  const n=b.readUInt16LE(i+28),extra=b.readUInt16LE(i+30),comment=b.readUInt16LE(i+32);
  if(b.readUInt16LE(i+8)&1)throw new Error('Encrypted ZIP entry');
  entries.push({name:b.subarray(i+46,i+46+n).toString('utf8'),method:b.readUInt16LE(i+10),compressed:b.readUInt32LE(i+20),size:b.readUInt32LE(i+24),offset:b.readUInt32LE(i+42)});
  i+=46+n+extra+comment;
 }
 if(entries.length!==count)throw new Error('Incomplete ZIP directory');
 return entries;
}
export async function hfZipTexts(url:string,entries:ZipEntry[]):Promise<Map<string,string>> {
 const selected=[...entries].sort((a,b)=>a.offset-b.offset), groups:ZipEntry[][]=[];
 for(const e of selected) {
  if(e.size>200_000 || e.compressed>200_000 || ![0,8].includes(e.method))throw new Error(`Unexpected ZIP report: ${e.name}`);
  const prev=groups.at(-1);
  if(prev && e.offset+e.compressed-prev[0].offset<200_000)prev.push(e);else groups.push([e]);
 }
 const out=new Map<string,string>();
 for(const group of groups) {
  const start=group[0].offset,last=group.at(-1)!;
  const b=await hfZipRange(url,`${start}-${last.offset+30+Buffer.byteLength(last.name)+65535+last.compressed-1}`);
  for(const e of group) {
   const i=e.offset-start;
   if(b.readUInt32LE(i)!==0x04034b50)throw new Error('ZIP local header missing');
   const pos=i+30+b.readUInt16LE(i+26)+b.readUInt16LE(i+28);
   const compressed=b.subarray(pos,pos+e.compressed);
   const value=e.method===8?inflateRawSync(compressed,{maxOutputLength:200_000}):compressed;
   if(value.length!==e.size)throw new Error('ZIP report length mismatch');
   out.set(e.name,value.toString('utf8'));
  }
 }
 return out;
}
