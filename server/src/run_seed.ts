import { createCoberturaPorcelanaFunnel } from './seed_cobertura.js';

const funnel = createCoberturaPorcelanaFunnel();
console.log(`✅ Funil "${funnel.name}" criado com sucesso com ${funnel.nodes.length} blocos e ${funnel.edges.length} arestas!`);
process.exit(0);
