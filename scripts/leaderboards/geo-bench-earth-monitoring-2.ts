// The GEO-Bench-2 Space sorts models by their normalized Core score.
// These rows come from its compiled table and retain each scored submission. A changed file requires a fresh extraction.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = "https://huggingface.co/spaces/aialliance/GEO-Bench-2-Leaderboard/resolve/main/results/compiled.pkl";
const board: Leaderboard = {
  benchmark: "geo-bench-earth-monitoring-2",
  url: "https://huggingface.co/spaces/aialliance/GEO-Bench-2-Leaderboard",
  feed,
  terms: "The Space repository uses Apache 2.0. The linked CSV contains the baseline submission. Hugging Face robots.txt allows the file.",
  parts: {"Multi-Spectral-Dependent":"Multi-Spectral-Dependent","Multi-Temporal":"Multi-Temporal","Pixel-wise":"Pixel-wise","Classification":"Classification","Detection (Object/Instance)":"Detection (Object/Instance)","Under 10m Resolution":"Under 10m Resolution","10m and Above Resolution":"10m and Above Resolution","RGB/NIR":"RGB/NIR"},
  async fetch() {
    return chartRows(feed, '664778491bc8bf64e436b9303d8221406666a620a40966dfc75f64e3f8af0f8d', [
      {"model":"Clay-V1 ViT-B","score":77.8,"params":0.1,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":66.1,"Multi-Temporal":81.7,"Pixel-wise":77.6,"Classification":45.9,"Detection (Object/Instance)":67.8,"Under 10m Resolution":67.4,"10m and Above Resolution":67.3,"RGB/NIR":72.8}},
      {"model":"ConvNext-Large-ImageNet","score":69.9,"params":0.23,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":65.4,"Multi-Temporal":58.8,"Pixel-wise":73.6,"Classification":75.9,"Detection (Object/Instance)":63.1,"Under 10m Resolution":78.7,"10m and Above Resolution":72.3,"RGB/NIR":72.7}},
      {"model":"ConvNext-XLarge-ImageNet","score":77.8,"params":0.39,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":65.8,"Multi-Temporal":65.4,"Pixel-wise":74.2,"Classification":73.8,"Detection (Object/Instance)":95.1,"Under 10m Resolution":81.4,"10m and Above Resolution":69.7,"RGB/NIR":74.3}},
      {"model":"DinoV3-ConvNext-Large-WEB","score":70.8,"params":0.23,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":66.8,"Multi-Temporal":51.9,"Pixel-wise":70.5,"Classification":80.4,"Detection (Object/Instance)":60.4,"Under 10m Resolution":88.5,"10m and Above Resolution":69.2,"RGB/NIR":73.9}},
      {"model":"DinoV3-ViT-L-SAT","score":58.1,"params":0.3,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":53.9,"Multi-Temporal":65.2,"Pixel-wise":67.4,"Classification":77.2,"Detection (Object/Instance)":34.1,"Under 10m Resolution":88.6,"10m and Above Resolution":60.2,"RGB/NIR":86.9}},
      {"model":"DOFA-ViT 300M","score":60.4,"params":0.3,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":59.9,"Multi-Temporal":65.4,"Pixel-wise":65.6,"Classification":66.3,"Detection (Object/Instance)":25.9,"Under 10m Resolution":73.7,"10m and Above Resolution":61.5,"RGB/NIR":68.1}},
      {"model":"Prithvi-EO-V2 300M TL","score":59.4,"params":0.3,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":58.5,"Multi-Temporal":72.4,"Pixel-wise":61.3,"Classification":43.6,"Detection (Object/Instance)":57.2,"Under 10m Resolution":45.7,"10m and Above Resolution":59.1,"RGB/NIR":42.7}},
      {"model":"Prithvi-EO-V2 600M TL","score":68.9,"params":0.6,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":70.2,"Multi-Temporal":77.1,"Pixel-wise":72.2,"Classification":53.4,"Detection (Object/Instance)":39.3,"Under 10m Resolution":56.1,"10m and Above Resolution":69.1,"RGB/NIR":52.3}},
      {"model":"Resnet50-ImageNet","score":26.8,"params":0.025,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":21.2,"Multi-Temporal":11.1,"Pixel-wise":39.9,"Classification":23.9,"Detection (Object/Instance)":23.5,"Under 10m Resolution":43.9,"10m and Above Resolution":28.4,"RGB/NIR":34.1}},
      {"model":"Satlas-SwinB-Naip","score":52.6,"params":0.1,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":49.5,"Multi-Temporal":53.4,"Pixel-wise":57.4,"Classification":43.7,"Detection (Object/Instance)":55.2,"Under 10m Resolution":50.1,"10m and Above Resolution":52.9,"RGB/NIR":46.3}},
      {"model":"Satlas-Swin 100M","score":65.6,"params":0.1,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":65.4,"Multi-Temporal":72,"Pixel-wise":69.5,"Classification":55.4,"Detection (Object/Instance)":62.9,"Under 10m Resolution":48.3,"10m and Above Resolution":70.4,"RGB/NIR":50.9}},
      {"model":"Resnet50-DeCUR","score":28.9,"params":0.025,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":34,"Multi-Temporal":37.1,"Pixel-wise":36.9,"Classification":40.4,"Detection (Object/Instance)":22.7,"Under 10m Resolution":31.2,"10m and Above Resolution":40.4,"RGB/NIR":32.7}},
      {"model":"TerraMind-V1-Base","score":54.7,"params":0.1,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":57.1,"Multi-Temporal":77.4,"Pixel-wise":57.2,"Classification":43,"Detection (Object/Instance)":37.7,"Under 10m Resolution":43.3,"10m and Above Resolution":59.9,"RGB/NIR":39.5}},
      {"model":"TerraMind-V1-Large","score":61.4,"params":0.3,"setting":"Fully fine-tuned, submission 114be1f0","metrics":{"Multi-Spectral-Dependent":71.5,"Multi-Temporal":94.1,"Pixel-wise":71.3,"Classification":63,"Detection (Object/Instance)":43.8,"Under 10m Resolution":63.6,"10m and Above Resolution":72.3,"RGB/NIR":57.3}},
      {"model":"Clay-V1 ViT-B","score":78.6,"params":0.1,"setting":"Fully fine-tuned, submission 2ce4a907","metrics":{"Multi-Spectral-Dependent":68,"Multi-Temporal":83.7,"Pixel-wise":78.4,"Classification":45.9,"Detection (Object/Instance)":67.8,"Under 10m Resolution":67.4,"10m and Above Resolution":68.4,"RGB/NIR":72.8}},
      {"model":"DOFA-ViT 300M","score":61.9,"params":0.3,"setting":"Fully fine-tuned, submission 2ce4a907","metrics":{"Multi-Spectral-Dependent":62,"Multi-Temporal":69.2,"Pixel-wise":67,"Classification":66.6,"Detection (Object/Instance)":25.9,"Under 10m Resolution":73.7,"10m and Above Resolution":62.9,"RGB/NIR":68.1}},
      {"model":"TerraMind-V1-Large","score":67.4,"params":0.3,"setting":"Fully fine-tuned, submission 2ce4a907","metrics":{"Multi-Spectral-Dependent":81.8,"Multi-Temporal":98.1,"Pixel-wise":76.7,"Classification":63.7,"Detection (Object/Instance)":43.5,"Under 10m Resolution":63.4,"10m and Above Resolution":79.6,"RGB/NIR":57.2}}
    ]);
  },
};
export default board;
